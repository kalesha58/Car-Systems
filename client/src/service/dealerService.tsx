import { appAxios } from './apiInterceptors';
import { IDealersResponse, IGetDealersRequest } from '../types/dealer/IDealer';
import { IOrderData, IOrdersListResponse } from '../types/order/IOrder';
import { IProductsResponse, IGetProductsRequest, IProduct } from '../types/product/IProduct';
import { IVehiclesResponse, IGetVehiclesRequest, IDealerVehicle } from '../types/vehicle/IVehicle';
import { IServicesResponse, IGetServicesRequest, IService } from '../types/service/IService';

export const getDealers = async (
  query?: IGetDealersRequest,
): Promise<IDealersResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IDealersResponse>('/dealers', { params });
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

export interface IDealerOrdersResponse {
  success: boolean;
  Response: {
    orders: IOrderData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const getDealerOrders = async (
  query?: IGetDealerOrdersRequest,
): Promise<IOrderData[]> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IDealerOrdersResponse>('/dealer/orders', { params });
    if (response.data.success && response.data.Response && response.data.Response.orders) {
      return response.data.Response.orders;
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
    const response = await appAxios.get<IProductsResponse>('/dealer/products', { params });
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
    const response = await appAxios.get<IVehiclesResponse>('/dealer/vehicles', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface IPayoutCredentials {
  type: 'UPI' | 'BANK';
  upiId?: string;
  bank?: {
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}

export interface IBusinessRegistration {
  id: string;
  businessName: string;
  type: string;
  address: string;
  phone: string;
  gst?: string;
  payout?: IPayoutCredentials;
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

    if (response.data && response.data.success && response.data.Response) {
      return response.data.Response;
    }

    return null;
  } catch (error: any) {
    // Handle 404 errors (business registration not found) - this is expected
    if (error?.response?.status === 404) {
      return null;
    }

    // Handle 403 errors (permission denied - userId mismatch)
    // This might happen if the userId doesn't match the authenticated user
    if (error?.response?.status === 403) {
      console.warn('Permission denied (403) when fetching business registration. UserId mismatch?', {
        requestedUserId: userId,
        errorMessage: error?.response?.data?.Response?.ReturnMessage || error?.response?.data?.message,
      });
      // Return null to indicate no registration found (or can't access)
      return null;
    }

    // Log other errors for debugging
    console.error('Error in getBusinessRegistrationByUserId:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });

    // For other errors, re-throw to be handled by the caller
    throw error;
  }
};

export interface ICreateBusinessRegistrationRequest {
  businessName: string;
  type: string;
  address: string;
  phone: string;
  gst?: string;
  payout?: IPayoutCredentials;
}

export const createBusinessRegistration = async (
  data: ICreateBusinessRegistrationRequest,
): Promise<IBusinessRegistration> => {
  try {
    const response = await appAxios.post<IBusinessRegistrationResponse>(
      '/dealer/business-registration',
      data,
    );
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to create business registration');
  } catch (error) {
    throw error;
  }
};

export const updateBusinessRegistration = async (
  registrationId: string,
  data: Partial<ICreateBusinessRegistrationRequest>,
): Promise<IBusinessRegistration> => {
  try {
    const response = await appAxios.put<IBusinessRegistrationResponse>(
      `/dealer/business-registration/${registrationId}`,
      data,
    );
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to update business registration');
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
    const response = await appAxios.get<IServicesResponse>('/dealer/services', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Product CRUD operations
export interface ICreateDealerProductRequest {
  name: string;
  brand: string;
  price: number;
  stock: number;
  images: string[];
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  description?: string;
  specifications?: Record<string, any>;
  returnPolicy?: string;
  tags?: string[];
}

export interface IUpdateDealerProductRequest {
  name?: string;
  brand?: string;
  price?: number;
  stock?: number;
  images?: string[];
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  description?: string;
  specifications?: Record<string, any>;
  returnPolicy?: string;
  tags?: string[];
  status?: string;
}

export interface IDealerProductResponse {
  success: boolean;
  Response: IProduct;
}

export const createDealerProduct = async (
  data: ICreateDealerProductRequest,
): Promise<IProduct> => {
  try {
    const response = await appAxios.post<IDealerProductResponse>('/dealer/products', data);
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to create product');
  } catch (error) {
    throw error;
  }
};

export const updateDealerProduct = async (
  productId: string,
  data: IUpdateDealerProductRequest,
): Promise<IProduct> => {
  try {
    const response = await appAxios.put<IDealerProductResponse>(`/dealer/products/${productId}`, data);
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to update product');
  } catch (error) {
    throw error;
  }
};

export const deleteDealerProduct = async (productId: string): Promise<void> => {
  try {
    await appAxios.delete(`/dealer/products/${productId}`);
  } catch (error) {
    throw error;
  }
};

// Vehicle CRUD operations
export interface ICreateDealerVehicleRequest {
  vehicleType: 'Car' | 'Bike';
  brand: string;
  vehicleModel: string;
  year: number;
  price: number;
  availability: 'available' | 'sold' | 'reserved';
  images: string[];
  numberPlate?: string;
  mileage?: number;
  color?: string;
  fuelType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission?: 'Manual' | 'Automatic';
  description?: string;
  features?: string[];
  condition?: 'New' | 'Used' | 'Certified Pre-owned';
}

export interface IUpdateDealerVehicleRequest {
  vehicleType?: 'Car' | 'Bike';
  brand?: string;
  vehicleModel?: string;
  year?: number;
  price?: number;
  availability?: 'available' | 'sold' | 'reserved';
  images?: string[];
  numberPlate?: string;
  mileage?: number;
  color?: string;
  fuelType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission?: 'Manual' | 'Automatic';
  description?: string;
  features?: string[];
  condition?: 'New' | 'Used' | 'Certified Pre-owned';
}

export interface IDealerVehicleResponse {
  success: boolean;
  Response: IDealerVehicle;
}

export const createDealerVehicle = async (
  data: ICreateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    const response = await appAxios.post<IDealerVehicleResponse>('/dealer/vehicles', data);
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to create vehicle');
  } catch (error) {
    throw error;
  }
};

export const updateDealerVehicle = async (
  vehicleId: string,
  data: IUpdateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    const response = await appAxios.put<IDealerVehicleResponse>(`/dealer/vehicles/${vehicleId}`, data);
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to update vehicle');
  } catch (error) {
    throw error;
  }
};

export const deleteDealerVehicle = async (vehicleId: string): Promise<void> => {
  try {
    await appAxios.delete(`/dealer/vehicles/${vehicleId}`);
  } catch (error) {
    throw error;
  }
};

// Service CRUD operations
export interface ICreateDealerServiceRequest {
  name: string;
  price: number;
  durationMinutes: number;
  homeService: boolean;
  description?: string;
  category?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  images?: string[];
}

export interface IUpdateDealerServiceRequest {
  name?: string;
  price?: number;
  durationMinutes?: number;
  homeService?: boolean;
  description?: string;
  category?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  images?: string[];
}

export interface IDealerServiceResponse {
  success: boolean;
  Response: IService;
}

export const createDealerService = async (
  data: ICreateDealerServiceRequest,
): Promise<IService> => {
  try {
    const response = await appAxios.post<IDealerServiceResponse>('/dealer/services', data);
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to create service');
  } catch (error) {
    throw error;
  }
};

export const updateDealerService = async (
  serviceId: string,
  data: IUpdateDealerServiceRequest,
): Promise<IService> => {
  try {
    const response = await appAxios.put<IDealerServiceResponse>(`/dealer/services/${serviceId}`, data);
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to update service');
  } catch (error) {
    throw error;
  }
};

export const deleteDealerService = async (serviceId: string): Promise<void> => {
  try {
    await appAxios.delete(`/dealer/services/${serviceId}`);
  } catch (error) {
    throw error;
  }
};

export const getDealerOrderById = async (orderId: string): Promise<IOrderData | null> => {
  try {
    const response = await appAxios.get<{
      success: boolean;
      Response: IOrderData;
    }>(`/dealer/orders/${orderId}`);
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

