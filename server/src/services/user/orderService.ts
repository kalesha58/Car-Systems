import { Order, IOrderDocument, OrderStatus, TimelineActor } from '../../models/Order';
import { OrderStatusLog } from '../../models/OrderStatusLog';
import { ReturnRequest } from '../../models/ReturnRequest';
import { SignUp } from '../../models/SignUp';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import {
  validateStatusTransitionOrThrow,
  canUserCancel,
  canRequestReturn,
} from '../../utils/orderStatusValidator';

export interface IUserOrder {
  id: string;
  orderNumber: string;
  userId: string;
  dealerId?: string;
  items: any[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: any;
  billingAddress: any;
  tracking?: any;
  timeline: any[];
  cancellationReason?: string;
  documents?: any[];
  returnRequest?: any;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface IGetUserOrdersRequest {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICancelUserOrderRequest {
  reason: string;
}

export interface IReturnOrderRequest {
  reason: string;
  images?: string[];
}

/**
 * Generate unique order number
 */
const generateOrderNumber = (): string => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Convert order document to user order interface
 */
const orderToUserOrder = (orderDoc: IOrderDocument): IUserOrder => {
  return {
    id: (orderDoc._id as any).toString(),
    orderNumber: orderDoc.orderNumber,
    userId: orderDoc.userId,
    dealerId: orderDoc.dealerId,
    items: orderDoc.items,
    subtotal: orderDoc.subtotal,
    tax: orderDoc.tax,
    shipping: orderDoc.shipping,
    totalAmount: orderDoc.totalAmount,
    status: orderDoc.status,
    paymentStatus: orderDoc.paymentStatus,
    paymentMethod: orderDoc.paymentMethod,
    shippingAddress: orderDoc.shippingAddress,
    billingAddress: orderDoc.billingAddress,
    tracking: orderDoc.tracking,
    timeline: orderDoc.timeline.map((event) => ({
      status: event.status,
      timestamp: event.timestamp,
      notes: event.notes,
      actor: event.actor,
      actorId: event.actorId,
      previousStatus: event.previousStatus,
    })),
    cancellationReason: orderDoc.cancellationReason,
    documents: orderDoc.documents,
    returnRequest: orderDoc.returnRequest,
    expectedDeliveryDate: orderDoc.expectedDeliveryDate?.toISOString(),
    createdAt: orderDoc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: orderDoc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Log status change
 */
const logStatusChange = async (
  orderId: string,
  previousStatus: OrderStatus | undefined,
  newStatus: OrderStatus,
  actor: TimelineActor,
  actorId: string,
  notes?: string,
): Promise<void> => {
  try {
    await OrderStatusLog.create({
      orderId,
      previousStatus,
      newStatus,
      actor,
      actorId,
      timestamp: new Date(),
      notes,
    });
  } catch (error) {
    logger.error('Error logging status change:', error);
  }
};

/**
 * Create order
 */
export const createUserOrder = async (
  userId: string,
  data: ICreateUserOrderRequest,
): Promise<IUserOrder> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { Settings } = await import('../../models/Settings');
    const settings = await Settings.findOne() || (await Settings.create({}));

    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const tax = (subtotal * settings.taxRate) / 100;
    const shipping = settings.shippingCost;
    const totalAmount = subtotal + tax + shipping;

    const order = new Order({
      orderNumber: generateOrderNumber(),
      userId,
      dealerId: data.dealerId,
      items: data.items,
      subtotal,
      tax,
      shipping,
      totalAmount,
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress,
      billingAddress: data.shippingAddress,
      status: 'ORDER_PLACED',
      paymentStatus: 'pending',
      timeline: [
        {
          status: 'ORDER_PLACED',
          timestamp: new Date(),
          notes: 'Order created',
          actor: 'user',
          actorId: userId,
        },
      ],
    });

    await order.save();

    await logStatusChange(
      (order._id as any).toString(),
      undefined,
      'ORDER_PLACED',
      'user',
      userId,
      'Order created',
    );

    // TESTING: Auto-confirm payment for UPI/COD (Remove when implementing real payment gateway)
    // TODO: Remove this block when implementing actual payment gateway integration
    if (data.paymentMethod === 'upi' || data.paymentMethod === 'cash_on_delivery') {
      const previousStatus = order.status;
      order.paymentStatus = 'paid';
      order.status = 'PAYMENT_CONFIRMED';
      
      const paymentNote = data.paymentMethod === 'upi' 
        ? 'Payment auto-confirmed for testing (UPI)' 
        : 'Payment auto-confirmed for testing (COD)';
      
      order.timeline.push({
        status: 'PAYMENT_CONFIRMED',
        timestamp: new Date(),
        notes: paymentNote,
        actor: 'system',
        actorId: 'system',
        previousStatus,
      });
      
      await order.save();
      
      await logStatusChange(
        (order._id as any).toString(),
        previousStatus,
        'PAYMENT_CONFIRMED',
        'system',
        'system',
        paymentNote,
      );
      
      logger.info(`Payment auto-confirmed for testing: ${order.orderNumber} (${data.paymentMethod})`);
    }

    logger.info(`New order created: ${order.orderNumber}`);

    return orderToUserOrder(order);
  } catch (error) {
    logger.error('Error creating user order:', error);
    throw error;
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (
  userId: string,
  query: IGetUserOrdersRequest,
): Promise<{ orders: IUserOrder[]; pagination: any }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders.map(orderToUserOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting user orders:', error);
    throw error;
  }
};

/**
 * Get order by ID
 */
export const getUserOrderById = async (
  orderId: string,
  userId: string,
): Promise<IUserOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized to access this order', 403);
    }

    return orderToUserOrder(order);
  } catch (error) {
    logger.error('Error getting user order by ID:', error);
    throw error;
  }
};

/**
 * Cancel order
 */
export const cancelUserOrder = async (
  orderId: string,
  userId: string,
  data: ICancelUserOrderRequest,
): Promise<IUserOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized to cancel this order', 403);
    }

    if (!canUserCancel(order.status)) {
      throw new AppError(
        `Cannot cancel order in current status: ${order.status}`,
        400,
      );
    }

    const previousStatus = order.status;
    order.status = 'CANCELLED_BY_USER';
    order.cancellationReason = data.reason;
    order.timeline.push({
      status: 'CANCELLED_BY_USER',
      timestamp: new Date(),
      notes: data.reason,
      actor: 'user',
      actorId: userId,
      previousStatus,
    });

    await order.save();

    await logStatusChange(
      orderId,
      previousStatus,
      'CANCELLED_BY_USER',
      'user',
      userId,
      data.reason,
    );

    logger.info(`Order cancelled by user: ${order.orderNumber}`);

    return orderToUserOrder(order);
  } catch (error) {
    logger.error('Error cancelling user order:', error);
    throw error;
  }
};

