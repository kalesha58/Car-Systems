import {
  Order,
  IOrderDocument,
  OrderStatus,
  PaymentStatus,
  ITimelineEvent,
  TimelineActor,
} from '../../models/Order';
import { OrderStatusLog } from '../../models/OrderStatusLog';
import { OrderDocument } from '../../models/OrderDocument';
import { SignUp } from '../../models/SignUp';
import { Product } from '../../models/Product';
import { Dealer } from '../../models/Dealer';
import {
  IDealerOrder,
  IGetDealerOrdersRequest,
  IUpdateOrderStatusRequest,
  ICancelOrderRequest,
  IAddTrackingRequest,
  IAssignDealerRequest,
  IRefundOrderRequest,
  IOrderStats,
} from '../../types/dealer/order';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';
import {
  validateStatusTransitionOrThrow,
  canDealerCancel,
} from '../../utils/orderStatusValidator';
import { emitToOrderRoom } from '../socket/socketService';

/**
 * Convert order document to dealer order interface
 * Optionally filters items to show only dealer's products and recalculates totals
 */
const orderToDealerOrder = (
  orderDoc: IOrderDocument,
  dealerProductIds?: string[],
  customer?: { name: string; phone: string; address?: string },
  dealer?: { id: string; name: string; businessName: string; phone: string; address?: string },
): IDealerOrder => {
  let items = orderDoc.items;
  let subtotal = orderDoc.subtotal;
  let tax = orderDoc.tax;
  let shipping = orderDoc.shipping;
  let totalAmount = orderDoc.totalAmount;

  // Filter items if dealerProductIds is provided
  if (dealerProductIds && dealerProductIds.length > 0) {
    items = orderDoc.items.filter((item) =>
      dealerProductIds.includes(item.productId),
    );

    if (items.length === 0) {
      // Return null-like structure that will be filtered out
      throw new Error('No dealer items in order');
    }

    // Recalculate totals from dealer's items only
    subtotal = items.reduce((sum, item) => sum + item.total, 0);
    // Calculate proportional tax
    tax =
      orderDoc.subtotal > 0
        ? (subtotal * orderDoc.tax) / orderDoc.subtotal
        : 0;
    // Calculate proportional shipping
    shipping =
      orderDoc.items.length > 0
        ? (orderDoc.shipping / orderDoc.items.length) * items.length
        : 0;
    totalAmount = subtotal + tax + shipping;
  }

  const customerAddress = customer?.address || 
    (orderDoc.shippingAddress 
      ? `${orderDoc.shippingAddress.street || ''}, ${orderDoc.shippingAddress.city || ''}, ${orderDoc.shippingAddress.state || ''}`.trim()
      : undefined);

  return {
    id: (orderDoc._id as any).toString(),
    orderNumber: orderDoc.orderNumber,
    userId: orderDoc.userId,
    dealerId: orderDoc.dealerId,
    items,
    subtotal,
    tax,
    shipping,
    totalAmount,
    status: orderDoc.status,
    paymentStatus: orderDoc.paymentStatus,
    paymentMethod: orderDoc.paymentMethod,
    shippingAddress: orderDoc.shippingAddress,
    billingAddress: orderDoc.billingAddress,
    tracking: orderDoc.tracking,
    timeline: orderDoc.timeline.map((event): ITimelineEvent => ({
      status: event.status,
      timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp),
      notes: event.notes,
      actor: event.actor,
      actorId: event.actorId,
      previousStatus: event.previousStatus,
    })),
    cancellationReason: orderDoc.cancellationReason,
    deliveryLocation: orderDoc.deliveryLocation,
    pickupLocation: orderDoc.pickupLocation,
    deliveryPersonLocation: orderDoc.deliveryPersonLocation,
    createdAt: orderDoc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: orderDoc.updatedAt?.toISOString() || new Date().toISOString(),
    customer: customer ? {
      name: customer.name,
      phone: customer.phone,
      address: customerAddress,
    } : undefined,
    dealer: dealer ? {
      id: dealer.id,
      name: dealer.name,
      businessName: dealer.businessName,
      phone: dealer.phone,
      address: dealer.address,
    } : undefined,
  };
};

/**
 * Check if dealer has access to an order
 * Returns dealer's product IDs if dealer has products, otherwise empty array
 */
