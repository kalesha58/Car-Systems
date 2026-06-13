/**
 * Auth Service
 * API calls for authentication
 */

import type { IAuthResponse, ILoginPayload } from '../types/auth';
import apiClient from './apiClient';

export interface IForgotPasswordPayload {
  email: string;
}

export interface IForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface IResetPasswordPayload {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export interface IResetPasswordResponse {
  success: boolean;
  message: string;
}

interface ILoginApiResponse {
  success: boolean;
  Response: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string[];
  };
  token: string;
}

/**
 * Login user
 * POST /api/auth/login
 * Request: { email: string, password: string }
 * Response: { success: true, Response: { id, name, email, phone, role: [...] }, token: "..." }
 */
export const login = async (payload: ILoginPayload): Promise<IAuthResponse> => {
  const response = await apiClient.post<ILoginApiResponse>('/api/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  
  const responseData = response.data;
  
  // Handle response structure: { success: true, Response: { id, name, email, phone, role: [...] }, token }
  if (responseData && responseData.success && responseData.Response && responseData.token) {
    const userData = responseData.Response;
    
    // Extract role - ensure it's an array
    const roleArray = Array.isArray(userData.role) ? userData.role : (userData.role ? [userData.role] : []);
    
    // Build user object from response
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      role: roleArray,
      roles: roleArray,
    };
    
    return {
      token: responseData.token,
      user,
    };
  }
  
  throw new Error('Invalid response format');
};

/**
 * Forgot password - Request password reset code (OTP)
 * POST /api/auth/forgot-password
 * Request: { email: string }
 * Response: { success: true, message: string }
 */
export const forgotPassword = async (payload: IForgotPasswordPayload): Promise<IForgotPasswordResponse> => {
  const response = await apiClient.post<IForgotPasswordResponse>('/api/auth/forgot-password', {
    email: payload.email,
  });
  return response.data;
};

/**
 * Reset password with code (OTP)
 * POST /api/auth/reset-password
 * Request: { email: string, code: string, password: string, confirmPassword: string }
 * Response: { success: true, message: string }
 */
export const resetPassword = async (payload: IResetPasswordPayload): Promise<IResetPasswordResponse> => {
  const response = await apiClient.post<IResetPasswordResponse>('/api/auth/reset-password', {
    email: payload.email,
    code: payload.code,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  });
  return response.data;
};

