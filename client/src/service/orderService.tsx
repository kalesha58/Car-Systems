import {appAxios} from './apiInterceptors';
import {
  ICreateOrderRequest,
  IOrderResponse,
  IOrderData,
  IOrdersListResponse,
  ILocation,
} from '../types/order/IOrder';

export const createOrder = async (
  orderData: ICreateOrderRequest,
): Promise<IOrderData | null> => {
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

export const getOrderById = async (orderId: string): Promise<IOrderData | null> => {
  try {
    const response = await appAxios.get<IOrderResponse>(`/user/orders/${orderId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getOrderStatus = async (orderId: string): Promise<{
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentDetails?: any;
} | null> => {
  try {
    const response = await appAxios.get(`/user/orders/${orderId}/status`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getUserOrders = async (
  page?: number,
  limit?: number,
  status?: string,
): Promise<IOrderData[]> => {
  try {
    const params: Record<string, string> = {};
    if (page !== undefined) params.page = page.toString();
    if (limit !== undefined) params.limit = limit.toString();
    if (status) params.status = status;

    const response = await appAxios.get<IOrdersListResponse>('/user/orders', {params});
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    throw error;
  }
};

export const sendLiveOrderUpdates = async (
  orderId: string,
  location: ILocation | null,
  status: string,
): Promise<IOrderData | null> => {
  try {
    const requestBody: {
      status: string;
      deliveryPersonLocation?: ILocation;
    } = {
      status,
    };

    if (location) {
      requestBody.deliveryPersonLocation = location;
    }

    const response = await appAxios.patch<{
      success: boolean;
      Response: IOrderData;
    }>(`/dealer/orders/${orderId}/status`, requestBody);

    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const confirmOrder = async (
  orderId: string,
  location: ILocation | null,
): Promise<IOrderData | null> => {
  try {
    const response = await appAxios.post<{
      success: boolean;
      Response: IOrderData;
    }>(`/dealer/orders/${orderId}/accept`, {
      pickupLocation: location,
    });

    if (response.data.success && response.data.Response) {
      const acceptedOrder = response.data.Response;

      if (location) {
        const updateResponse = await appAxios.patch<{
          success: boolean;
          Response: IOrderData;
        }>(`/dealer/orders/${orderId}/status`, {
          status: acceptedOrder.status,
          deliveryPersonLocation: location,
        });

        if (updateResponse.data.success && updateResponse.data.Response) {
          return updateResponse.data.Response;
        }
      }

      return acceptedOrder;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