const checkDealerOrderAccess = async (
  order: IOrderDocument,
  dealerId: string,
): Promise<{ hasAccess: boolean; dealerProductIds: string[] }> => {
  // Check if order has dealerId matching
  const hasDealerId = order.dealerId === dealerId;

  // Get dealer's product IDs
  const dealerProducts = await Product.find({ userId: dealerId });
  const dealerProductIds = dealerProducts.map((p) => (p._id as any).toString());

  // Check if order contains dealer's products
  const hasDealerProducts =
    dealerProductIds.length > 0 &&
    order.items.some((item) => dealerProductIds.includes(item.productId));

  return {
    hasAccess: hasDealerId || hasDealerProducts,
    dealerProductIds,
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
 * Get all orders for a dealer
 */
export const getDealerOrders = async (
  dealerId: string,
  query: IGetDealerOrdersRequest,
): Promise<{ orders: IDealerOrder[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Get all products that belong to the dealer
    const dealerProducts = await Product.find({ userId: dealerId });
    const dealerProductIds = dealerProducts.map((p) => (p._id as any).toString());

    // Build filter with $or condition to find orders:
    // 1. Orders with dealerId matching the dealer (existing logic)
    // 2. Orders containing products that belong to the dealer (new logic)
    const baseFilter: any[] = [];

    // Add dealerId filter
    baseFilter.push({ dealerId });

    // Add product-based filter if dealer has products
    if (dealerProductIds.length > 0) {
      baseFilter.push({ 'items.productId': { $in: dealerProductIds } });
    }

    const filter: any = {
      $or: baseFilter.length > 0 ? baseFilter : [{ dealerId }],
    };

    // Apply additional filters
    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    // Fetch orders
    const orders = await Order.find(filter).sort(sort).skip(skip).limit(limit);

    // Get unique user IDs from orders (for customers)
    const userIds = [...new Set(orders.map((order) => order.userId))];

    // Fetch user data for all orders (customers)
    const users = await SignUp.find({ _id: { $in: userIds } }).select('name phone').lean();
    const userMap = new Map(
      users.map((user) => [
        (user._id as any).toString(),
        {
          name: user.name,
          phone: user.phone,
        },
      ]),
    );

    // Fetch current dealer information
    const currentDealerUser = await SignUp.findById(dealerId).select('email').lean();
    let currentDealerInfo: { id: string; name: string; businessName: string; phone: string; address?: string } | undefined;
    
    if (currentDealerUser) {
      const dealerDoc = await Dealer.findOne({ email: currentDealerUser.email }).lean();
      if (dealerDoc) {
        currentDealerInfo = {
          id: (dealerDoc._id as any).toString(),
          name: dealerDoc.name,
          businessName: dealerDoc.businessName,
          phone: dealerDoc.phone,
          address: dealerDoc.address,
        };
      }
    }

    // Filter items and recalculate totals for each order
    const filteredOrders: IDealerOrder[] = [];
    for (const order of orders) {
      try {
        const customer = userMap.get(order.userId);
        const dealerOrder = orderToDealerOrder(
          order,
          dealerProductIds.length > 0 ? dealerProductIds : undefined,
          customer,
          currentDealerInfo,
        );
        filteredOrders.push(dealerOrder);
      } catch (error) {
        // Skip orders with no dealer items
        continue;
      }
    }

    // Count total orders (need to count after filtering items)
    // For accurate pagination, we need to count all matching orders first
    const allMatchingOrders = await Order.find(filter);
    const validOrdersCount = allMatchingOrders.filter((order) => {
      if (dealerProductIds.length === 0) {
        return order.dealerId === dealerId;
      }
      return (
        order.dealerId === dealerId ||
        order.items.some((item) => dealerProductIds.includes(item.productId))
      );
    }).length;

    return {
      orders: filteredOrders,
      pagination: {
        page,
        limit,
        total: validOrdersCount,
        totalPages: Math.ceil(validOrdersCount / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer orders:', error);
    throw error;
  }
};

/**
 * Get order by ID (dealer-specific)
 */
export const getDealerOrderById = async (
  orderId: string,
  dealerId: string,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to access this order');
    }

    // Fetch customer data
    const user = await SignUp.findById(order.userId).select('name phone').lean();
    const customer = user
      ? {
          name: user.name,
          phone: user.phone,
        }
      : undefined;

    // Fetch dealer information
    const dealerUser = await SignUp.findById(dealerId).select('email').lean();
    let dealerInfo: { id: string; name: string; businessName: string; phone: string; address?: string } | undefined;
    
    if (dealerUser) {
      const dealerDoc = await Dealer.findOne({ email: dealerUser.email }).lean();
      if (dealerDoc) {
        dealerInfo = {
          id: (dealerDoc._id as any).toString(),
          name: dealerDoc.name,
          businessName: dealerDoc.businessName,
          phone: dealerDoc.phone,
          address: dealerDoc.address,
        };
      }
    }

    // Filter items to show only dealer's products and recalculate totals
    return orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
      customer,
      dealerInfo,
    );
  } catch (error) {
    logger.error('Error getting dealer order by ID:', error);
    throw error;
  }
};

/**
 * Update order status with timeline tracking
 */
export const updateOrderStatus = async (
  orderId: string,
  dealerId: string,
  data: IUpdateOrderStatusRequest,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to update this order');
    }

    // Update delivery person location if provided
    if (data.deliveryPersonLocation) {
      order.deliveryPersonLocation = data.deliveryPersonLocation;
    }

    // Validate status transition
    if (order.status !== data.status) {
      validateStatusTransitionOrThrow(order.status, data.status, 'dealer');

      const previousStatus = order.status;
      order.status = data.status;

      // Add timeline event
      order.timeline.push({
        status: data.status,
        timestamp: new Date(),
        notes: data.notes,
        actor: 'dealer',
        actorId: dealerId,
        previousStatus,
      });

      await logStatusChange(
        orderId,
        previousStatus,
        data.status,
        'dealer',
        dealerId,
        data.notes,
      );

      logger.info(`Order status updated: ${order.orderNumber} - ${data.status}`);
    }

    // Save order (for both status and location updates)
    await order.save();

    const user = await SignUp.findById(order.userId).select('name phone').lean();
    const customer = user
      ? {
          name: user.name,
          phone: user.phone,
        }
      : undefined;

    // Fetch dealer information
    const dealerUser = await SignUp.findById(dealerId).select('email').lean();
    let dealerInfo: { id: string; name: string; businessName: string; phone: string; address?: string } | undefined;
    
    if (dealerUser) {
      const dealerDoc = await Dealer.findOne({ email: dealerUser.email }).lean();
      if (dealerDoc) {
        dealerInfo = {
          id: (dealerDoc._id as any).toString(),
          name: dealerDoc.name,
          businessName: dealerDoc.businessName,
          phone: dealerDoc.phone,
          address: dealerDoc.address,
        };
      }
    }

    const dealerOrder = orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
      customer,
      dealerInfo,
    );

    // Emit socket event for real-time updates with full order data
    try {
      emitToOrderRoom(orderId, 'liveTrackingUpdates', dealerOrder);
    } catch (socketError) {
      logger.error('Error emitting socket event for order update:', socketError);
    }

    return dealerOrder;
  } catch (error) {
    logger.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  orderId: string,
  dealerId: string,
  data: ICancelOrderRequest,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to cancel this order');
    }

    if (!canDealerCancel(order.status)) {
      throw new AppError(
        `Cannot cancel order in current status: ${order.status}`,
        400,
      );
    }

    const previousStatus = order.status;
    order.status = 'CANCELLED_BY_DEALER';
    order.cancellationReason = data.reason;

    // Add timeline event
    order.timeline.push({
      status: 'CANCELLED_BY_DEALER',
      timestamp: new Date(),
      notes: data.reason,
      actor: 'dealer',
      actorId: dealerId,
      previousStatus,
    });

    await order.save();

    await logStatusChange(
      orderId,
      previousStatus,
      'CANCELLED_BY_DEALER',
      'dealer',
      dealerId,
      data.reason,
    );

    logger.info(`Order cancelled by dealer: ${order.orderNumber}`);

    const user = await SignUp.findById(order.userId).select('name phone').lean();
    const customer = user
      ? {
          name: user.name,
          phone: user.phone,
        }
      : undefined;

    // Fetch dealer information
    const dealerUser = await SignUp.findById(dealerId).select('email').lean();
    let dealerInfo: { id: string; name: string; businessName: string; phone: string; address?: string } | undefined;
    
    if (dealerUser) {
      const dealerDoc = await Dealer.findOne({ email: dealerUser.email }).lean();
      if (dealerDoc) {
        dealerInfo = {
          id: (dealerDoc._id as any).toString(),
          name: dealerDoc.name,
          businessName: dealerDoc.businessName,
          phone: dealerDoc.phone,
          address: dealerDoc.address,
        };
      }
    }

    return orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
      customer,
      dealerInfo,
    );
  } catch (error) {
    logger.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * Add/update tracking information
 */
export const addTrackingInformation = async (
  orderId: string,
  dealerId: string,
  data: IAddTrackingRequest,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to update tracking for this order');
    }

    // Can only add tracking for PACKED, SHIPPED, OUT_FOR_DELIVERY, or DELIVERED orders
    if (
      !['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
        order.status,
      )
    ) {
      throw new AppError(
        'Tracking can only be added for PACKED, SHIPPED, OUT_FOR_DELIVERY, or DELIVERED orders',
        400,
      );
    }

    order.tracking = {
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
      status: data.status,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
    };

    await order.save();

    logger.info(`Tracking information added to order: ${order.orderNumber}`);

    return orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
    );
  } catch (error) {
    logger.error('Error adding tracking information:', error);
    throw error;
  }
};