/**
 * Request return
 */
export const requestReturn = async (
  orderId: string,
  userId: string,
  data: IReturnOrderRequest,
): Promise<IUserOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized to request return for this order', 403);
    }

    if (!canRequestReturn(order.status)) {
      throw new AppError(
        `Cannot request return for order in current status: ${order.status}`,
        400,
      );
    }

    if (order.returnRequest) {
      throw new AppError('Return request already exists for this order', 400);
    }

    const previousStatus = order.status;
    order.status = 'RETURN_REQUESTED';
    order.returnRequest = {
      reason: data.reason,
      images: data.images || [],
      status: 'pending',
      requestedAt: new Date(),
    };

    order.timeline.push({
      status: 'RETURN_REQUESTED',
      timestamp: new Date(),
      notes: `Return requested: ${data.reason}`,
      actor: 'user',
      actorId: userId,
      previousStatus,
    });

    await order.save();

    await ReturnRequest.create({
      orderId,
      userId,
      dealerId: order.dealerId,
      reason: data.reason,
      images: data.images || [],
      status: 'pending',
      requestedAt: new Date(),
    });

    await logStatusChange(
      orderId,
      previousStatus,
      'RETURN_REQUESTED',
      'user',
      userId,
      data.reason,
    );

    logger.info(`Return requested for order: ${order.orderNumber}`);

    return orderToUserOrder(order);
  } catch (error) {
    logger.error('Error requesting return:', error);
    throw error;
  }
};

