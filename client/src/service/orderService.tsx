import {appAxios} from './apiInterceptors';
import {
  ICreateOrderRequest,
  IOrderResponse,
  IOrderData,
  IOrdersListResponse,
} from '../types/order/IOrder';

export const createOrder = async (
  orderData: ICreateOrderRequest,
): Promise<IOrderData | null> => {
  try {
    const response = await appAxios.post<IOrderResponse>('/user/orders', orderData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<IOrderData | null> => {
  try {
    const response = await appAxios.get<IOrderResponse>(`/user/orders/${orderId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getUserOrders = async (
  page?: number,
  limit?: number,
  status?: string,
): Promise<IOrderData[]> => {
  try {
    const params: Record<string, string> = {};
    if (page !== undefined) params.page = page.toString();
    if (limit !== undefined) params.limit = limit.toString();
    if (status) params.status = status;

    const response = await appAxios.get<IOrdersListResponse>('/user/orders', {params});
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    throw error;
  }
};

