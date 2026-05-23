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
  getPaymentActionForUserOrder,
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
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  // Aliases
  payment_id?: string;
  order_id?: string;
  signature?: string;
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

    const razorpayPaymentId =
      paymentData.razorpay_payment_id || paymentData.payment_id;
    const razorpayOrderId =
      paymentData.razorpay_order_id || paymentData.order_id;
    const razorpaySignature =
      paymentData.razorpay_signature || paymentData.signature;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage:
            'Missing required payment fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
        },
      });
      return;
    }

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

    if (String(orderDoc.userId) !== String(userId)) {
      res.status(403).json({
        success: false,
        Response: {
          ReturnMessage: 'Forbidden',
        },
      });
      return;
    }

    const storedRazorpayOrderId = orderDoc.paymentIntentId;
    if (!storedRazorpayOrderId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Order does not have a payment intent ID',
        },
      });
      return;
    }

    if (razorpayOrderId !== storedRazorpayOrderId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Payment order ID does not match this order',
        },
      });
      return;
    }

    if (orderDoc.paymentStatus === 'paid') {
      res.status(200).json({
        success: true,
        data: {
          id: String(orderDoc._id),
          orderNumber: orderDoc.orderNumber,
          totalAmount: orderDoc.totalAmount,
          paymentStatus: orderDoc.paymentStatus,
          status: orderDoc.status,
        },
      });
      return;
    }

    const isVerified = await verifyPayment({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
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

    const orderIdString = String(orderDoc._id);
    let payment = await Payment.findOne({ orderId: orderIdString });

    if (!payment) {
      payment = new Payment({
        orderId: orderIdString,
        gatewayTxnId: razorpayPaymentId,
        gatewayPaymentIntentId: razorpayOrderId,
        amount: Math.round(orderDoc.totalAmount * 100),
        currency: 'INR',
        status: 'completed',
        rawPayload: {
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
          verifiedAt: new Date().toISOString(),
        },
      });
    } else {
      payment.gatewayTxnId = razorpayPaymentId;
      payment.gatewayPaymentIntentId = razorpayOrderId;
      payment.status = 'completed';
      payment.rawPayload = {
        ...(payment.rawPayload || {}),
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        verifiedAt: new Date().toISOString(),
      };
    }

    await payment.save();

    orderDoc.paymentStatus = 'paid';
    orderDoc.status = 'PAYMENT_CONFIRMED';
    orderDoc.timeline.push({
      status: 'PAYMENT_CONFIRMED',
      timestamp: new Date(),
      notes: `Payment verified. Razorpay payment: ${razorpayPaymentId}`,
      actor: 'system',
      actorId: 'system',
    });

    await orderDoc.save();

    logger.info(`Payment verified for order: ${orderDoc.orderNumber}`, {
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      orderId: orderIdString,
    });

    try {
      const { notifyOrderStatusChange } = await import('../../services/order/orderNotificationService');
      await notifyOrderStatusChange({
        userId: orderDoc.userId,
        orderId: orderIdString,
        orderNumber: orderDoc.orderNumber,
        newStatus: 'PAYMENT_CONFIRMED',
        actor: 'system',
      });
    } catch (notificationError) {
      logger.error('Error notifying payment confirmation:', notificationError);
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

/**
 * Get or regenerate Razorpay checkout config for a pending UPI order
 */
export const getPaymentActionController = async (
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

    const paymentAction = await getPaymentActionForUserOrder(orderId, userId);

    res.status(200).json({
      success: true,
      data: { paymentAction },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

