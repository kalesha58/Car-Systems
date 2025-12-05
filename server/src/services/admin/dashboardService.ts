import { SignUp } from '../../models/SignUp';
import { Dealer } from '../../models/Dealer';
import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { IDashboardStats, IChartData, IOrderStatusDistribution } from '../../types/admin';
import { logger } from '../../utils/logger';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<IDashboardStats> => {
  try {
    const [totalUsers, totalDealers, totalOrders, totalProducts] = await Promise.all([
      SignUp.countDocuments({ role: 'user' }),
      Dealer.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
    ]);

    // Calculate revenue from completed orders
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const revenue = revenueResult[0]?.total || 0;

    // Calculate growth (last 30 days vs previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [usersLast30, usersPrevious30, dealersLast30, dealersPrevious30, ordersLast30, ordersPrevious30] =
      await Promise.all([
        SignUp.countDocuments({ role: 'user', createdAt: { $gte: last30Days } }),
        SignUp.countDocuments({ role: 'user', createdAt: { $gte: previous30Days, $lt: last30Days } }),
        Dealer.countDocuments({ createdAt: { $gte: last30Days } }),
        Dealer.countDocuments({ createdAt: { $gte: previous30Days, $lt: last30Days } }),
        Order.countDocuments({ createdAt: { $gte: last30Days } }),
        Order.countDocuments({ createdAt: { $gte: previous30Days, $lt: last30Days } }),
      ]);

    const revenueLast30Result = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: last30Days },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const revenuePrevious30Result = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: previous30Days, $lt: last30Days },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const revenueLast30 = revenueLast30Result[0]?.total || 0;
    const revenuePrevious30 = revenuePrevious30Result[0]?.total || 0;

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalUsers,
      totalDealers,
      totalOrders,
      totalProducts,
      revenue,
      growth: {
        users: calculateGrowth(usersLast30, usersPrevious30),
        dealers: calculateGrowth(dealersLast30, dealersPrevious30),
        orders: calculateGrowth(ordersLast30, ordersPrevious30),
        revenue: calculateGrowth(revenueLast30, revenuePrevious30),
      },
    };
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    throw error;
  }
};

/**
 * Get users chart data
 */
export const getUsersChartData = async (startDate?: string, endDate?: string): Promise<IChartData[]> => {
  try {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const data = await SignUp.aggregate([
      { $match: { role: 'user', ...match } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          users: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return data.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      users: item.users,
    }));
  } catch (error) {
    logger.error('Error getting users chart data:', error);
    throw error;
  }
};

/**
 * Get orders chart data
 */
export const getOrdersChartData = async (startDate?: string, endDate?: string): Promise<IChartData[]> => {
  try {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const data = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return data.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      orders: item.orders,
    }));
  } catch (error) {
    logger.error('Error getting orders chart data:', error);
    throw error;
  }
};

/**
 * Get order status distribution
 */
export const getOrderStatusDistribution = async (): Promise<IOrderStatusDistribution[]> => {
  try {
    const data = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return data.map((item) => ({
      status: item._id,
      count: item.count,
    }));
  } catch (error) {
    logger.error('Error getting order status distribution:', error);
    throw error;
  }
};

