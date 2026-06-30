import type { IGetProductsRequest, IProduct, IProductsResponse } from '../types/product';
import { api } from './api';

export type { IProduct };

export async function getProducts(query?: IGetProductsRequest): Promise<IProductsResponse> {
  const response = await api.get<IProductsResponse>('/user/products', { params: query || {} });
  return response.data;
}

export async function getProductById(productId: string): Promise<IProductsResponse> {
  const response = await api.get<IProductsResponse>(`/user/products/${productId}`);
  return response.data;
}
