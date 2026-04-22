/**
 * Order Service
 * API calls for order management
 */

import type { IOrderDetails, IOrderListItem } from '../types/order';
import apiClient from './apiClient';

export interface IOrderListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dealerId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IOrderListResponse {
  orders: IOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ICreateOrderPayload {
  userId: string;
  dealerId: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  paymentMethod: string;
  billingAddress?: IAddress;
}

export interface IUpdateOrderStatusPayload {
  status: string;
  notes?: string;
}

export interface ICancelOrderPayload {
  reason: string;
}

export interface IAssignDealerPayload {
  dealerId: string;
}

export interface ITrackingPayload {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery: string;
}

export interface ITrackingResponse {
  tracking: {
    trackingNumber: string;
    carrier: string;
    status: string;
    estimatedDelivery: string;
  };
}

export interface ITimelineItem {
  status: string;
  timestamp: string;
  notes: string;
}

export interface IOrderTimelineResponse {
  timeline: ITimelineItem[];
}

/**
 * Get all orders with pagination and filters
 */
export const getOrders = async (params?: IOrderListQueryParams): Promise<IOrderListResponse> => {
  const response = await apiClient.get<IOrderListResponse>('/admin/orders', { params });
  return response.data;
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: string): Promise<IOrderDetails> => {
  const response = await apiClient.get<IOrderDetails>(`/admin/orders/${id}`);
  return response.data;
};

/**
 * Create a new order
 */
export const createOrder = async (payload: ICreateOrderPayload): Promise<IOrderDetails> => {
  const response = await apiClient.post<IOrderDetails>('/admin/orders', payload);
  return response.data;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (id: string, payload: IUpdateOrderStatusPayload): Promise<IOrderDetails> => {
  const response = await apiClient.patch<IOrderDetails>(`/admin/orders/${id}/status`, payload);
  return response.data;
};

/**
 * Cancel an order
 */
export const cancelOrder = async (id: string, payload: ICancelOrderPayload): Promise<IOrderDetails> => {
  const response = await apiClient.post<IOrderDetails>(`/admin/orders/${id}/cancel`, payload);
  return response.data;
};

/**
 * Assign dealer to order
 */
export const assignDealerToOrder = async (id: string, payload: IAssignDealerPayload): Promise<IOrderDetails> => {
  const response = await apiClient.post<IOrderDetails>(`/admin/orders/${id}/assign-dealer`, payload);
  return response.data;
};

/**
 * Add tracking information to order
 */
export const addTrackingInfo = async (id: string, payload: ITrackingPayload): Promise<ITrackingResponse> => {
  const response = await apiClient.post<ITrackingResponse>(`/admin/orders/${id}/tracking`, payload);
  return response.data;
};

/**
 * Get order timeline
 */
export const getOrderTimeline = async (id: string): Promise<IOrderTimelineResponse> => {
  const response = await apiClient.get<IOrderTimelineResponse>(`/admin/orders/${id}/timeline`);
  return response.data;
};

