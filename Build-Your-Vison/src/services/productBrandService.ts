import apiClient from './apiClient';

export interface IProductBrand {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  products?: number;
  createdAt: string;
}

export interface IProductBrandListResponse {
  productBrands: IProductBrand[];
}

export interface ICreateProductBrandPayload {
  name: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface IUpdateProductBrandPayload {
  name?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export const getProductBrands = async (params?: {
  search?: string;
  status?: string;
}): Promise<IProductBrandListResponse> => {
  const response = await apiClient.get<IProductBrandListResponse>('/admin/product-brands', { params });
  return response.data;
};

export const createProductBrand = async (payload: ICreateProductBrandPayload): Promise<IProductBrand> => {
  const response = await apiClient.post<IProductBrand>('/admin/product-brands', payload);
  return response.data;
};

export const updateProductBrand = async (
  id: string,
  payload: IUpdateProductBrandPayload,
): Promise<IProductBrand> => {
  const response = await apiClient.put<IProductBrand>(`/admin/product-brands/${id}`, payload);
  return response.data;
};

export const deleteProductBrand = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/admin/product-brands/${id}`,
  );
  return response.data;
};
