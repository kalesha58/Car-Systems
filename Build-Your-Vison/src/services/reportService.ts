/**
 * Report Service
 * API calls for reports and analytics
 */

import apiClient from './apiClient';

export interface IReportQueryParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'month' | 'year';
  dealerId?: string;
  categoryId?: string;
}

export interface ISalesReportDataPoint {
  period: string;
  totalSales: number;
  totalOrders: number;
}

export interface ISalesReportResponse {
  totalSales: number;
  totalOrders: number;
  data: ISalesReportDataPoint[];
}

export interface IUsersReportDataPoint {
  period: string;
  users: number;
}

export interface IUsersReportResponse {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  data: IUsersReportDataPoint[];
}

export interface ITopProduct {
  productId: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
}

export interface ILowStockProduct {
  id: string;
  name: string;
  stock: number;
}

export interface IProductsReportResponse {
  topProducts: ITopProduct[];
  lowStock: ILowStockProduct[];
  data: unknown[];
}

export interface IExportReportParams {
  type: 'sales' | 'users' | 'products';
  format: 'excel' | 'pdf';
  startDate?: string;
  endDate?: string;
}

/**
 * Get sales report
 */
export const getSalesReport = async (params?: IReportQueryParams): Promise<ISalesReportResponse> => {
  const response = await apiClient.get<ISalesReportResponse>('/admin/reports/sales', { params });
  return response.data;
};

/**
 * Get users report
 */
export const getUsersReport = async (params?: IReportQueryParams): Promise<IUsersReportResponse> => {
  const response = await apiClient.get<IUsersReportResponse>('/admin/reports/users', { params });
  return response.data;
};

/**
 * Get products report
 */
export const getProductsReport = async (params?: IReportQueryParams): Promise<IProductsReportResponse> => {
  const response = await apiClient.get<IProductsReportResponse>('/admin/reports/products', { params });
  return response.data;
};

/**
 * Export report as Excel or PDF
 */
export const exportReport = async (params: IExportReportParams): Promise<Blob> => {
  const response = await apiClient.get('/admin/reports/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

