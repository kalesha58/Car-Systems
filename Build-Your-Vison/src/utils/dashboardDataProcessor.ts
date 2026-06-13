/**
 * Dashboard Data Processor
 * Utility functions to process users, dealers, and orders data for dashboard charts and KPIs
 */

import type { IDealerListItem } from '../types/dealer';
import type { IOrderListItem } from '../types/order';
import type { IProduct } from '../types/product';
import type { IUserListItem } from '../types/user';

export interface IProcessedChartData {
  month: string;
  users: number;
  orders: number;
}

export interface IProcessedOrderStatus {
  name: string;
  value: number;
  percentage: number;
}

export interface IProcessedDashboardStats {
  totalUsers: number;
  totalDealers: number;
  totalOrders: number;
  totalProducts: number;
  growth: {
    users: number;
    dealers: number;
    orders: number;
    products: number;
    revenue: number;
  };
  monthlyActivity: {
    users: { current: number; previous: number };
    dealers: { current: number; previous: number };
    orders: { current: number; previous: number };
    products: { current: number; previous: number };
    revenue: { current: number; previous: number };
  };
}

/**
 * Get month name from date string
 */
const getMonthFromDate = (dateString: string): string => {
  try {
    if (!dateString) {
      return 'Unknown';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()] || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

/**
 * Generate last 12 months array
 */
const getLast12Months = (): string[] => {
  const months: string[] = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.push(monthNames[date.getMonth()]);
  }
  
  return months;
};

/**
 * Process users data to get monthly counts
 */
export const processUsersChartData = (users: IUserListItem[]): IProcessedChartData[] => {
  try {
    if (!users || !Array.isArray(users)) {
      return getLast12Months().map((month) => ({
        month,
        users: 0,
        orders: 0,
      }));
    }

    const monthMap = new Map<string, number>();
    const last12Months = getLast12Months();
    
    // Initialize all months with 0
    last12Months.forEach((month) => {
      monthMap.set(month, 0);
    });
    
    // Count users per month
    users.forEach((user) => {
      if (user && user.createdDate) {
        const month = getMonthFromDate(user.createdDate);
        if (month !== 'Unknown') {
          const currentCount = monthMap.get(month) || 0;
          monthMap.set(month, currentCount + 1);
        }
      }
    });
    
    // Convert to array format
    return last12Months.map((month) => ({
      month,
      users: monthMap.get(month) || 0,
      orders: 0, // Will be filled by processOrdersChartData
    }));
  } catch {
    return getLast12Months().map((month) => ({
      month,
      users: 0,
      orders: 0,
    }));
  }
};

/**
 * Process orders data to get monthly counts
 */
export const processOrdersChartData = (orders: IOrderListItem[]): IProcessedChartData[] => {
  try {
    if (!orders || !Array.isArray(orders)) {
      return getLast12Months().map((month) => ({
        month,
        users: 0,
        orders: 0,
      }));
    }

    const monthMap = new Map<string, number>();
    const last12Months = getLast12Months();
    
    // Initialize all months with 0
    last12Months.forEach((month) => {
      monthMap.set(month, 0);
    });
    
    // Count orders per month
    orders.forEach((order) => {
      if (order && order.date) {
        const month = getMonthFromDate(order.date);
        if (month !== 'Unknown') {
          const currentCount = monthMap.get(month) || 0;
          monthMap.set(month, currentCount + 1);
        }
      }
    });
    
    // Convert to array format
    return last12Months.map((month) => ({
      month,
      users: 0, // Will be filled by processUsersChartData
      orders: monthMap.get(month) || 0,
    }));
  } catch {
    return getLast12Months().map((month) => ({
      month,
      users: 0,
      orders: 0,
    }));
  }
};

/**
 * Merge users and orders chart data
 */
export const mergeChartData = (
  usersData: IProcessedChartData[],
  ordersData: IProcessedChartData[]
): IProcessedChartData[] => {
  return usersData.map((userItem, index) => ({
    month: userItem.month,
    users: userItem.users,
    orders: ordersData[index]?.orders || 0,
  }));
};

/**
 * Process orders data to get status distribution
 */
export const processOrderStatusDistribution = (orders: IOrderListItem[]): IProcessedOrderStatus[] => {
  try {
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return [];
    }

    const statusMap = new Map<string, number>();
    
    // Count orders by status
    orders.forEach((order) => {
      if (order && order.status) {
        const status = order.status;
        const currentCount = statusMap.get(status) || 0;
        statusMap.set(status, currentCount + 1);
      }
    });
    
    // Calculate total
    const total = orders.length;
    
    // Convert to array format with percentages
    return Array.from(statusMap.entries())
      .map(([status, count]) => ({
        name: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
        value: count || 0,
        percentage: total > 0 ? Math.round(((count || 0) / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  } catch {
    return [];
  }
};

/**
 * Calculate growth percentage between two periods
 */
const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * Process dashboard stats from users, dealers, and orders data
 */
export const processDashboardStats = (
  users: IUserListItem[],
  dealers: IDealerListItem[],
  orders: IOrderListItem[],
  products: IProduct[] = []
): IProcessedDashboardStats => {
  try {
    const safeUsers = users || [];
    const safeDealers = dealers || [];
    const safeOrders = orders || [];
    const safeProducts = products || [];

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Current month counts with error handling
    const currentMonthUsers = safeUsers.filter((user) => {
      if (!user || !user.createdDate) return false;
      try {
        const userDate = new Date(user.createdDate);
        return !isNaN(userDate.getTime()) && userDate >= currentMonthStart;
      } catch {
        return false;
      }
    }).length;
    
    const currentMonthDealers = safeDealers.filter((dealer) => {
      if (!dealer || !dealer.createdDate) return false;
      try {
        const dealerDate = new Date(dealer.createdDate);
        return !isNaN(dealerDate.getTime()) && dealerDate >= currentMonthStart;
      } catch {
        return false;
      }
    }).length;
    
    const currentMonthOrders = safeOrders.filter((order) => {
      if (!order || !order.date) return false;
      try {
        const orderDate = new Date(order.date);
        return !isNaN(orderDate.getTime()) && orderDate >= currentMonthStart;
      } catch {
        return false;
      }
    }).length;
    
    const currentMonthRevenue = safeOrders
      .filter((order) => {
        if (!order || !order.date) return false;
        try {
          const orderDate = new Date(order.date);
          return !isNaN(orderDate.getTime()) && orderDate >= currentMonthStart;
        } catch {
          return false;
        }
      })
      .reduce((sum, order) => sum + (order.amount || 0), 0);
    
    // Previous month counts with error handling
    const previousMonthUsers = safeUsers.filter((user) => {
      if (!user || !user.createdDate) return false;
      try {
        const userDate = new Date(user.createdDate);
        return !isNaN(userDate.getTime()) && userDate >= previousMonthStart && userDate <= previousMonthEnd;
      } catch {
        return false;
      }
    }).length;
    
    const previousMonthDealers = safeDealers.filter((dealer) => {
      if (!dealer || !dealer.createdDate) return false;
      try {
        const dealerDate = new Date(dealer.createdDate);
        return !isNaN(dealerDate.getTime()) && dealerDate >= previousMonthStart && dealerDate <= previousMonthEnd;
      } catch {
        return false;
      }
    }).length;
    
    const previousMonthOrders = safeOrders.filter((order) => {
      if (!order || !order.date) return false;
      try {
        const orderDate = new Date(order.date);
        return !isNaN(orderDate.getTime()) && orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
      } catch {
        return false;
      }
    }).length;
    
    const previousMonthRevenue = safeOrders
      .filter((order) => {
        if (!order || !order.date) return false;
        try {
          const orderDate = new Date(order.date);
          return !isNaN(orderDate.getTime()) && orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
        } catch {
          return false;
        }
      })
      .reduce((sum, order) => sum + (order.amount || 0), 0);
    
    const safeTotalProducts = safeProducts.length;

    const currentMonthProducts = safeProducts.filter((product) => {
      if (!product || !product.createdDate) return false;
      try {
        const productDate = new Date(product.createdDate);
        return !isNaN(productDate.getTime()) && productDate >= currentMonthStart;
      } catch {
        return false;
      }
    }).length;

    const previousMonthProducts = safeProducts.filter((product) => {
      if (!product || !product.createdDate) return false;
      try {
        const productDate = new Date(product.createdDate);
        return (
          !isNaN(productDate.getTime()) &&
          productDate >= previousMonthStart &&
          productDate <= previousMonthEnd
        );
      } catch {
        return false;
      }
    }).length;

    return {
      totalUsers: safeUsers.length,
      totalDealers: safeDealers.length,
      totalOrders: safeOrders.length,
      totalProducts: safeTotalProducts,
      growth: {
        users: calculateGrowth(currentMonthUsers, previousMonthUsers),
        dealers: calculateGrowth(currentMonthDealers, previousMonthDealers),
        orders: calculateGrowth(currentMonthOrders, previousMonthOrders),
        products: calculateGrowth(currentMonthProducts, previousMonthProducts),
        revenue: calculateGrowth(currentMonthRevenue, previousMonthRevenue),
      },
      monthlyActivity: {
        users: { current: currentMonthUsers, previous: previousMonthUsers },
        dealers: { current: currentMonthDealers, previous: previousMonthDealers },
        orders: { current: currentMonthOrders, previous: previousMonthOrders },
        products: { current: currentMonthProducts, previous: previousMonthProducts },
        revenue: { current: currentMonthRevenue, previous: previousMonthRevenue },
      },
    };
  } catch {
    return {
      totalUsers: 0,
      totalDealers: 0,
      totalOrders: 0,
      totalProducts: products?.length || 0,
      growth: {
        users: 0,
        dealers: 0,
        orders: 0,
        products: 0,
        revenue: 0,
      },
      monthlyActivity: {
        users: { current: 0, previous: 0 },
        dealers: { current: 0, previous: 0 },
        orders: { current: 0, previous: 0 },
        products: { current: 0, previous: 0 },
        revenue: { current: 0, previous: 0 },
      },
    };
  }
};

