import {
  Order,
  IOrderDocument,
  OrderStatus,
  TimelineActor,
} from '../../models/Order';
import { OrderStatusLog } from '../../models/OrderStatusLog';
import { SignUp } from '../../models/SignUp';
import { Dealer } from '../../models/Dealer';
import { Settings } from '../../models/Settings';
import {
  IGetOrdersRequest,
  ICreateOrderRequest,
  IUpdateOrderStatusRequest,
  ICancelOrderRequest,
  IAssignDealerRequest,
  IAddTrackingRequest,
  IOrder,
  IPaginationResponse,
} from '../../types/admin';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { validateStatusTransitionOrThrow } from '../../utils/orderStatusValidator';
import { emitToOrderRoom } from '../socket/socketService';

/**
 * Generate unique order number
 */
const generateOrderNumber = (): string => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Convert order document to IOrder interface
 */
const orderToIOrder = async (orderDoc: IOrderDocument): Promise<IOrder> => {
  const [user, dealer] = await Promise.all([
    SignUp.findById(orderDoc.userId),
    orderDoc.dealerId ? Dealer.findById(orderDoc.dealerId) : null,
  ]);

  return {
    id: (orderDoc._id as any).toString(),
    orderNumber: orderDoc.orderNumber,
    user: user ? { id: (user._id as any).toString(), name: user.name, email: user.email } : null,
    dealer: dealer
      ? {
          id: (dealer._id as any).toString(),
          name: dealer.name,
          businessName: dealer.businessName,
          email: dealer.email,
        }
      : null,
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
    timeline: orderDoc.timeline,
    createdAt: orderDoc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all orders with pagination and filters
 */
export const getOrders = async (
  query: IGetOrdersRequest,
): Promise<{ orders: IOrder[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      filter.$or = [{ orderNumber: { $regex: query.search, $options: 'i' } }];
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.dealerId) {
      filter.dealerId = query.dealerId;
    }

    if (query.userId) {
      filter.userId = query.userId;
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

    const ordersWithDetails = await Promise.all(orders.map(orderToIOrder));

    return {
      orders: ordersWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting orders:', error);
    throw error;
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string): Promise<IOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return await orderToIOrder(order);
  } catch (error) {
    logger.error('Error getting order by ID:', error);
    throw error;
  }
};

/**
 * Create order
 */
export const createOrder = async (data: ICreateOrderRequest): Promise<IOrder> => {
  try {
    const user = await SignUp.findById(data.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (data.dealerId) {
      const dealer = await Dealer.findById(data.dealerId);
      if (!dealer) {
        throw new NotFoundError('Dealer not found');
      }
    }

    const settings = await Settings.findOne() || (await Settings.create({}));

    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const tax = (subtotal * settings.taxRate) / 100;
    const shipping = settings.shippingCost;
    const totalAmount = subtotal + tax + shipping;

    const order = new Order({
      orderNumber: generateOrderNumber(),
      userId: data.userId,
      dealerId: data.dealerId,
      items: data.items,
      subtotal,
      tax,
      shipping,
      totalAmount,
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress,
      billingAddress: data.shippingAddress, // Default to shipping address
      status: 'ORDER_PLACED',
      paymentStatus: 'pending',
      timeline: [
        {
          status: 'ORDER_PLACED',
          timestamp: new Date(),
          notes: 'Order created',
          actor: 'system',
          actorId: 'system',
        },
      ],
    });

    await order.save();

    logger.info(`New order created: ${order.orderNumber}`);

    return await orderToIOrder(order);
  } catch (error) {
    logger.error('Error creating order:', error);
    throw error;
  }
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
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  data: IUpdateOrderStatusRequest,
  adminId: string,
): Promise<IOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const previousStatus = order.status;
    const newStatus = data.status as OrderStatus;

    // Admin can force update, but we still validate if possible
    if (previousStatus !== newStatus) {
      try {
        validateStatusTransitionOrThrow(previousStatus, newStatus, 'admin');
      } catch (error) {
        // Admin can override, but log the warning
        logger.warn(
          `Admin force update from ${previousStatus} to ${newStatus} for order ${orderId}`,
        );
      }

      order.status = newStatus;
      order.timeline.push({
        status: newStatus,
        timestamp: new Date(),
        notes: data.notes || `Status updated by admin`,
        actor: 'admin',
        actorId: adminId,
        previousStatus,
      });

      await order.save();

      await logStatusChange(
        orderId,
        previousStatus,
        newStatus,
        'admin',
        adminId,
        data.notes,
      );

      // Emit socket event for real-time updates
      try {
        emitToOrderRoom(orderId, 'liveTrackingUpdates', {
          orderId,
          status: newStatus,
          previousStatus,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        logger.error('Error emitting socket event for order status update:', socketError);
      }

      logger.info(
        `Order status updated by admin: ${order.orderNumber} - ${newStatus}`,
      );
    }

    return await orderToIOrder(order);
  } catch (error) {
    logger.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId: string, data: ICancelOrderRequest): Promise<IOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const previousStatus = order.status;
    order.status = 'CANCELLED_BY_DEALER';
    order.cancellationReason = data.reason;
    order.timeline.push({
      status: 'CANCELLED_BY_DEALER',
      timestamp: new Date(),
      notes: data.reason,
      actor: 'admin',
      actorId: 'admin',
      previousStatus,
    });

    await order.save();

    logger.info(`Order cancelled: ${order.orderNumber}`);

    return await orderToIOrder(order);
  } catch (error) {
    logger.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * Assign dealer to order
 */
export const assignDealerToOrder = async (
  orderId: string,
  data: IAssignDealerRequest,
): Promise<IOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const dealer = await Dealer.findById(data.dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    order.dealerId = data.dealerId;
    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      notes: `Dealer assigned: ${dealer.businessName}`,
    });

    await order.save();

    logger.info(`Dealer assigned to order: ${order.orderNumber}`);

    return await orderToIOrder(order);
  } catch (error) {
    logger.error('Error assigning dealer to order:', error);
    throw error;
  }
};

/**
 * Add tracking information
 */
export const addTrackingInformation = async (
  orderId: string,
  data: IAddTrackingRequest,
): Promise<IOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    order.tracking = {
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
      status: data.status,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
    };

    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      notes: `Tracking added: ${data.trackingNumber}`,
    });

    await order.save();

    logger.info(`Tracking added to order: ${order.orderNumber}`);

    return await orderToIOrder(order);
  } catch (error) {
    logger.error('Error adding tracking information:', error);
    throw error;
  }
};

