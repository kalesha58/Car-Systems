/**
 * Dashboard Service
 * API calls for dashboard statistics and charts
 * Uses users, dealers, and orders APIs to calculate dashboard data
 */

import {
  processDashboardStats,
  processOrdersChartData,
  processOrderStatusDistribution,
  processUsersChartData,
} from '@utils/dashboardDataProcessor';

import type { IDealerListItem } from '../types/dealer';
import type { IOrderListItem } from '../types/order';
import type { IProduct } from '../types/product';
import type { IUserListItem } from '../types/user';
import { getOrders, type IOrderListResponse } from './orderService';
import { getProducts, type IProductListResponse } from './productService';
import { getUsers, type IUserListResponse } from './userService';

interface IMetricActivity {
  current: number;
  previous: number;
}

export interface IDashboardStats {
  totalUsers: number;
  totalDealers: number;
  totalOrders: number;
  totalProducts: number;
  revenue: number;
  growth: {
    users: number;
    dealers: number;
    orders: number;
    products: number;
    revenue: number;
  };
  monthlyActivity: {
    users: IMetricActivity;
    dealers: IMetricActivity;
    orders: IMetricActivity;
    products: IMetricActivity;
    revenue: IMetricActivity;
  };
}

export interface IChartDataPoint {
  month: string;
  users?: number;
  orders?: number;
}

export interface IOrderStatusDistribution {
  status: string;
  count: number;
}

export interface IChartQueryParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Fetch all users by paginating through all pages
 */