/**
 * Get order timeline
 */
export const getOrderTimeline = async (
  orderId: string,
  dealerId: string,
): Promise<IDealerOrder['timeline']> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess } = await checkDealerOrderAccess(order, dealerId);

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to access this order timeline');
    }

    return order.timeline.map((event): ITimelineEvent => ({
      status: event.status,
      timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp),
      notes: event.notes,
      actor: event.actor,
      actorId: event.actorId,
      previousStatus: event.previousStatus,
    }));
  } catch (error) {
    logger.error('Error getting order timeline:', error);
    throw error;
  }
};

/**
 * Assign dealer to order
 */
export const assignDealerToOrder = async (
  orderId: string,
  dealerId: string,
  data: IAssignDealerRequest,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Verify the dealer making the request is the one being assigned
    if (data.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to assign this dealer');
    }

    // Can only assign dealer to ORDER_PLACED or PAYMENT_CONFIRMED orders
    if (!['ORDER_PLACED', 'PAYMENT_CONFIRMED'].includes(order.status)) {
      throw new AppError('Cannot assign dealer to order in current status', 400);
    }

    // Cannot reassign if already confirmed or beyond
    if (
      order.dealerId &&
      order.status !== 'ORDER_PLACED' &&
      order.status !== 'PAYMENT_CONFIRMED'
    ) {
      throw new AppError(
        'Cannot reassign dealer if order is already confirmed or beyond',
        400,
      );
    }

    order.dealerId = data.dealerId;

    await order.save();

    logger.info(`Dealer assigned to order: ${order.orderNumber}`);

    return orderToDealerOrder(order);
  } catch (error) {
    logger.error('Error assigning dealer to order:', error);
    throw error;
  }
};

