import {appAxios} from './apiInterceptors';
import {IProductsResponse, IGetProductsRequest} from '../types/product/IProduct';

export const getProducts = async (
  query?: IGetProductsRequest,
): Promise<IProductsResponse> => {
  try {
    const params = query || {};
    console.log('[getProducts] API Request - URL: /user/products, Params:', JSON.stringify(params, null, 2));
    const response = await appAxios.get<IProductsResponse>('/user/products', {params});
    console.log('[getProducts] API Response Status:', response.status);
    console.log('[getProducts] API Response Data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[getProducts] API Error:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
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

