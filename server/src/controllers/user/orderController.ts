import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { Order } from '../../models/Order';
import { Payment } from '../../models/Payment';
import {
  createUserOrder,
  getUserOrders,
  getUserOrderById,
  cancelUserOrder,
  requestReturn,
} from '../../services/user/orderService';
import { verifyPayment } from '../../services/paymentService';

export interface ICreateUserOrderRequest {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'cash_on_delivery';
  dealerId?: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface IVerifyPaymentRequest {
  payment_id: string;
  order_id: string;
  payment_session_id?: string;
  // Legacy fields for backward compatibility
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  paymentId?: string;
  transactionId?: string;
}

/**
 * Create order controller
 */
export const createOrderController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const orderData: ICreateUserOrderRequest = req.body;

    const order = await createUserOrder(userId, orderData);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Error in createOrderController:', error);
    
    if (error instanceof Error) {
      errorHandler(error as IAppError, res);
    } else {
      const errorMessage = error?.message || 'Failed to create order';
      res.status(500).json({
        success: false,
        Response: {
          ReturnMessage: errorMessage,
        },
      });
    }
  }
};

/**
 * Verify payment controller
 */
export const verifyPaymentController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.id;
    const paymentData: IVerifyPaymentRequest = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    // Extract Cashfree payment response fields (with backward compatibility for Razorpay)
    const paymentId = paymentData.payment_id || paymentData.razorpay_payment_id;
    const cashfreeOrderId = paymentData.order_id || paymentData.razorpay_order_id;

    if (!cashfreeOrderId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Missing required payment field: order_id',
        },
      });
      return;
    }

    // Note: payment_id is optional - server will fetch it from Cashfree if not provided

    // Get order document for direct manipulation
    const orderDoc = await Order.findById(orderId);

    if (!orderDoc) {
      res.status(404).json({
        success: false,
        Response: {
          ReturnMessage: 'Order not found',
        },
      });
      return;
    }

    // Verify user owns the order (handle ObjectId vs string safely)
    if (String(orderDoc.userId) !== String(userId)) {
      res.status(403).json({
        success: false,
        Response: {
          ReturnMessage: 'Forbidden',
        },
      });
      return;
    }

    // Get the stored Cashfree order_id from order's paymentIntentId
    const serverOrderId = orderDoc.paymentIntentId;
    if (!serverOrderId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Order does not have a payment intent ID',
        },
      });
      return;
    }

    // Verify payment using Cashfree API
    const isVerified = await verifyPayment({
      payment_id: paymentId || undefined,
      order_id: cashfreeOrderId,
      payment_session_id: paymentData.payment_session_id,
      // Legacy fields for backward compatibility
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_signature: paymentData.razorpay_signature,
    });

    if (!isVerified) {
      orderDoc.paymentStatus = 'failed';
      orderDoc.timeline.push({
        status: orderDoc.status,
        timestamp: new Date(),
        notes: 'Payment verification failed',
        actor: 'system',
        actorId: 'system',
      });
      await orderDoc.save();

      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Payment verification failed',
        },
      });
      return;
    }

    // If payment_id was not provided, try to fetch it from Cashfree order
    let finalPaymentId = paymentId;
    if (!finalPaymentId) {
      try {
        const { cashfreeClient } = await import('../../config/cashfree');
        const paymentsResponse = await cashfreeClient!.PGOrderFetchPayments(cashfreeOrderId);
        if (paymentsResponse.data && paymentsResponse.data.length > 0) {
          const payment = paymentsResponse.data[0];
          finalPaymentId = payment.cf_payment_id?.toString();
        }
      } catch (error) {
        logger.warn('Could not fetch payment_id from Cashfree order', { cashfreeOrderId, error });
      }
    }

    // Store payment response fields in Payment model
    const orderIdString = String(orderDoc._id);
    let payment = await Payment.findOne({ orderId: orderIdString });
    
    if (!payment) {
      payment = new Payment({
        orderId: orderIdString,
        gatewayTxnId: finalPaymentId || '',
        gatewayPaymentIntentId: cashfreeOrderId,
        amount: Math.round(orderDoc.totalAmount * 100), // in paise
        currency: 'INR',
        status: 'completed',
        rawPayload: {
          payment_id: finalPaymentId,
          order_id: cashfreeOrderId,
          payment_session_id: paymentData.payment_session_id,
          verifiedAt: new Date().toISOString(),
        },
      });
    } else {
      if (finalPaymentId) {
        payment.gatewayTxnId = finalPaymentId;
      }
      payment.gatewayPaymentIntentId = cashfreeOrderId;
      payment.status = 'completed';
      payment.rawPayload = {
        ...(payment.rawPayload || {}),
        payment_id: finalPaymentId,
        order_id: cashfreeOrderId,
        payment_session_id: paymentData.payment_session_id,
        verifiedAt: new Date().toISOString(),
      };
    }

    await payment.save();

    // Update order status only after successful verification
    orderDoc.paymentStatus = 'paid';
    orderDoc.status = 'PAYMENT_CONFIRMED';
    orderDoc.timeline.push({
      status: 'PAYMENT_CONFIRMED',
      timestamp: new Date(),
      notes: `Payment verified. Payment ID: ${paymentId}`,
      actor: 'system',
      actorId: 'system',
    });

    await orderDoc.save();

    logger.info(`Payment verified for order: ${orderDoc.orderNumber}`, {
      payment_id: paymentId,
      order_id: cashfreeOrderId,
      orderId: orderIdString,
    });

    // Send push notification for payment confirmation
    try {
      const { sendPushNotification } = await import('../../services/notificationService');
      await sendPushNotification(orderDoc.userId, {
        title: 'Payment Confirmed',
        body: `Payment for order ${orderDoc.orderNumber} has been confirmed. Your order is being processed.`,
        data: {
          type: 'payment',
          orderId: orderIdString,
          status: 'PAYMENT_CONFIRMED',
        },
      });
    } catch (notificationError) {
      logger.error('Error sending push notification for payment confirmation:', notificationError);
      // Don't throw - notification failure shouldn't block payment verification
    }

    res.status(200).json({
      success: true,
      data: {
        id: (orderDoc._id as any).toString(),
        orderNumber: orderDoc.orderNumber,
        totalAmount: orderDoc.totalAmount,
        paymentStatus: orderDoc.paymentStatus,
        status: orderDoc.status,
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user orders controller
 */
export const getUserOrdersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await getUserOrders(userId, query);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get order by ID controller
 */
export const getOrderByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const order = await getUserOrderById(orderId, userId);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Cancel order controller
 */
export const cancelOrderController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Cancellation reason is required',
        },
      });
      return;
    }

    const order = await cancelUserOrder(orderId, userId, { reason });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Request return controller
 */
export const requestReturnController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const { reason, images } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Return reason is required',
        },
      });
      return;
    }

    const order = await requestReturn(orderId, userId, { reason, images });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get order status controller
 */
export const getOrderStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const order = await getUserOrderById(orderId, userId);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentDetails: {
          // Include payment intent ID if UPI
          paymentIntentId: (order as any).paymentIntentId,
        },
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

