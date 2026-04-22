/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

import { API_BASE_URL } from '@constants/api';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // CORS configuration
  withCredentials: false, // Set to true if your backend requires credentials
});

/**
 * Request interceptor - Add Bearer token to all requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add ngrok-skip-browser-warning header to bypass ngrok warning page
    if (config.headers) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }

    // CORS headers - These are handled by the browser automatically for cross-origin requests
    // The backend should set proper CORS headers in the response
    if (config.headers) {
      // Add Origin header if needed (browser does this automatically)
      // config.headers['Origin'] = window.location.origin;
    }

    // If FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors globally
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if response has success: false even with 200 status
    // Only show error toast if success is explicitly false
    if (response.data && typeof response.data.success === 'boolean' && response.data.success === false) {
      const returnMessage = response.data?.Response?.ReturnMessage || 
                           response.data?.ReturnMessage || 
                           response.data?.message || 
                           'An error occurred';
      
      // Don't show toast for empty result messages (e.g., "not found", "no vehicles", "no records")
      // These are handled by the UI with info messages in tables/lists
      const isEmptyResultMessage = 
        returnMessage.toLowerCase().includes('not found') ||
        returnMessage.toLowerCase().includes('no vehicles') ||
        returnMessage.toLowerCase().includes('no records') ||
        returnMessage.toLowerCase().includes('empty');
      
      // Check for x-skip-toast header to suppress error toasts
      const skipToast = response.config.headers?.['x-skip-toast'] === 'true';
      
      if (!isEmptyResultMessage && !skipToast) {
        useToastStore.getState().showToast(returnMessage, 'error');
      }
      return Promise.reject(new Error(returnMessage));
    }
    // For success: true responses, just return the response without showing any toast
    return response;
  },
  (error: AxiosError) => {
    // Check for x-skip-toast header to suppress error toasts
    const skipToast = error.config?.headers?.['x-skip-toast'] === 'true';

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data as any;

      // Extract ReturnMessage from error response
      const returnMessage = responseData?.Response?.ReturnMessage || 
                           responseData?.ReturnMessage || 
                           responseData?.message || 
                           null;

      // Show toast with ReturnMessage if available
      if (returnMessage && !skipToast) {
        useToastStore.getState().showToast(returnMessage, 'error');
      }

      // Handle 401 Unauthorized - Clear auth and redirect to login
      if (status === 401) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        if (!returnMessage) {
          console.error('Access forbidden: You do not have permission to access this resource');
        }
      }

      // Handle 404 Not Found
      if (status === 404) {
        if (!returnMessage) {
          console.error('Resource not found');
        }
      }

      // Handle 500 Internal Server Error
      if (status >= 500) {
        if (!returnMessage) {
          console.error('Server error: Please try again later');
        }
      }
    } else if (error.request) {
      // Handle CORS errors specifically
      if (error.message && (error.message.includes('CORS') || error.message.includes('Network Error'))) {
        useToastStore.getState().showToast('CORS error: Please check backend CORS configuration', 'error');
        console.error('CORS Error: The backend server needs to allow requests from this origin. Please configure CORS on your Vercel backend.');
      } else {
        useToastStore.getState().showToast('Network error: Please check your internet connection', 'error');
        console.error('Network error: Please check your internet connection');
      }
    } else {
      useToastStore.getState().showToast(error.message || 'An error occurred', 'error');
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

