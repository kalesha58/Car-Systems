import { Order, IOrderDocument, OrderStatus } from '../../models/Order';
import { ReturnRequest, IReturnRequestDocument } from '../../models/ReturnRequest';
import { OrderStatusLog } from '../../models/OrderStatusLog';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IReturnRequestData {
  reason: string;
  images?: string[];
}

export interface IProcessReturnRequest {
  action: 'approve' | 'reject';
  notes?: string;
  rejectedReason?: string;
}

export interface IProcessRefundRequest {
  refundAmount?: number;
  refundTransactionId?: string;
  notes?: string;
}

/**
 * Log status change
 */
const logStatusChange = async (
  orderId: string,
  previousStatus: OrderStatus | undefined,
  newStatus: OrderStatus,
  actor: 'user' | 'dealer' | 'admin' | 'system',
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
 * Request return
 */
export const requestReturn = async (
  orderId: string,
  userId: string,
  data: IReturnRequestData,
): Promise<{ order: IOrderDocument; returnRequest: IReturnRequestDocument }> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized to request return for this order', 403);
    }

    if (order.status !== 'DELIVERED') {
      throw new AppError(
        'Return can only be requested for delivered orders',
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

    const returnRequest = await ReturnRequest.create({
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

    return { order, returnRequest };
  } catch (error) {
    logger.error('Error requesting return:', error);
    throw error;
  }
};

/**
 * Process return request (approve/reject)
 */
export const processReturnRequest = async (
  orderId: string,
  adminId: string,
  data: IProcessReturnRequest,
): Promise<{ order: IOrderDocument; returnRequest: IReturnRequestDocument }> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const returnRequest = await ReturnRequest.findOne({ orderId });

    if (!returnRequest) {
      throw new NotFoundError('Return request not found');
    }

    if (returnRequest.status !== 'pending') {
      throw new AppError(
        `Return request is already ${returnRequest.status}`,
        400,
      );
    }

    if (data.action === 'approve') {
      returnRequest.status = 'approved';
      returnRequest.approvedAt = new Date();
      returnRequest.notes = data.notes;

      order.returnRequest = {
        ...order.returnRequest!,
        status: 'approved',
        processedAt: new Date(),
        notes: data.notes,
      };

      order.timeline.push({
        status: order.status,
        timestamp: new Date(),
        notes: `Return request approved${data.notes ? `: ${data.notes}` : ''}`,
        actor: 'admin',
        actorId: adminId,
        previousStatus: order.status,
      });
    } else {
      returnRequest.status = 'rejected';
      returnRequest.rejectedAt = new Date();
      returnRequest.rejectedReason = data.rejectedReason || data.notes;

      order.returnRequest = {
        ...order.returnRequest!,
        status: 'rejected',
        processedAt: new Date(),
        notes: data.rejectedReason || data.notes,
      };

      order.status = 'DELIVERED'; // Revert to delivered if rejected
      order.timeline.push({
        status: 'DELIVERED',
        timestamp: new Date(),
        notes: `Return request rejected${data.rejectedReason ? `: ${data.rejectedReason}` : ''}`,
        actor: 'admin',
        actorId: adminId,
        previousStatus: order.status,
      });
    }

    await Promise.all([order.save(), returnRequest.save()]);

    logger.info(
      `Return request ${data.action}d for order: ${order.orderNumber}`,
    );

    return { order, returnRequest };
  } catch (error) {
    logger.error('Error processing return request:', error);
    throw error;
  }
};

/**
 * Mark return as picked
 */
export const markReturnPicked = async (
  orderId: string,
  adminId: string,
): Promise<{ order: IOrderDocument; returnRequest: IReturnRequestDocument }> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const returnRequest = await ReturnRequest.findOne({ orderId });

    if (!returnRequest) {
      throw new NotFoundError('Return request not found');
    }

    if (returnRequest.status !== 'approved') {
      throw new AppError('Return must be approved before marking as picked', 400);
    }

    const previousStatus = order.status;
    order.status = 'RETURN_PICKED';
    returnRequest.status = 'picked';
    returnRequest.pickedAt = new Date();

    order.returnRequest = {
      ...order.returnRequest!,
      status: 'picked',
      processedAt: new Date(),
    };

    order.timeline.push({
      status: 'RETURN_PICKED',
      timestamp: new Date(),
      notes: 'Return item picked up',
      actor: 'admin',
      actorId: adminId,
      previousStatus,
    });

    await Promise.all([order.save(), returnRequest.save()]);

    await logStatusChange(
      orderId,
      previousStatus,
      'RETURN_PICKED',
      'admin',
      adminId,
      'Return item picked up',
    );

    logger.info(`Return picked for order: ${order.orderNumber}`);

    return { order, returnRequest };
  } catch (error) {
    logger.error('Error marking return as picked:', error);
    throw error;
  }
};

