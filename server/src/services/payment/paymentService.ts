import { Order, IOrderDocument, OrderStatus } from '../../models/Order';
import { Payment, IPaymentDocument } from '../../models/Payment';
import { WebhookEvent } from '../../models/WebhookEvent';
import { Dealer } from '../../models/Dealer';
import {
  createPaymentIntent,
  getPaymentStatus,
  getPaymentDetails,
  createPayout,
  refundPayment,
  verifyWebhookSignature,
  IPaymentIntentRequest,
  IPayoutRequest,
} from './gatewayService';
import { logger } from '../../utils/logger';
import { NotFoundError, AppError } from '../../utils/errorHandler';

const COD_CHARGE = parseInt(process.env.COD_CHARGE || '5', 10) * 100; // Convert to paise
const PAYMENT_TIMEOUT_MINUTES = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '15', 10);

/**
 * Process COD order creation
 */
export const processCODOrder = async (orderId: string): Promise<IOrderDocument> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Add COD charge to total
    const codChargeInPaise = COD_CHARGE;
    order.codCharge = codChargeInPaise / 100; // Store in rupees for display
    order.totalAmount = order.totalAmount + codChargeInPaise / 100;
    order.status = 'PENDING_COD';
    order.paymentStatus = 'pending';

    order.timeline.push({
      status: 'PENDING_COD',
      timestamp: new Date(),
      notes: `COD order created. COD charge: ₹${codChargeInPaise / 100}`,
      actor: 'system',
      actorId: 'system',
    });

    await order.save();

    logger.info(`COD order processed: ${order.orderNumber}`, {
      orderId,
      codCharge: codChargeInPaise / 100,
      totalAmount: order.totalAmount,
    });

    return order;
  } catch (error) {
    logger.error('Error processing COD order:', error);
    throw error;
  }
};

/**
 * Process UPI payment - create payment intent
 */
export const processUPIPayment = async (
  orderId: string,
  dealerId?: string,
): Promise<{ order: IOrderDocument; paymentIntent: any }> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate dealer has payout credentials if dealerId exists
    if (dealerId) {
      const dealer = await Dealer.findById(dealerId);
      if (!dealer) {
        throw new NotFoundError('Dealer not found');
      }

      if (!dealer.payout || (!dealer.payout.upiId && !dealer.payout.bank)) {
        throw new AppError(
          'Dealer does not have payout credentials configured. Please contact dealer or choose COD.',
          400,
        );
      }
    }

    // Calculate amount in paise
    const amountInPaise = Math.round(order.totalAmount * 100);

    // Create payment intent
    const paymentIntentRequest: IPaymentIntentRequest = {
      orderId: orderId,
      amount: amountInPaise,
      currency: 'INR',
      notes: {
        orderNumber: order.orderNumber,
        dealerId: dealerId || '',
      },
    };

    const paymentIntent = await createPaymentIntent(paymentIntentRequest);

    // Update order with payment intent ID and expiry
    order.paymentIntentId = paymentIntent.id;
    order.status = 'PENDING_PAYMENT';
    order.paymentStatus = 'pending';
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + PAYMENT_TIMEOUT_MINUTES);
    order.expiresAt = expiresAt;

    order.timeline.push({
      status: 'PENDING_PAYMENT',
      timestamp: new Date(),
      notes: `UPI payment intent created. Expires at ${expiresAt.toISOString()}`,
      actor: 'system',
      actorId: 'system',
    });

    await order.save();

    // Create payment record
    const payment = new Payment({
      orderId: orderId,
      gatewayPaymentIntentId: paymentIntent.id,
      amount: amountInPaise,
      currency: 'INR',
      status: 'pending',
      rawPayload: paymentIntent,
    });

    await payment.save();

    logger.info(`UPI payment intent created for order: ${order.orderNumber}`, {
      orderId,
      paymentIntentId: paymentIntent.id,
      expiresAt: expiresAt.toISOString(),
    });

    return { order, paymentIntent };
  } catch (error) {
    logger.error('Error processing UPI payment:', error);
    throw error;
  }
};

/**
 * Handle payment webhook events
 */
