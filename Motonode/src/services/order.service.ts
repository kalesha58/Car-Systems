import type {
  ICreateOrderRequest,
  IDealerOrderStats,
  IOrderData,
  IOrderResponse,
  IOrdersListResponse,
} from '../types/order';
import { api } from './api';

export type { IOrderData };

export async function createOrder(orderData: ICreateOrderRequest): Promise<IOrderData | null> {
  const response = await api.post<IOrderResponse>('/user/orders', orderData);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  return null;
}

export async function getOrderById(orderId: string): Promise<IOrderData | null> {
  const response = await api.get<IOrderResponse>(`/user/orders/${orderId}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  return null;
}

export async function getOrderStatus(orderId: string): Promise<{
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
} | null> {
  const response = await api.get<{
    success: boolean;
    data: { orderId: string; status: string; paymentStatus: string; paymentMethod: string };
  }>(`/user/orders/${orderId}/status`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  return null;
}

export async function getUserOrders(
  page?: number,
  limit?: number,
  status?: string,
): Promise<IOrderData[]> {
  const params: Record<string, string> = {};
  if (page !== undefined) params.page = page.toString();
  if (limit !== undefined) params.limit = limit.toString();
  if (status) params.status = status;
  const response = await api.get<IOrdersListResponse>('/user/orders', { params });
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  return [];
}

export async function getDealerOrderStats(): Promise<IDealerOrderStats> {
  const response = await api.get<{ success: boolean; Response: IDealerOrderStats }>(
    '/dealer/orders/stats',
  );
  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }
  return { total: 0, totalRevenue: 0 };
}

export async function getDealerOrders(query?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<IOrderData[]> {
  const response = await api.get<{
    success: boolean;
    Response: { orders: IOrderData[] };
  }>('/dealer/orders', { params: query || {} });
  if (response.data.success && response.data.Response?.orders) {
    return response.data.Response.orders;
  }
  return [];
}

export async function updateDealerOrderStatus(
  orderId: string,
  status: string,
): Promise<IOrderData | null> {
  const response = await api.patch<{ success: boolean; Response: IOrderData }>(
    `/dealer/orders/${orderId}/status`,
    { status },
  );
  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }
  return null;
}
