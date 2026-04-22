/**
 * Product Service
 * API calls for product management
 */

import type { IProduct } from '../types/product';
import apiClient from './apiClient';

export interface IProductListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IProductListResponse {
  products: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ICreateProductPayload {
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  images?: string[];
  vehicleType: string;
  specifications?: Record<string, string>;
  returnPolicy: string;
  tags?: string[];
}

export interface IUpdateProductPayload {
  name?: string;
  brand?: string;
  category?: string;
  price?: number;
  stock?: number;
  status?: string;
  description?: string;
  images?: string[];
  vehicleType?: string;
  specifications?: Record<string, string>;
  returnPolicy?: string;
  tags?: string[];
}

export interface IUpdateStockPayload {
  stock: number;
  operation: 'set' | 'add' | 'subtract';
}

/**
 * Get all products with pagination and filters
 */
export const getProducts = async (params?: IProductListQueryParams, signal?: AbortSignal): Promise<IProductListResponse> => {
  const response = await apiClient.get<IProductListResponse>('/admin/products', { params, signal });
  return response.data;
};

/**
 * Get product by ID
 */
export const getProductById = async (id: string): Promise<IProduct> => {
  const response = await apiClient.get<IProduct>(`/admin/products/${id}`);
  return response.data;
};

/**
 * Create a new product for a dealer
 * @param dealerId - The dealer ID (path parameter)
 * @param payload - Product data
 */
export const createProduct = async (dealerId: string, payload: ICreateProductPayload | FormData): Promise<IProduct> => {
  // FormData handling is done in the API client interceptor
  const response = await apiClient.post<IProduct>(`/admin/dealers/${dealerId}/products`, payload);
  return response.data;
};

/**
 * Update product information for a dealer
 * @param dealerId - The dealer ID (path parameter)
 * @param productId - The product ID (path parameter)
 * @param payload - Product data
 */
export const updateProduct = async (dealerId: string, productId: string, payload: IUpdateProductPayload | FormData): Promise<IProduct> => {
  // FormData handling is done in the API client interceptor
  const response = await apiClient.put<IProduct>(`/admin/dealers/${dealerId}/products/${productId}`, payload);
  return response.data;
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/admin/products/${id}`);
  return response.data;
};

/**
 * Update product stock
 */
export const updateProductStock = async (id: string, payload: IUpdateStockPayload): Promise<IProduct> => {
  const response = await apiClient.patch<IProduct>(`/admin/products/${id}/stock`, payload);
  return response.data;
};

