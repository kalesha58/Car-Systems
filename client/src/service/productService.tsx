import {appAxios} from './apiInterceptors';
import {IProductsResponse, IGetProductsRequest} from '../types/product/IProduct';

export const getProducts = async (
  query?: IGetProductsRequest,
): Promise<IProductsResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IProductsResponse>('/user/products', {params});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductById = async (productId: string): Promise<IProductsResponse> => {
  try {
    const response = await appAxios.get<IProductsResponse>(`/user/products/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

