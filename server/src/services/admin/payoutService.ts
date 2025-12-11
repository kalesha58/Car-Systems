import { Payment } from '../../models/Payment';
import { Order } from '../../models/Order';
import { initiateDealerPayout } from '../payment/paymentService';
import { logger } from '../../utils/logger';
import { NotFoundError, AppError } from '../../utils/errorHandler';

export interface IGetPayoutsRequest {
  page?: number;
  limit?: number;
  status?: string;
  orderId?: string;
}

export interface IPayoutInfo {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  payoutId?: string;
  payoutStatus?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get payouts with filters
 */
export const getPayouts = async (
  query: IGetPayoutsRequest,
): Promise<{ payouts: IPayoutInfo[]; pagination: any }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.payoutStatus = query.status;
    }

    if (query.orderId) {
      filter.orderId = query.orderId;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter),
    ]);

    // Get order details for each payment
    const payouts = await Promise.all(
      payments.map(async (payment) => {
        const order = await Order.findById(payment.orderId);
        return {
          id: String(payment._id),
          orderId: payment.orderId,
          orderNumber: order?.orderNumber || 'N/A',
          amount: payment.amount,
          currency: payment.currency,
          payoutId: payment.payoutId,
          payoutStatus: payment.payoutStatus,
          status: payment.status,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        };
      }),
    );

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting payouts:', error);
    throw error;
  }
};

/**
 * Get payout statistics
 */
export const getPayoutStats = async (): Promise<any> => {
  try {
    const payments = await Payment.find({ status: 'completed' });

    const stats = {
      totalPayouts: 0,
      totalAmount: 0,
      completedPayouts: 0,
      failedPayouts: 0,
      pendingPayouts: 0,
      statusBreakdown: {} as Record<string, number>,
    };

    payments.forEach((payment) => {
      if (payment.payoutStatus) {
        stats.totalPayouts++;
        stats.totalAmount += payment.amount;

        if (payment.payoutStatus === 'completed') {
          stats.completedPayouts++;
        } else if (payment.payoutStatus === 'failed') {
          stats.failedPayouts++;
        } else {
          stats.pendingPayouts++;
        }

        stats.statusBreakdown[payment.payoutStatus] =
          (stats.statusBreakdown[payment.payoutStatus] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    logger.error('Error getting payout stats:', error);
    throw error;
  }
};

/**
 * Retry failed payout
 */
export const retryPayout = async (
  orderId: string,
  adminId: string,
): Promise<any> => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const payment = await Payment.findOne({ orderId: orderId });
    if (!payment || payment.status !== 'completed') {
      throw new AppError('Payment not completed or not found', 400);
    }

    if (payment.payoutStatus === 'completed') {
      throw new AppError('Payout already completed', 400);
    }

    // Retry payout
    await initiateDealerPayout(orderId);

    // Update payment record
    await payment.save();

    logger.info(`Payout retry initiated for order: ${order.orderNumber}`, {
      orderId,
      adminId,
    });

    return {
      orderId,
      payoutId: payment.payoutId,
      payoutStatus: payment.payoutStatus,
    };
  } catch (error) {
    logger.error('Error retrying payout:', error);
    throw error;
  }
};