/**
 * Process refund
 */
export const refundOrder = async (
  orderId: string,
  dealerId: string,
  data: IRefundOrderRequest,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to process refund for this order');
    }

    // Can only refund if payment was made
    if (order.paymentStatus !== 'paid') {
      throw new AppError('Can only refund orders with paid status', 400);
    }

    order.paymentStatus = 'refunded';

    // Add timeline event
    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      notes: data.reason || 'Refund processed',
    });

    await order.save();

    logger.info(`Refund processed for order: ${order.orderNumber}`);

    return orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
    );
  } catch (error) {
    logger.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Get order statistics for dealer
 */
export const getDealerOrderStats = async (dealerId: string): Promise<IOrderStats> => {
  try {
    // Get all products that belong to the dealer
    const dealerProducts = await Product.find({ userId: dealerId });
    const dealerProductIds = dealerProducts.map((p) => (p._id as any).toString());

    // Build filter with $or condition
    const baseFilter: any[] = [];
    baseFilter.push({ dealerId });

    if (dealerProductIds.length > 0) {
      baseFilter.push({ 'items.productId': { $in: dealerProductIds } });
    }

    const filter: any = {
      $or: baseFilter.length > 0 ? baseFilter : [{ dealerId }],
    };

    const orders = await Order.find(filter);

    const stats: IOrderStats = {
      total: 0,
      totalRevenue: 0,
    };

    // Count orders and calculate revenue based on dealer's items only
    orders.forEach((order) => {
      // Check if order has dealer items
      const hasDealerItems =
        order.dealerId === dealerId ||
        (dealerProductIds.length > 0 &&
          order.items.some((item) => dealerProductIds.includes(item.productId)));

      if (!hasDealerItems) {
        return;
      }

      // Filter items to dealer's products only
      const dealerItems =
        dealerProductIds.length > 0
          ? order.items.filter((item) => dealerProductIds.includes(item.productId))
          : order.items;

      if (dealerItems.length === 0) {
        return;
      }

      // Calculate dealer's portion of the order
      const dealerSubtotal = dealerItems.reduce((sum, item) => sum + item.total, 0);
      const dealerTax =
        order.subtotal > 0 ? (dealerSubtotal * order.tax) / order.subtotal : 0;
      const dealerShipping =
        order.items.length > 0
          ? (order.shipping / order.items.length) * dealerItems.length
          : 0;
      const dealerTotal = dealerSubtotal + dealerTax + dealerShipping;

      // Update stats
      stats.total += 1;

      const statusKey = order.status as keyof IOrderStats;
      if (statusKey && typeof stats[statusKey] === 'number') {
        (stats[statusKey] as number) = ((stats[statusKey] as number) || 0) + 1;
      } else {
        (stats as any)[order.status] = ((stats as any)[order.status] || 0) + 1;
      }

      if (
        order.paymentStatus === 'paid' &&
        !order.status.includes('CANCELLED') &&
        order.status !== 'REFUND_COMPLETED'
      ) {
        stats.totalRevenue += dealerTotal;
      }
    });

    return stats;
  } catch (error) {
    logger.error('Error getting dealer order stats:', error);
    throw error;
  }
};

/**
 * Accept order
 */
export const acceptOrder = async (
  orderId: string,
  dealerId: string,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to accept this order');
    }

    if (!['ORDER_PLACED', 'PAYMENT_CONFIRMED'].includes(order.status)) {
      throw new AppError('Can only accept orders in ORDER_PLACED or PAYMENT_CONFIRMED status', 400);
    }

    const previousStatus = order.status;
    order.dealerId = dealerId;
    order.status = 'ORDER_CONFIRMED';

    order.timeline.push({
      status: 'ORDER_CONFIRMED',
      timestamp: new Date(),
      notes: 'Order accepted by dealer',
      actor: 'dealer',
      actorId: dealerId,
      previousStatus,
    });

    await order.save();

    await logStatusChange(
      orderId,
      previousStatus,
      'ORDER_CONFIRMED',
      'dealer',
      dealerId,
      'Order accepted by dealer',
    );

    // Emit socket event for order confirmation
    try {
      emitToOrderRoom(orderId, 'orderConfirmed', {
        orderId,
        status: 'ORDER_CONFIRMED',
        timestamp: new Date().toISOString(),
      });
      emitToOrderRoom(orderId, 'liveTrackingUpdates', {
        orderId,
        status: 'ORDER_CONFIRMED',
        previousStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (socketError) {
      logger.error('Error emitting socket event for order confirmation:', socketError);
    }

    logger.info(`Order accepted: ${order.orderNumber} by dealer: ${dealerId}`);

    return orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
    );
  } catch (error) {
    logger.error('Error accepting order:', error);
    throw error;
  }
};

/**
 * Reject order
 */
export const rejectOrder = async (
  orderId: string,
  dealerId: string,
  reason: string,
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to reject this order');
    }

    if (!['ORDER_PLACED', 'PAYMENT_CONFIRMED'].includes(order.status)) {
      throw new AppError('Can only reject orders in ORDER_PLACED or PAYMENT_CONFIRMED status', 400);
    }

    const previousStatus = order.status;
    order.status = 'CANCELLED_BY_DEALER';
    order.cancellationReason = reason;

    order.timeline.push({
      status: 'CANCELLED_BY_DEALER',
      timestamp: new Date(),
      notes: `Order rejected: ${reason}`,
      actor: 'dealer',
      actorId: dealerId,
      previousStatus,
    });

    await order.save();

    await logStatusChange(
      orderId,
      previousStatus,
      'CANCELLED_BY_DEALER',
      'dealer',
      dealerId,
      reason,
    );

    logger.info(`Order rejected: ${order.orderNumber} by dealer: ${dealerId}`);

    return orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
    );
  } catch (error) {
    logger.error('Error rejecting order:', error);
    throw error;
  }
};

