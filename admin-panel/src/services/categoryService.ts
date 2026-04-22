/**
 * Category Service
 * API calls for category management
 */

import apiClient from './apiClient';

export interface ICategory {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  products: number;
  createdAt: string;
}

export interface ICategoryListQueryParams {
  search?: string;
  status?: string;
}

export interface ICategoryListResponse {
  categories: ICategory[];
}

export interface ICreateCategoryPayload {
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface IUpdateCategoryPayload {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

/**
 * Get all categories with optional filters
 */
export const getCategories = async (params?: ICategoryListQueryParams): Promise<ICategoryListResponse> => {
  const response = await apiClient.get<ICategoryListResponse>('/admin/categories', { params });
  return response.data;
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string): Promise<ICategory> => {
  const response = await apiClient.get<ICategory>(`/admin/categories/${id}`);
  return response.data;
};

/**
 * Create a new category
 */
export const createCategory = async (payload: ICreateCategoryPayload): Promise<ICategory> => {
  const response = await apiClient.post<ICategory>('/admin/categories', payload);
  return response.data;
};

/**
 * Update category information
 */
export const updateCategory = async (id: string, payload: IUpdateCategoryPayload): Promise<ICategory> => {
  const response = await apiClient.put<ICategory>(`/admin/categories/${id}`, payload);
  return response.data;
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/admin/categories/${id}`);
  return response.data;
};

