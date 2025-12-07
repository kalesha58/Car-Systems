import {appAxios} from './apiInterceptors';
import {IDealersResponse, IGetDealersRequest} from '../types/dealer/IDealer';
import {IOrderData, IOrdersListResponse} from '../types/order/IOrder';
import {IProductsResponse, IGetProductsRequest} from '../types/product/IProduct';
import {IVehiclesResponse, IGetVehiclesRequest} from '../types/vehicle/IVehicle';
import {IServicesResponse, IGetServicesRequest} from '../types/service/IService';

export const getDealers = async (
  query?: IGetDealersRequest,
): Promise<IDealersResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IDealersResponse>('/dealers', {params});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDealerById = async (dealerId: string): Promise<IDealersResponse> => {
  try {
    const response = await appAxios.get<IDealersResponse>(`/dealers/${dealerId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface IDealerOrderStats {
  total: number;
  pending?: number;
  confirmed?: number;
  processing?: number;
  shipped?: number;
  delivered?: number;
  cancelled?: number;
  totalRevenue: number;
}

export interface IDealerOrderStatsResponse {
  success: boolean;
  Response: IDealerOrderStats;
}

export const getDealerOrderStats = async (): Promise<IDealerOrderStats> => {
  try {
    const response = await appAxios.get<IDealerOrderStatsResponse>('/dealer/orders/stats');
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    return {
      total: 0,
      totalRevenue: 0,
    };
  } catch (error) {
    throw error;
  }
};

export interface IGetDealerOrdersRequest {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getDealerOrders = async (
  query?: IGetDealerOrdersRequest,
): Promise<IOrderData[]> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IOrdersListResponse>('/dealer/orders', {params});
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    throw error;
  }
};

export interface IGetDealerProductsRequest {
  page?: number;
  limit?: number;
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  status?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getDealerProducts = async (
  query?: IGetDealerProductsRequest,
): Promise<IProductsResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IProductsResponse>('/dealer/products', {params});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface IGetDealerVehiclesRequest {
  page?: number;
  limit?: number;
  vehicleType?: 'Car' | 'Bike';
  brand?: string;
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getDealerVehicles = async (
  query?: IGetDealerVehiclesRequest,
): Promise<IVehiclesResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IVehiclesResponse>('/dealer/vehicles', {params});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface IBusinessRegistration {
  id: string;
  businessName: string;
  type: string;
  address: string;
  phone: string;
  gst?: string;
  status: string;
  approvalCode?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessRegistrationResponse {
  success: boolean;
  Response: IBusinessRegistration;
}

export const getBusinessRegistrationByUserId = async (
  userId: string,
): Promise<IBusinessRegistration | null> => {
  try {
    const response = await appAxios.get<IBusinessRegistrationResponse>(
      `/dealer/business-registration/user/${userId}`,
    );
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export interface IBooking {
  id: string;
  dealerId: string;
  serviceName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBookingsResponse {
  success: boolean;
  Response: IBooking[];
}

export const getBookings = async (): Promise<IBooking[]> => {
  try {
    const response = await appAxios.get<IBookingsResponse>('/dealer/bookings');
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export interface IGetDealerServicesRequest {
  page?: number;
  limit?: number;
  category?: string;
  homeService?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getDealerServices = async (
  query?: IGetDealerServicesRequest,
): Promise<IServicesResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IServicesResponse>('/dealer/services', {params});
    return response.data;
  } catch (error) {
    throw error;
  }
};