const fetchAllUsers = async (): Promise<IUserListItem[]> => {
  try {
    const allUsers: IUserListItem[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 100;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    while (hasMore && consecutiveErrors < maxConsecutiveErrors) {
      try {
        const response: IUserListResponse = await getUsers({
          page,
          limit,
          sortBy: 'createdAt',
          sortOrder: 'asc',
        });

        if (!response || !response.users || !Array.isArray(response.users)) {
          break;
        }

        // Map API response (createdAt) to component type (createdDate)
        const mappedUsers: IUserListItem[] = response.users.map((user) => ({
          ...user,
          createdDate: (user as any).createdAt || user.createdDate || new Date().toISOString(),
        }));

        allUsers.push(...mappedUsers);

        if (!response.pagination || page >= response.pagination.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          break;
        }
        page++;
      }
    }

    return allUsers;
  } catch (error) {
    return [];
  }
};

/**
 * Fetch all dealers by paginating through all pages using users API with role=dealer
 */
const fetchAllDealers = async (): Promise<IDealerListItem[]> => {
  try {
    const allDealers: IDealerListItem[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 100;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    while (hasMore && consecutiveErrors < maxConsecutiveErrors) {
      try {
        const response: IUserListResponse = await getUsers({
          page,
          limit,
          role: 'dealer',
          sortBy: 'createdAt',
          sortOrder: 'asc',
        });

        if (!response || !response.users || !Array.isArray(response.users)) {
          break;
        }

        // Map user response to dealer format
        const mappedDealers: IDealerListItem[] = response.users.map((user) => ({
          id: user.id,
          name: user.name,
          businessName: user.name,
          phone: user.phone,
          email: user.email,
          status: user.status === 'active' ? 'approved' : (user.status === 'blocked' ? 'suspended' : 'pending'),
          location: '',
          rating: 0,
          totalOrders: user.ordersCount || 0,
          createdDate: user.createdDate || new Date().toISOString(),
        }));

        allDealers.push(...mappedDealers);

        if (!response.pagination || page >= response.pagination.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          break;
        }
        page++;
      }
    }

    return allDealers;
  } catch (error) {
    return [];
  }
};

/**
 * Fetch all orders by paginating through all pages
 */
const fetchAllOrders = async (): Promise<IOrderListItem[]> => {
  try {
    const allOrders: IOrderListItem[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 100;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    while (hasMore && consecutiveErrors < maxConsecutiveErrors) {
      try {
        const response: IOrderListResponse = await getOrders({
          page,
          limit,
          sortBy: 'createdAt',
          sortOrder: 'asc',
        });

        if (!response || !response.orders || !Array.isArray(response.orders)) {
          break;
        }

        // Map API response to IOrderListItem format
        const mappedOrders: IOrderListItem[] = response.orders.map((order) => ({
          id: order.id || '',
          userId: (order as any).user?.id || order.userId || '',
          userName: (order as any).user?.name || order.userName || '',
          dealerId: (order as any).dealer?.id || order.dealerId || '',
          dealerName: (order as any).dealer?.name || (order as any).dealer?.businessName || order.dealerName || '',
          amount: (order as any).totalAmount || order.amount || 0,
          status: (order.status as 'pending' | 'processing' | 'completed' | 'cancelled') || 'pending',
          date: (order as any).createdAt || order.date || new Date().toISOString(),
          items: order.items || [],
          paymentMethod: order.paymentMethod || '',
          paymentStatus: order.paymentStatus || '',
        }));

        allOrders.push(...mappedOrders);

        if (!response.pagination || page >= response.pagination.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          break;
        }
        page++;
      }
    }

    return allOrders;
  } catch (error) {
    return [];
  }
};

/**
 * Fetch all products by paginating through all pages
 */
const fetchAllProducts = async (): Promise<IProduct[]> => {
  try {
    const allProducts: IProduct[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 100;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    while (hasMore && consecutiveErrors < maxConsecutiveErrors) {
      try {
        const response: IProductListResponse = await getProducts({
          page,
          limit,
          sortBy: 'createdAt',
          sortOrder: 'asc',
        });

        if (!response || !response.products || !Array.isArray(response.products)) {
          break;
        }

        const mappedProducts: IProduct[] = response.products.map((product) => ({
          ...product,
          createdDate: (product as any).createdAt || product.createdDate || new Date().toISOString(),
        }));

        allProducts.push(...mappedProducts);

        if (!response.pagination || page >= response.pagination.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          break;
        }
        page++;
      }
    }

    return allProducts;
  } catch (error) {
    return [];
  }
};

/**
 * Get dashboard statistics from users, dealers, and orders data
 */
export const getDashboardStats = async (): Promise<IDashboardStats> => {
  try {
    const results = await Promise.allSettled([
      fetchAllUsers(),
      fetchAllDealers(),
      fetchAllOrders(),
      fetchAllProducts(),
    ]);

    const users = results[0].status === 'fulfilled' ? results[0].value : [];
    const dealers = results[1].status === 'fulfilled' ? results[1].value : [];
    const orders = results[2].status === 'fulfilled' ? results[2].value : [];
    const products = results[3].status === 'fulfilled' ? results[3].value : [];

    const processedStats = processDashboardStats(users, dealers, orders, products);

    // Calculate total revenue from orders
    const revenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

    return {
      ...processedStats,
      revenue,
    };
  } catch (error) {
    return {
      totalUsers: 0,
      totalDealers: 0,
      totalOrders: 0,
      totalProducts: 0,
      revenue: 0,
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

/**
 * Get users chart data from users API
 */
export const getUsersChartData = async (params?: IChartQueryParams): Promise<IChartDataPoint[]> => {
  try {
    const users = await fetchAllUsers();
    
    if (!users || users.length === 0) {
      // Return empty chart data for last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames.map((month) => ({ month, users: 0 }));
    }
    
    // Filter by date range if provided
    let filteredUsers = users;
    if (params?.startDate || params?.endDate) {
      filteredUsers = users.filter((user) => {
        if (!user.createdDate) return false;
        try {
          const userDate = new Date(user.createdDate);
          if (isNaN(userDate.getTime())) return false;
          if (params.startDate && userDate < new Date(params.startDate)) {
            return false;
          }
          if (params.endDate && userDate > new Date(params.endDate)) {
            return false;
          }
          return true;
        } catch {
          return false;
        }
      });
    }

    const chartData = processUsersChartData(filteredUsers);
    return chartData.map((item) => ({
      month: item.month,
      users: item.users || 0,
    }));
  } catch (error) {
    // Return empty chart data for last 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((month) => ({ month, users: 0 }));
  }
};

/**
 * Get orders chart data from orders API
 */
export const getOrdersChartData = async (params?: IChartQueryParams): Promise<IChartDataPoint[]> => {
  try {
    const orders = await fetchAllOrders();
    
    if (!orders || orders.length === 0) {
      // Return empty chart data for last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames.map((month) => ({ month, orders: 0 }));
    }
    
    // Filter by date range if provided
    let filteredOrders = orders;
    if (params?.startDate || params?.endDate) {
      filteredOrders = orders.filter((order) => {
        if (!order.date) return false;
        try {
          const orderDate = new Date(order.date);
          if (isNaN(orderDate.getTime())) return false;
          if (params.startDate && orderDate < new Date(params.startDate)) {
            return false;
          }
          if (params.endDate && orderDate > new Date(params.endDate)) {
            return false;
          }
          return true;
        } catch {
          return false;
        }
      });
    }

    const chartData = processOrdersChartData(filteredOrders);
    return chartData.map((item) => ({
      month: item.month,
      orders: item.orders || 0,
    }));
  } catch (error) {
    // Return empty chart data for last 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((month) => ({ month, orders: 0 }));
  }
};

/**
 * Get order status distribution from orders API
 */
export const getOrderStatusDistribution = async (): Promise<IOrderStatusDistribution[]> => {
  try {
    const orders = await fetchAllOrders();
    
    if (!orders || orders.length === 0) {
      return [];
    }
    
    const distribution = processOrderStatusDistribution(orders);
    
    return distribution.map((item) => ({
      status: item.name.toLowerCase(),
      count: item.value || 0,
    }));
  } catch (error) {
    return [];
  }
};

