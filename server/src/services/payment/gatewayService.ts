import Razorpay from 'razorpay';
import { razorpayClient, RAZORPAY_WEBHOOK_SECRET, isRazorpayEnabled } from '../../config/razorpay';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

export interface IPaymentIntentRequest {
  orderId: string;
  amount: number; // in paise
  currency?: string;
  notes?: Record<string, string>;
}

export interface IPaymentIntentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  upi?: {
    vpa?: string;
    flow?: string;
  };
  notes?: Record<string, string>;
}

export interface IPayoutRequest {
  amount: number; // in paise
  currency?: string;
  accountNumber?: string;
  ifsc?: string;
  fundAccount?: {
    account_type: string;
    bank_account?: {
      name: string;
      ifsc: string;
      account_number: string;
    };
    vpa?: {
      address: string;
    };
  };
  mode?: string;
  purpose?: string;
  queueIfLowBalance?: boolean;
  referenceId?: string;
  notes?: Record<string, string>;
}

export interface IPayoutResponse {
  id: string;
  entity: string;
  fund_account_id?: string;
  amount: number;
  currency: string;
  fees: number;
  tax: number;
  status: string;
  utr?: string;
  mode: string;
  reference_id: string;
  notes?: Record<string, string>;
  created_at: number;
}

/**
 * Create UPI payment intent
 */
export const createPaymentIntent = async (
  request: IPaymentIntentRequest,
): Promise<IPaymentIntentResponse> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const options = {
      amount: request.amount, // amount in paise
      currency: request.currency || 'INR',
      receipt: `order_${request.orderId}`,
      payment_capture: 1,
      notes: {
        orderId: request.orderId,
        ...request.notes,
      },
    };

    const order = await razorpayClient!.orders.create(options);

    logger.info(`Payment intent created for order ${request.orderId}`, {
      razorpayOrderId: order.id,
    });

    return {
      id: order.id,
      amount: typeof order.amount === 'number' ? order.amount : parseInt(String(order.amount), 10),
      currency: order.currency,
      status: order.status,
      method: 'upi',
      notes: order.notes ? (typeof order.notes === 'object' && !Array.isArray(order.notes) 
        ? Object.fromEntries(Object.entries(order.notes).map(([k, v]) => [k, String(v ?? '')]))
        : {}) : undefined,
    };
  } catch (error: any) {
    logger.error('Error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  payload: string | object,
  signature: string,
): boolean => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    logger.warn('Webhook secret not configured, skipping signature verification');
    return true; // In development, allow if secret not set
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      logger.warn('Webhook signature verification failed', {
        expected: expectedSignature,
        received: signature,
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Get payment status from Razorpay
 */
export const getPaymentStatus = async (
  paymentIntentId: string,
): Promise<IPaymentIntentResponse | null> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const order = await razorpayClient!.orders.fetch(paymentIntentId);

    return {
      id: order.id,
      amount: typeof order.amount === 'number' ? order.amount : parseInt(String(order.amount), 10),
      currency: order.currency,
      status: order.status,
      method: 'upi',
      notes: order.notes ? (typeof order.notes === 'object' && !Array.isArray(order.notes) 
        ? Object.fromEntries(Object.entries(order.notes).map(([k, v]) => [k, String(v ?? '')]))
        : {}) : undefined,
    };
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    logger.error('Error fetching payment status:', error);
    throw new Error(`Failed to fetch payment status: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get payment details by payment ID
 */
export const getPaymentDetails = async (paymentId: string): Promise<any> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const payment = await razorpayClient!.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    logger.error('Error fetching payment details:', error);
    throw new Error(`Failed to fetch payment details: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Create payout to dealer
 * Note: This requires Razorpay X (payouts) API or connected account setup
 * For now, this is a placeholder that can be extended based on your Razorpay plan
 */
export const createPayout = async (request: IPayoutRequest): Promise<IPayoutResponse> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    // Note: Razorpay payouts require RazorpayX account
    // This is a simplified implementation - adjust based on your Razorpay plan
    const payoutData: any = {
      account_number: request.accountNumber || 'default',
      fund_account: request.fundAccount || {
        account_type: 'bank_account',
        bank_account: {
          name: 'Dealer',
          ifsc: request.ifsc || '',
          account_number: request.accountNumber || '',
        },
      },
      amount: request.amount,
      currency: request.currency || 'INR',
      mode: request.mode || 'NEFT',
      purpose: request.purpose || 'payout',
      queue_if_low_balance: request.queueIfLowBalance !== false,
      reference_id: request.referenceId || `payout_${Date.now()}`,
      notes: request.notes || {},
    };

    // If UPI payout
    if (request.fundAccount?.vpa) {
      payoutData.fund_account = {
        account_type: 'vpa',
        vpa: request.fundAccount.vpa,
      };
    }

    // Note: This endpoint may vary based on your Razorpay plan
    // For RazorpayX: razorpayClient.payouts.create()
    // For marketplace: Use transfers API
    const payout = await (razorpayClient as any).payouts?.create(payoutData);

    logger.info('Payout created', {
      payoutId: payout.id,
      amount: payout.amount,
    });

    return {
      id: payout.id,
      entity: payout.entity,
      amount: payout.amount,
      currency: payout.currency,
      fees: payout.fees || 0,
      tax: payout.tax || 0,
      status: payout.status,
      utr: payout.utr,
      mode: payout.mode,
      reference_id: payout.reference_id,
      notes: payout.notes,
      created_at: payout.created_at,
    };
  } catch (error: any) {
    logger.error('Error creating payout:', error);
    // If payouts API not available, log and return a mock response
    // In production, you may need to use RazorpayX or manual payout process
    if (error.statusCode === 404 || error.message?.includes('payouts')) {
      logger.warn('Payouts API not available. Using manual payout process.');
      // Return a pending payout record that can be processed manually
      return {
        id: `manual_${Date.now()}`,
        entity: 'payout',
        amount: request.amount,
        currency: request.currency || 'INR',
        fees: 0,
        tax: 0,
        status: 'pending',
        mode: request.mode || 'NEFT',
        reference_id: request.referenceId || `payout_${Date.now()}`,
        notes: request.notes,
        created_at: Math.floor(Date.now() / 1000),
      };
    }
    throw new Error(`Failed to create payout: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>,
): Promise<any> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const refundData: any = {
      notes: notes || {},
    };

    if (amount) {
      refundData.amount = amount; // in paise
    }

    const refund = await razorpayClient!.payments.refund(paymentId, refundData);

    logger.info('Refund created', {
      refundId: refund.id,
      paymentId,
      amount: refund.amount,
    });

    return refund;
  } catch (error: any) {
    logger.error('Error creating refund:', error);
    throw new Error(`Failed to create refund: ${error.message || 'Unknown error'}`);
  }
};

