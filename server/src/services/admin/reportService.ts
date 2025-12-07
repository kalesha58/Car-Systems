import { Order } from '../../models/Order';
import { SignUp } from '../../models/SignUp';
import { Product } from '../../models/Product';
import { IGetSalesReportRequest, IGetUsersReportRequest, IGetProductsReportRequest } from '../../types/admin';
import { logger } from '../../utils/logger';
import { Category } from '../../models/Category';

/**
 * Get sales report
 */
export const getSalesReport = async (query: IGetSalesReportRequest) => {
  try {
    const match: any = {};

    if (query.startDate || query.endDate) {
      match.createdAt = {};
      if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
    }

    if (query.dealerId) {
      match.dealerId = query.dealerId;
    }

    match.status = 'DELIVERED';
    match.paymentStatus = 'paid';

    const groupBy = query.groupBy || 'day';

    let groupFormat: any = {};
    if (groupBy === 'day') {
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    } else if (groupBy === 'month') {
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    } else if (groupBy === 'year') {
      groupFormat = {
        year: { $year: '$createdAt' },
      };
    }

    const data = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const totalSalesResult = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const totalOrdersResult = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]);

    return {
      totalSales: totalSalesResult[0]?.total || 0,
      totalOrders: totalOrdersResult[0]?.total || 0,
      data: data.map((item) => ({
        period: groupBy === 'day' 
          ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
          : groupBy === 'month'
          ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
          : `${item._id.year}`,
        totalSales: item.totalSales,
        totalOrders: item.totalOrders,
      })),
    };
  } catch (error) {
    logger.error('Error getting sales report:', error);
    throw error;
  }
};

/**
 * Get users report
 */
export const getUsersReport = async (query: IGetUsersReportRequest) => {
  try {
    const match: any = { role: 'user' };

    if (query.startDate || query.endDate) {
      match.createdAt = {};
      if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
    }

    const groupBy = query.groupBy || 'month';

    let groupFormat: any = {};
    if (groupBy === 'day') {
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    } else if (groupBy === 'month') {
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    } else if (groupBy === 'year') {
      groupFormat = {
        year: { $year: '$createdAt' },
      };
    }

    const data = await SignUp.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupFormat,
          users: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      SignUp.countDocuments({ role: 'user' }),
      SignUp.countDocuments({ role: 'user', ...match }),
      SignUp.countDocuments({ role: 'user' }), // You may want to add lastLogin field
    ]);

    return {
      totalUsers,
      newUsers,
      activeUsers,
      data: data.map((item) => ({
        period: groupBy === 'day' 
          ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
          : groupBy === 'month'
          ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
          : `${item._id.year}`,
        users: item.users,
      })),
    };
  } catch (error) {
    logger.error('Error getting users report:', error);
    throw error;
  }
};

/**
 * Get products report
 */
export const getProductsReport = async (query: IGetProductsReportRequest) => {
  try {
    const match: any = {};

    if (query.categoryId) {
      match.categoryId = query.categoryId;
    }

    if (query.startDate || query.endDate) {
      match.createdAt = {};
      if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
    }

    // Top products by sales
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    // Low stock products
    const lowStock = await Product.find({
      ...match,
      stock: { $lte: 10 },
      status: 'active',
    })
      .sort({ stock: 1 })
      .limit(10);

    // Product data by category
    const data = await Product.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
        },
      },
    ]);

    return {
      topProducts: topProducts.map((item) => ({
        productId: item._id,
        name: item.name,
        totalSold: item.totalSold,
        totalRevenue: item.totalRevenue,
      })),
      lowStock: lowStock.map((item) => ({
        id: (item._id as any).toString(),
        name: item.name,
        stock: item.stock,
      })),
      data: data,
    };
  } catch (error) {
    logger.error('Error getting products report:', error);
    throw error;
  }
};

/**
 * Get revenue by category report
 */
export const getRevenueByCategoryReport = async (query: { startDate?: string; endDate?: string }) => {
  try {
    const match: any = {
      status: 'DELIVERED',
      paymentStatus: 'paid',
    };

    if (query.startDate || query.endDate) {
      match.createdAt = {};
      if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
    }

    // Get orders with items and populate product categories
    const orders = await Order.find(match).lean();
    
    // Get all product IDs from orders
    const productIds = new Set<string>();
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        productIds.add(item.productId);
      });
    });

    // Get products with categories
    const products = await Product.find({
      _id: { $in: Array.from(productIds) }
    }).lean();

    // Get all unique category IDs
    const categoryIds = new Set<string>();
    products.forEach((product: any) => {
      if (product.categoryId) {
        categoryIds.add(product.categoryId);
      }
    });

    // Get category names
    const categories = await Category.find({
      _id: { $in: Array.from(categoryIds) }
    }).lean();

    const categoryNameMap = new Map();
    categories.forEach((category: any) => {
      categoryNameMap.set((category._id as any).toString(), category.name);
    });

    const productCategoryMap = new Map();
    products.forEach((product: any) => {
      const categoryId = product.categoryId;
      const categoryName = categoryId && categoryNameMap.has(categoryId) 
        ? categoryNameMap.get(categoryId) 
        : 'Uncategorized';
      productCategoryMap.set((product._id as any).toString(), categoryName);
    });

    // Aggregate revenue by category
    const categoryRevenue = new Map<string, { totalRevenue: number; orderCount: number; orderIds: Set<string> }>();
    
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const categoryName = productCategoryMap.get(item.productId) || 'Uncategorized';
        
        if (!categoryRevenue.has(categoryName)) {
          categoryRevenue.set(categoryName, {
            totalRevenue: 0,
            orderCount: 0,
            orderIds: new Set(),
          });
        }
        
        const categoryData = categoryRevenue.get(categoryName)!;
        categoryData.totalRevenue += item.total;
        categoryData.orderIds.add((order._id as any).toString());
      });
    });

    // Convert to array format
    const result = Array.from(categoryRevenue.entries()).map(([category, data]) => ({
      category,
      totalRevenue: data.totalRevenue,
      orderCount: data.orderIds.size,
      averageOrderValue: data.totalRevenue / data.orderIds.size,
    }));

    // Sort by total revenue descending
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return result;
  } catch (error) {
    logger.error('Error getting revenue by category report:', error);
    throw error;
  }
};