export const handlePaymentWebhook = async (webhookData: any): Promise<void> => {
  try {
    const eventId = webhookData.event || webhookData.id || webhookData.entity?.id;

    if (!eventId) {
      logger.error('Webhook event ID missing', webhookData);
      throw new AppError('Invalid webhook data: missing event ID', 400);
    }

    // Check if webhook already processed (idempotency)
    const existingEvent = await WebhookEvent.findOne({ gatewayEventId: eventId });
    if (existingEvent && existingEvent.processed) {
      logger.info(`Webhook event already processed: ${eventId}`);
      return;
    }

    // Store webhook event
    const webhookEvent = existingEvent || new WebhookEvent({
      gatewayEventId: eventId,
      payload: webhookData,
      verified: false,
      processed: false,
    });

    // Verify signature if signature provided
    if (webhookData.signature) {
      const payloadString = JSON.stringify(webhookData.payload || webhookData);
      const isValid = verifyWebhookSignature(payloadString, webhookData.signature);
      webhookEvent.verified = isValid;
      webhookEvent.signature = webhookData.signature;

      if (!isValid) {
        logger.warn(`Webhook signature verification failed for event: ${eventId}`);
        webhookEvent.error = 'Signature verification failed';
        await webhookEvent.save();
        throw new AppError('Webhook signature verification failed', 401);
      }
    }

    await webhookEvent.save();

    // Process different event types
    const eventType = webhookData.event || webhookData.entity?.event;

    if (eventType === 'payment.captured' || eventType === 'payment.success') {
      await handlePaymentSuccess(webhookData);
    } else if (eventType === 'payment.failed' || eventType === 'payment.failure') {
      await handlePaymentFailure(webhookData);
    } else if (eventType === 'payout.processed' || eventType === 'payout.success') {
      await handlePayoutSuccess(webhookData);
    } else if (eventType === 'payout.failed' || eventType === 'payout.failure') {
      await handlePayoutFailure(webhookData);
    } else {
      logger.info(`Unhandled webhook event type: ${eventType}`, { eventId });
    }

    // Mark as processed
    webhookEvent.processed = true;
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();

    logger.info(`Webhook event processed: ${eventId}`, { eventType });
  } catch (error) {
    logger.error('Error handling payment webhook:', error);
    throw error;
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (webhookData: any): Promise<void> => {
  try {
    const paymentData = webhookData.payload?.payment?.entity || webhookData.payload?.payment || webhookData;
    const paymentId = paymentData.id;
    const orderId = paymentData.notes?.orderId || paymentData.order_id;

    if (!paymentId) {
      logger.error('Payment ID missing in webhook', webhookData);
      return;
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);

    // Find order by payment intent ID or order ID from notes
    let order = await Order.findOne({ paymentIntentId: paymentDetails.order_id });

    if (!order && orderId) {
      order = await Order.findById(orderId);
    }

    if (!order) {
      logger.error(`Order not found for payment: ${paymentId}`, { paymentDetails });
      return;
    }

    // Verify payment amount matches order amount
    const expectedAmount = Math.round(order.totalAmount * 100); // in paise
    const paidAmount = paymentDetails.amount;

    if (paidAmount !== expectedAmount) {
      logger.warn(`Payment amount mismatch for order ${order.orderNumber}`, {
        expected: expectedAmount,
        paid: paidAmount,
      });
      // Flag for manual review but still process
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'PAYMENT_CONFIRMED';

    order.timeline.push({
      status: 'PAYMENT_CONFIRMED',
      timestamp: new Date(),
      notes: `Payment confirmed via UPI. Payment ID: ${paymentId}`,
      actor: 'system',
      actorId: 'system',
    });

    await order.save();

    // Update or create payment record
    const orderIdString = String(order._id);
    let payment = await Payment.findOne({ orderId: orderIdString });
    if (!payment) {
      payment = new Payment({
        orderId: orderIdString,
        gatewayTxnId: paymentId,
        gatewayPaymentIntentId: paymentDetails.order_id,
        amount: paidAmount,
        currency: paymentDetails.currency || 'INR',
        status: 'completed',
        rawPayload: paymentDetails,
      });
    } else {
      payment.gatewayTxnId = paymentId;
      payment.status = 'completed';
      payment.rawPayload = paymentDetails;
    }

    await payment.save();

    // Initiate payout to dealer if dealer exists
    if (order.dealerId) {
      try {
        await initiateDealerPayout(orderIdString);
      } catch (payoutError) {
        logger.error('Error initiating dealer payout:', payoutError);
        // Mark payout as failed but don't fail the payment processing
        const payment = await Payment.findOne({ orderId: orderIdString });
        if (payment) {
          payment.payoutStatus = 'failed';
          await payment.save();
        }
      }
    }

    logger.info(`Payment confirmed for order: ${order.orderNumber}`, {
      paymentId,
      amount: paidAmount,
    });
  } catch (error) {
    logger.error('Error handling payment success:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (webhookData: any): Promise<void> => {
  try {
    const paymentData = webhookData.payload?.payment?.entity || webhookData.payload?.payment || webhookData;
    const paymentId = paymentData.id;
    const orderId = paymentData.notes?.orderId;

    // Find order
    let order = await Order.findOne({ paymentIntentId: paymentData.order_id });
    if (!order && orderId) {
      order = await Order.findById(orderId);
    }

    if (!order) {
      logger.error(`Order not found for failed payment: ${paymentId}`);
      return;
    }

    // Update order status
    order.paymentStatus = 'failed';
    order.status = 'PAYMENT_FAILED';

    order.timeline.push({
      status: 'PAYMENT_FAILED',
      timestamp: new Date(),
      notes: `Payment failed. Payment ID: ${paymentId}. Reason: ${paymentData.error_description || 'Unknown'}`,
      actor: 'system',
      actorId: 'system',
    });

    await order.save();

    // Update payment record
    const orderIdString = String(order._id);
    let payment = await Payment.findOne({ orderId: orderIdString });
    if (!payment) {
      payment = new Payment({
        orderId: orderIdString,
        gatewayTxnId: paymentId,
        gatewayPaymentIntentId: paymentData.order_id,
        amount: paymentData.amount || 0,
        currency: paymentData.currency || 'INR',
        status: 'failed',
        rawPayload: paymentData,
      });
    } else {
      payment.gatewayTxnId = paymentId;
      payment.status = 'failed';
      payment.rawPayload = paymentData;
    }

    await payment.save();

    // Restore stock for failed payment
    const { Product } = await import('../../models/Product');
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        if (product.status === 'out_of_stock' && product.stock > 0) {
          product.status = 'active';
        }
        await product.save();
      }
    }

    logger.info(`Payment failed for order: ${order.orderNumber}`, {
      paymentId,
      reason: paymentData.error_description,
    });
  } catch (error) {
    logger.error('Error handling payment failure:', error);
    throw error;
  }
};

/**
 * Initiate payout to dealer
 */
export const initiateDealerPayout = async (orderId: string): Promise<void> => {
  try {
    const order = await Order.findById(orderId);

    if (!order || !order.dealerId) {
      throw new NotFoundError('Order or dealer not found');
    }

    const dealer = await Dealer.findById(order.dealerId);
    if (!dealer || !dealer.payout) {
      throw new AppError('Dealer payout credentials not configured', 400);
    }

    // Get payment record
    const payment = await Payment.findOne({ orderId: orderId });
    if (!payment || payment.status !== 'completed') {
      throw new AppError('Payment not completed', 400);
    }

    // Check if payout already exists
    if (payment.payoutId && payment.payoutStatus === 'completed') {
      logger.info(`Payout already completed for order: ${order.orderNumber}`);
      return;
    }

    // Calculate payout amount (order total minus platform fees if any)
    const payoutAmount = Math.round(order.totalAmount * 100); // in paise
    // TODO: Subtract platform fees if applicable

    const payoutRequest: IPayoutRequest = {
      amount: payoutAmount,
      currency: 'INR',
      mode: dealer.payout.type === 'UPI' ? 'UPI' : 'NEFT',
      purpose: 'payout',
      queueIfLowBalance: true,
      referenceId: `payout_${order.orderNumber}`,
      notes: {
        orderId: orderId,
        orderNumber: order.orderNumber,
        dealerId: String(dealer._id),
      },
    };

    if (dealer.payout.type === 'UPI' && dealer.payout.upiId) {
      payoutRequest.fundAccount = {
        account_type: 'vpa',
        vpa: {
          address: dealer.payout.upiId,
        },
      };
    } else if (dealer.payout.bank) {
      payoutRequest.accountNumber = dealer.payout.bank.accountNumber;
      payoutRequest.ifsc = dealer.payout.bank.ifsc;
      payoutRequest.fundAccount = {
        account_type: 'bank_account',
        bank_account: {
          name: dealer.payout.bank.accountName,
          ifsc: dealer.payout.bank.ifsc,
          account_number: dealer.payout.bank.accountNumber,
        },
      };
    }

    // Create payout
    const payout = await createPayout(payoutRequest);

    // Update payment record
    payment.payoutId = payout.id;
    payment.payoutStatus = payout.status as any;
    await payment.save();

    logger.info(`Payout initiated for order: ${order.orderNumber}`, {
      payoutId: payout.id,
      amount: payoutAmount,
      status: payout.status,
    });
  } catch (error) {
    logger.error('Error initiating dealer payout:', error);
    throw error;
  }
};

/**
 * Handle payout success
 */
const handlePayoutSuccess = async (webhookData: any): Promise<void> => {
  try {
    const payoutData = webhookData.payload?.payout?.entity || webhookData.payload?.payout || webhookData;
    const payoutId = payoutData.id;
    const orderId = payoutData.notes?.orderId;

    if (!payoutId) {
      logger.error('Payout ID missing in webhook', webhookData);
      return;
    }

    // Find payment by payout ID
    const payment = await Payment.findOne({ payoutId: payoutId });
    if (!payment) {
      logger.error(`Payment not found for payout: ${payoutId}`);
      return;
    }

    payment.payoutStatus = 'completed';
    await payment.save();

    logger.info(`Payout completed: ${payoutId}`, {
      orderId: payment.orderId,
    });
  } catch (error) {
    logger.error('Error handling payout success:', error);
    throw error;
  }
};

/**
 * Handle payout failure
 */
const handlePayoutFailure = async (webhookData: any): Promise<void> => {
  try {
    const payoutData = webhookData.payload?.payout?.entity || webhookData.payload?.payout || webhookData;
    const payoutId = payoutData.id;

    if (!payoutId) {
      logger.error('Payout ID missing in webhook', webhookData);
      return;
    }

    // Find payment by payout ID
    const payment = await Payment.findOne({ payoutId: payoutId });
    if (!payment) {
      logger.error(`Payment not found for failed payout: ${payoutId}`);
      return;
    }

    payment.payoutStatus = 'failed';
    await payment.save();

    logger.warn(`Payout failed: ${payoutId}`, {
      orderId: payment.orderId,
      reason: payoutData.error_description,
    });
  } catch (error) {
    logger.error('Error handling payout failure:', error);
    throw error;
  }
};

/**
 * Handle refund
 */
export const handleRefund = async (
  orderId: string,
  amount?: number,
  reason?: string,
): Promise<any> => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const payment = await Payment.findOne({ orderId: orderId });
    if (!payment || !payment.gatewayTxnId) {
      throw new AppError('Payment not found or not eligible for refund', 400);
    }

    const refundAmount = amount ? Math.round(amount * 100) : undefined; // in paise

    const refund = await refundPayment(payment.gatewayTxnId, refundAmount, {
      orderId: orderId,
      orderNumber: order.orderNumber,
      reason: reason || 'Customer request',
    });

    // Update payment record
    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundAmount = refund.amount;
    await payment.save();

    // Update order status
    order.paymentStatus = 'refunded';
    order.status = 'REFUND_INITIATED';

    order.timeline.push({
      status: 'REFUND_INITIATED',
      timestamp: new Date(),
      notes: `Refund initiated. Refund ID: ${refund.id}. Amount: ₹${refund.amount / 100}. Reason: ${reason || 'Customer request'}`,
      actor: 'system',
      actorId: 'system',
    });

    await order.save();

    logger.info(`Refund initiated for order: ${order.orderNumber}`, {
      refundId: refund.id,
      amount: refund.amount,
    });

    return refund;
  } catch (error) {
    logger.error('Error handling refund:', error);
    throw error;
  }
};

/**
 * Check payment timeout and mark as failed if expired
 */
export const checkPaymentTimeouts = async (): Promise<void> => {
  try {
    const now = new Date();
    const expiredOrders = await Order.find({
      status: 'PENDING_PAYMENT',
      expiresAt: { $lt: now },
    });

    for (const order of expiredOrders) {
      order.status = 'PAYMENT_FAILED';
      order.paymentStatus = 'failed';

      order.timeline.push({
        status: 'PAYMENT_FAILED',
        timestamp: new Date(),
        notes: 'Payment expired - timeout exceeded',
        actor: 'system',
        actorId: 'system',
      });

      await order.save();

      logger.info(`Payment timeout for order: ${order.orderNumber}`);
    }
  } catch (error) {
    logger.error('Error checking payment timeouts:', error);
  }
};