/**
 * Initiate refund
 */
export const initiateRefund = async (
  orderId: string,
  adminId: string,
  data: IProcessRefundRequest,
): Promise<{ order: IOrderDocument; returnRequest: IReturnRequestDocument }> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const returnRequest = await ReturnRequest.findOne({ orderId });

    if (!returnRequest) {
      throw new NotFoundError('Return request not found');
    }

    if (returnRequest.status !== 'picked') {
      throw new AppError('Return must be picked before initiating refund', 400);
    }

    const previousStatus = order.status;
    order.status = 'REFUND_INITIATED';
    order.paymentStatus = 'refunded';

    const refundAmount = data.refundAmount || order.totalAmount;
    returnRequest.refundAmount = refundAmount;
    returnRequest.refundStatus = 'initiated';
    returnRequest.refundTransactionId = data.refundTransactionId;
    returnRequest.notes = data.notes;

    order.returnRequest = {
      ...order.returnRequest!,
      status: 'completed',
      processedAt: new Date(),
      notes: data.notes,
    };

    order.timeline.push({
      status: 'REFUND_INITIATED',
      timestamp: new Date(),
      notes: `Refund initiated: ₹${refundAmount}${data.refundTransactionId ? ` (Txn: ${data.refundTransactionId})` : ''}`,
      actor: 'admin',
      actorId: adminId,
      previousStatus,
    });

    await Promise.all([order.save(), returnRequest.save()]);

    await logStatusChange(
      orderId,
      previousStatus,
      'REFUND_INITIATED',
      'admin',
      adminId,
      `Refund initiated: ₹${refundAmount}`,
    );

    logger.info(`Refund initiated for order: ${order.orderNumber}`, {
      refundAmount,
      transactionId: data.refundTransactionId,
    });

    return { order, returnRequest };
  } catch (error) {
    logger.error('Error initiating refund:', error);
    throw error;
  }
};

/**
 * Complete refund
 */
export const completeRefund = async (
  orderId: string,
  adminId: string,
): Promise<{ order: IOrderDocument; returnRequest: IReturnRequestDocument }> => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const returnRequest = await ReturnRequest.findOne({ orderId });

    if (!returnRequest) {
      throw new NotFoundError('Return request not found');
    }

    if (returnRequest.refundStatus !== 'initiated') {
      throw new AppError('Refund must be initiated before completing', 400);
    }

    const previousStatus = order.status;
    order.status = 'REFUND_COMPLETED';
    returnRequest.refundStatus = 'completed';
    returnRequest.completedAt = new Date();
    returnRequest.status = 'completed';

    order.returnRequest = {
      ...order.returnRequest!,
      status: 'completed',
      processedAt: new Date(),
    };

    order.timeline.push({
      status: 'REFUND_COMPLETED',
      timestamp: new Date(),
      notes: 'Refund completed',
      actor: 'admin',
      actorId: adminId,
      previousStatus,
    });

    await Promise.all([order.save(), returnRequest.save()]);

    await logStatusChange(
      orderId,
      previousStatus,
      'REFUND_COMPLETED',
      'admin',
      adminId,
      'Refund completed',
    );

    logger.info(`Refund completed for order: ${order.orderNumber}`);

    return { order, returnRequest };
  } catch (error) {
    logger.error('Error completing refund:', error);
    throw error;
  }
};

/**
 * Get return request by order ID
 */
export const getReturnRequestByOrderId = async (
  orderId: string,
): Promise<IReturnRequestDocument | null> => {
  try {
    return await ReturnRequest.findOne({ orderId });
  } catch (error) {
    logger.error('Error getting return request:', error);
    throw error;
  }
};

