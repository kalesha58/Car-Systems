/**
 * Dealer Service
 * API calls for dealer management
 */

import type { IDealerDetails, IDealerListItem } from '../types/dealer';
import apiClient from './apiClient';

export interface IDealerListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dealerType?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IDealerListResponse {
  dealers: Array<{
    id: string;
    name: string;
    businessName: string;
    email: string;
    phone: string;
    status: string;
    location: string;
    address?: string;
    documents?: any;
    createdAt?: string;
    rating?: number;
    totalOrders?: number;
    dealerType?: string;
    suspensionReason?: string;
    registrationDate?: string;
    approvalDate?: string;
    businessRegistrationId?: string;
  }>;
  pagination: {
    page: string | number;
    limit: string | number;
    total: number;
    totalPages: number;
  };
}

export interface ICreateDealerPayload {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  location: string;
  address: string;
}

export interface IUpdateDealerPayload {
  name?: string;
  businessName?: string;
  phone?: string;
  location?: string;
  address?: string;
}

export interface IRejectDealerPayload {
  reason: string;
}

export interface ISuspendDealerPayload {
  reason: string;
}

export interface IDealerOrdersResponse {
  orders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all dealers with pagination and filters
 */
export const getDealers = async (params?: IDealerListQueryParams, signal?: AbortSignal): Promise<IDealerListResponse> => {
  const response = await apiClient.get<IDealerListResponse>('/admin/dealers', { params, signal });
  return response.data;
};

/**
 * Get dealer by ID
 */
export const getDealerById = async (id: string): Promise<IDealerDetails> => {
  const response = await apiClient.get<IDealerDetails>(`/admin/dealers/${id}`);
  return response.data;
};

/**
 * Create a new dealer
 */
export const createDealer = async (payload: ICreateDealerPayload): Promise<IDealerListItem> => {
  const response = await apiClient.post<IDealerListItem>('/admin/dealers', payload);
  return response.data;
};

/**
 * Update dealer information
 */
export const updateDealer = async (id: string, payload: IUpdateDealerPayload): Promise<IDealerListItem> => {
  const response = await apiClient.put<IDealerListItem>(`/admin/dealers/${id}`, payload);
  return response.data;
};

/**
 * Delete a dealer
 */
export const deleteDealer = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/admin/dealers/${id}`);
  return response.data;
};

/**
 * Approve a pending dealer
 */
export const approveDealer = async (id: string): Promise<IDealerListItem> => {
  const response = await apiClient.post<IDealerListItem>(`/admin/dealers/${id}/approve`);
  return response.data;
};

/**
 * Reject a pending dealer
 */
export const rejectDealer = async (id: string, payload: IRejectDealerPayload): Promise<IDealerListItem> => {
  const response = await apiClient.post<IDealerListItem>(`/admin/dealers/${id}/reject`, payload);
  return response.data;
};

/**
 * Suspend an approved dealer
 */
export const suspendDealer = async (id: string, payload: ISuspendDealerPayload): Promise<IDealerListItem> => {
  const response = await apiClient.post<IDealerListItem>(`/admin/dealers/${id}/suspend`, payload);
  return response.data;
};

/**
 * Get dealer orders
 */
export const getDealerOrders = async (id: string, params?: { page?: number; limit?: number }): Promise<IDealerOrdersResponse> => {
  const response = await apiClient.get<IDealerOrdersResponse>(`/admin/dealers/${id}/orders`, { params });
  return response.data;
};

/**
 * Get business registration by user ID
 * @param userId - The dealer/user ID
 */
export interface IBusinessRegistration {
  id: string;
  businessName: string;
  type: string;
  address: string;
  phone: string;
  gst: string;
  dealerId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBusinessRegistrationResponse {
  success: boolean;
  Response?: {
    id: string;
    businessName: string;
    type: string;
    address: string;
    phone: string;
    gst: string;
    status?: 'pending' | 'approved' | 'rejected';
    payout?: {
      bank?: any;
      type?: string;
      upiId?: string;
    };
    shopPhotos?: string[];
    documents?: any[];
    userId: string;
    createdAt?: string;
    updatedAt?: string;
  };
  message?: string;
  data?: IBusinessRegistration;
}

export interface IUpdateBusinessRegistrationStatusPayload {
  status: 'pending' | 'approved' | 'rejected';
  approvalCode?: string;
}

/**
 * Update business registration status
 * @param id - The business registration ID
 * @param payload - Status data
 */
export const updateBusinessRegistrationStatus = async (
  id: string,
  payload: IUpdateBusinessRegistrationStatusPayload
): Promise<IBusinessRegistrationResponse> => {
  const response = await apiClient.patch<IBusinessRegistrationResponse>(
    `/api/dealer/business-registration/${id}/status`,
    payload
  );
  return response.data;
};

/**
 * Get business registration by business registration ID
 * @param businessRegistrationId - The business registration ID
 */
export const getBusinessRegistrationById = async (businessRegistrationId: string): Promise<IBusinessRegistrationResponse> => {
  const response = await apiClient.get<IBusinessRegistrationResponse>(`/api/dealer/business-registration/${businessRegistrationId}`);
  return response.data;
};

/**
 * Get business registration by user ID
 * @param userId - The user/dealer ID
 */
export const getBusinessRegistrationByUserId = async (userId: string): Promise<IBusinessRegistrationResponse> => {
  try {
    const response = await apiClient.get<IBusinessRegistrationResponse>(`/admin/dealers/${userId}/business-registration`, {
      headers: { 'x-skip-toast': 'true' }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { success: false, message: 'Business registration not found' };
    }
    throw error;
  }
};

/**
 * Get business registration by business registration ID
 * @param businessRegistrationId - The business registration ID
 */
export const getBusinessRegistration = async (businessRegistrationId: string): Promise<IBusinessRegistrationResponse> => {
  const response = await getBusinessRegistrationById(businessRegistrationId);
  return response;
};

/**
 * Create business registration
 * @param dealerId - The dealer/user ID
 * @param payload - Business registration data
 */
export interface ICreateBusinessRegistrationPayload {
  businessName: string;
  type: string;
  address: string;
  phone: string;
  gst: string;
}

// Duplicate interface removed
// export interface IBusinessRegistrationResponse { ... }

export const createBusinessRegistration = async (
  userId: string,
  payload: ICreateBusinessRegistrationPayload
): Promise<IBusinessRegistrationResponse> => {
  // userId is passed as a path parameter: /admin/dealers/{userId}/business-registration
  const response = await apiClient.post<IBusinessRegistrationResponse>(
    `/admin/dealers/${userId}/business-registration`,
    payload
  );
  
  // Return the response data - the interceptor handles success: false cases
  return response.data;
};

/**
 * Update business registration
 * @param userId - The dealer/user ID (must have dealer role)
 * @param payload - Business registration data
 */
export interface IUpdateBusinessRegistrationPayload {
  businessName: string;
  type: string;
  address: string;
  phone: string;
  gst: string;
}

export const updateBusinessRegistration = async (
  userId: string,
  payload: IUpdateBusinessRegistrationPayload
): Promise<IBusinessRegistrationResponse> => {
  // userId is passed as a path parameter: PUT /admin/dealers/{userId}/business-registration
  const response = await apiClient.put<IBusinessRegistrationResponse>(
    `/admin/dealers/${userId}/business-registration`,
    payload
  );
  
  // Return the response data - the interceptor handles success: false cases
  return response.data;
};

