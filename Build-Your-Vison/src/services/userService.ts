/**
 * User Service
 * API calls for user management
 */

import type { IUserDetails, IUserListItem } from '../types/user';
import apiClient from './apiClient';

export interface IUserListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  dealerType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IUserListResponse {
  users: IUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ICreateUserPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string[];
}

export interface IUpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string[];
}

export interface IUpdateUserStatusPayload {
  status: 'active' | 'inactive' | 'suspended' | 'blocked';
}

export interface IResetPasswordPayload {
  newPassword: string;
}

export interface ISendResetPasswordCodeResponse {
  success: boolean;
  message: string;
}

export interface IVerifyResetPasswordCodePayload {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export interface IUserOrdersResponse {
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

export interface IUserVehiclesResponse {
  vehicles: Array<{
    id: string;
    brand: string;
    model: string;
    numberPlate: string;
    year?: number;
  }>;
}

/**
 * Get all users with pagination and filters
 */
export const getUsers = async (params?: IUserListQueryParams): Promise<IUserListResponse> => {
  const response = await apiClient.get<IUserListResponse>('/admin/users', { params });
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<IUserDetails> => {
  const response = await apiClient.get<IUserDetails>(`/admin/users/${id}`);
  return response.data;
};

/**
 * Create a new user
 */
export const createUser = async (payload: ICreateUserPayload): Promise<IUserListItem> => {
  const response = await apiClient.post<IUserListItem>('/admin/users', payload);
  return response.data;
};

/**
 * Update user information
 */
export const updateUser = async (id: string, payload: IUpdateUserPayload): Promise<IUserListItem> => {
  const response = await apiClient.put<IUserListItem>(`/admin/users/${id}`, payload);
  return response.data;
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/admin/users/${id}`);
  return response.data;
};

/**
 * Update user status (block/unblock)
 */
export const updateUserStatus = async (id: string, payload: IUpdateUserStatusPayload): Promise<IUserListItem> => {
  const response = await apiClient.patch<IUserListItem>(`/admin/users/${id}/status`, payload);
  return response.data;
};

/**
 * Send reset password code to user's email (Admin)
 * POST /admin/users/:id/reset-password with empty body {}
 * Sends a 6-digit OTP code to the user's email address
 */
export const sendResetPasswordCode = async (id: string): Promise<ISendResetPasswordCodeResponse> => {
  // Call with empty body to send code to user's email
  const response = await apiClient.post<ISendResetPasswordCodeResponse>(`/admin/users/${id}/reset-password`, {});
  return response.data;
};

/**
 * Verify reset password code and update password (Admin)
 * POST /admin/users/:id/reset-password with { email, code, password, confirmPassword }
 * Verifies the 6-digit OTP code and updates the user's password
 */
export const verifyResetPasswordCode = async (id: string, payload: IVerifyResetPasswordCodePayload): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(`/admin/users/${id}/reset-password`, {
    email: payload.email,
    code: payload.code,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  });
  return response.data;
};

/**
 * Admin reset user password directly (without code verification)
 * POST /admin/users/:id/reset-password with { newPassword }
 * Directly updates password without code verification (if backend supports it)
 */
export const resetUserPassword = async (id: string, payload: IResetPasswordPayload): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(`/admin/users/${id}/reset-password`, payload);
  return response.data;
};

/**
 * Get user orders
 */
export const getUserOrders = async (id: string, params?: { page?: number; limit?: number }): Promise<IUserOrdersResponse> => {
  const response = await apiClient.get<IUserOrdersResponse>(`/admin/users/${id}/orders`, { params });
  return response.data;
};

/**
 * Get user vehicles
 */
export const getUserVehicles = async (id: string): Promise<IUserVehiclesResponse> => {
  const response = await apiClient.get<IUserVehiclesResponse>(`/admin/users/${id}/vehicles`);
  return response.data;
};

