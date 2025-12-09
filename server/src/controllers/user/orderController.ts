import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { Order } from '../../models/Order';
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
  paymentId: string;
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

    // Verify user owns the order
    if (orderDoc.userId !== userId) {
      res.status(403).json({
        success: false,
        Response: {
          ReturnMessage: 'Forbidden',
        },
      });
      return;
    }

    const isVerified = await verifyPayment(paymentData);

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

    orderDoc.paymentStatus = 'paid';
    orderDoc.status = 'PAYMENT_CONFIRMED';
    orderDoc.timeline.push({
      status: 'PAYMENT_CONFIRMED',
      timestamp: new Date(),
      notes: 'Payment verified',
      actor: 'system',
      actorId: 'system',
    });

    await orderDoc.save();

    logger.info(`Payment verified for order: ${orderDoc.orderNumber}`, {
      paymentId: paymentData.paymentId,
    });

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

