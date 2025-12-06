import {appAxios} from './apiInterceptors';
import {ICreateOrderRequest, IOrderResponse} from '../types/order/IOrder';

export const createOrder = async (
  orderData: ICreateOrderRequest,
): Promise<IOrderResponse['data'] | null> => {
  try {
    const response = await appAxios.post<IOrderResponse>('/user/orders', orderData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

