import { Order, IOrderDocument, OrderStatus, TimelineActor, ILocation } from '../../models/Order';
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
import { emitToOrderRoom } from '../socket/socketService';

export interface IPaymentAction {
  type: 'UPI_INTENT' | 'DEEP_LINK' | 'QR';
  paymentIntentId: string;
  amount: number;
  currency: string;
  deeplink?: string;
  qrCode?: string;
  expiresAt?: string;
}

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
  deliveryLocation?: { latitude: number; longitude: number; address?: string };
  pickupLocation?: { latitude: number; longitude: number; address?: string };
  deliveryPersonLocation?: { latitude: number; longitude: number; address?: string };
  createdAt: string;
  updatedAt: string;
  paymentAction?: IPaymentAction;
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
  deliveryLocation?: ILocation;
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
    deliveryLocation: orderDoc.deliveryLocation,
    pickupLocation: orderDoc.pickupLocation,
    deliveryPersonLocation: orderDoc.deliveryPersonLocation,
    createdAt: orderDoc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: orderDoc.updatedAt?.toISOString() || new Date().toISOString(),
    // Include codCharge if present (for COD orders)
    ...(orderDoc.codCharge > 0 && { codCharge: orderDoc.codCharge }),
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
    // Validate input
    if (!data.items || data.items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    if (!data.shippingAddress) {
      throw new AppError('Shipping address is required', 400);
    }

    if (!data.paymentMethod) {
      throw new AppError('Payment method is required', 400);
    }

    const validPaymentMethods = ['credit_card', 'debit_card', 'upi', 'cash_on_delivery'];
    if (!validPaymentMethods.includes(data.paymentMethod)) {
      throw new AppError(`Invalid payment method: ${data.paymentMethod}`, 400);
    }

    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { Settings } = await import('../../models/Settings');
    const settings = await Settings.findOne() || (await Settings.create({}));

    // Validate items and check stock
    const { Product } = await import('../../models/Product');
    for (const item of data.items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new AppError('Invalid item data', 400);
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product not found: ${item.productId}`);
      }

      // Check stock availability (for UPI, we'll reserve stock; for COD, we check but don't reserve yet)
      if (data.paymentMethod === 'upi' && product.stock !== undefined && product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          400,
        );
      }
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const tax = (subtotal * settings.taxRate) / 100;
    const shipping = settings.shippingCost;
    const totalAmount = subtotal + tax + shipping;

    // Validate total amount
    if (totalAmount <= 0) {
      throw new AppError('Order total must be greater than zero', 400);
    }

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
      deliveryLocation: data.deliveryLocation,
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

    // Emit socket event for order creation
    try {
      const orderId = (order._id as any).toString();
      emitToOrderRoom(orderId, 'liveTrackingUpdates', {
        orderId,
        status: 'ORDER_PLACED',
        timestamp: new Date().toISOString(),
      });
    } catch (socketError) {
      logger.error('Error emitting socket event for order creation:', socketError);
    }

    // Process payment based on payment method
    let paymentAction: IPaymentAction | undefined;
    const orderId = (order._id as any).toString();

    try {
      if (data.paymentMethod === 'upi') {
        // Reserve stock for UPI orders (will be restored if payment fails)
        try {
          const { Product } = await import('../../models/Product');
          for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product && product.stock !== undefined) {
              product.stock = (product.stock || 0) - item.quantity;
              if (product.stock < 0) {
                // Rollback previous stock updates
                for (const prevItem of order.items) {
                  const prevProduct = await Product.findById(prevItem.productId);
                  if (prevProduct && String(prevProduct._id) !== String(product._id)) {
                    prevProduct.stock = (prevProduct.stock || 0) + prevItem.quantity;
                    await prevProduct.save();
                  }
                }
                throw new AppError(
                  `Insufficient stock for ${product.name}. Available: ${(product.stock || 0) + item.quantity}, Requested: ${item.quantity}`,
                  400,
                );
              }
              await product.save();
            }
          }
        } catch (stockError: any) {
          logger.error('Error reserving stock for UPI order:', stockError);
          throw stockError;
        }

        // Process UPI payment - create payment intent
        const { processUPIPayment } = await import('../payment/paymentService');
        const { order: updatedOrder, paymentIntent } = await processUPIPayment(
          orderId,
          data.dealerId,
        );

        // Create payment action for frontend
        paymentAction = {
          type: 'UPI_INTENT',
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency || 'INR',
          deeplink: `razorpay://pay?amount=${paymentIntent.amount}&currency=${paymentIntent.currency || 'INR'}&order_id=${paymentIntent.id}`,
          expiresAt: updatedOrder.expiresAt?.toISOString(),
        };

        // Reload order from database to get latest state
        const refreshedOrder = await Order.findById(orderId);
        if (refreshedOrder) {
          Object.assign(order, refreshedOrder.toObject());
        }

        logger.info(`UPI payment intent created for order: ${order.orderNumber}`, {
          paymentIntentId: paymentIntent.id,
        });
      } else if (data.paymentMethod === 'cash_on_delivery') {
        // Process COD order - add COD charge
        const { processCODOrder } = await import('../payment/paymentService');
        await processCODOrder(orderId);

        // Reload order from database to get latest state
        const refreshedOrder = await Order.findById(orderId);
        if (refreshedOrder) {
          Object.assign(order, refreshedOrder.toObject());
        }

        logger.info(`COD order processed: ${order.orderNumber}`, {
          codCharge: order.codCharge,
          totalAmount: order.totalAmount,
        });
      }
      // For credit_card and debit_card, order remains in ORDER_PLACED status
      // Payment processing will be handled separately
    } catch (paymentError: any) {
      logger.error('Error processing payment:', paymentError);

      // If payment processing fails, mark order as failed
      const previousStatus = order.status;
      order.status = 'PAYMENT_FAILED';
      order.paymentStatus = 'failed';
      order.timeline.push({
        status: 'PAYMENT_FAILED',
        timestamp: new Date(),
        notes: `Payment processing failed: ${paymentError.message || 'Unknown error'}`,
        actor: 'system',
        actorId: 'system',
        previousStatus,
      });

      await order.save();

      await logStatusChange(
        orderId,
        previousStatus,
        'PAYMENT_FAILED',
        'system',
        'system',
        paymentError.message || 'Payment processing failed',
      );

      // Emit socket event for payment failure
      try {
        emitToOrderRoom(orderId, 'liveTrackingUpdates', {
          orderId,
          status: 'PAYMENT_FAILED',
          previousStatus,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        logger.error('Error emitting socket event for payment failure:', socketError);
      }

      // Restore stock if payment fails (for UPI orders that reserved stock)
      if (data.paymentMethod === 'upi') {
        try {
          const { Product } = await import('../../models/Product');
          for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
              product.stock = (product.stock || 0) + item.quantity;
              await product.save();
              logger.info(`Stock restored for product: ${item.productId}`, {
                quantity: item.quantity,
              });
            }
          }
        } catch (stockError) {
          logger.error('Error restoring stock after payment failure:', stockError);
          // Don't throw - stock restoration failure shouldn't block error response
        }
      }

      // Re-throw error to be handled by controller
      throw new AppError(
        paymentError.message || 'Failed to process payment. Please try again.',
        paymentError.statusCode || 500,
      );
    }

    logger.info(`New order created: ${order.orderNumber}`, {
      paymentMethod: data.paymentMethod,
      status: order.status,
    });

    const userOrder = orderToUserOrder(order);
    if (paymentAction) {
      (userOrder as any).paymentAction = paymentAction;
    }

    return userOrder;
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