/**
 * Get order timeline
 */
export const getOrderTimeline = async (orderId: string): Promise<any[]> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order.timeline;
  } catch (error) {
    logger.error('Error getting order timeline:', error);
    throw error;
  }
};

/**
 * Get order status logs
 */
export const getOrderStatusLogs = async (
  orderId: string,
): Promise<any[]> => {
  try {
    const logs = await OrderStatusLog.find({ orderId })
      .sort({ timestamp: -1 })
      .lean();

    return logs;
  } catch (error) {
    logger.error('Error getting order status logs:', error);
    throw error;
  }
};

/**
 * Get order analytics
 */
export const getOrderAnalytics = async (filters?: {
  startDate?: string;
  endDate?: string;
  dealerId?: string;
}): Promise<any> => {
  try {
    const filter: any = {};

    if (filters?.startDate || filters?.endDate) {
      filter.createdAt = {};
      if (filters.startDate) filter.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.createdAt.$lte = new Date(filters.endDate);
    }

    if (filters?.dealerId) {
      filter.dealerId = filters.dealerId;
    }

    const orders = await Order.find(filter);

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: 0,
      statusBreakdown: {} as Record<string, number>,
      paymentStatusBreakdown: {} as Record<string, number>,
      averageOrderValue: 0,
    };

    let totalRevenue = 0;

    orders.forEach((order) => {
      // Status breakdown
      analytics.statusBreakdown[order.status] =
        (analytics.statusBreakdown[order.status] || 0) + 1;

      // Payment status breakdown
      analytics.paymentStatusBreakdown[order.paymentStatus] =
        (analytics.paymentStatusBreakdown[order.paymentStatus] || 0) + 1;

      // Revenue (only for paid orders that are not cancelled/refunded)
      if (
        order.paymentStatus === 'paid' &&
        !order.status.includes('CANCELLED') &&
        order.status !== 'REFUND_COMPLETED'
      ) {
        totalRevenue += order.totalAmount;
      }
    });

    analytics.totalRevenue = totalRevenue;
    analytics.averageOrderValue =
      orders.length > 0 ? totalRevenue / orders.length : 0;

    return analytics;
  } catch (error) {
    logger.error('Error getting order analytics:', error);
    throw error;
  }
};