/**
 * Upload order document
 */
export const uploadOrderDocument = async (
  orderId: string,
  dealerId: string,
  data: {
    documentType: 'invoice' | 'shipment_proof' | 'other';
    documentUrl: string;
    description?: string;
    fileSize?: number;
    mimeType?: string;
  },
): Promise<IDealerOrder> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check dealer access
    const { hasAccess, dealerProductIds } = await checkDealerOrderAccess(
      order,
      dealerId,
    );

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized to upload documents for this order');
    }

    // Create document record
    const document = await OrderDocument.create({
      orderId,
      documentType: data.documentType,
      documentUrl: data.documentUrl,
      uploadedBy: dealerId,
      uploadedByRole: 'dealer',
      uploadedAt: new Date(),
      description: data.description,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    });

    // Add to order documents array
    if (!order.documents) {
      order.documents = [];
    }

    order.documents.push({
      documentType: data.documentType,
      documentUrl: data.documentUrl,
      uploadedBy: dealerId,
      uploadedAt: new Date(),
      description: data.description,
    });

    await order.save();

    logger.info(`Document uploaded for order: ${order.orderNumber}`, {
      documentId: document.id,
      documentType: data.documentType,
    });

    return orderToDealerOrder(
      order,
      dealerProductIds.length > 0 ? dealerProductIds : undefined,
    );
  } catch (error) {
    logger.error('Error uploading order document:', error);
    throw error;
  }
};

