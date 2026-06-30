import type { DealerOnboardingSnapshot } from '../types/api';
import type {
  IBusinessRegistration,
  IBusinessRegistrationResponse,
  IDealer,
  IDealerByIdResponse,
  IDealersResponse,
  IGetDealersRequest,
} from '../types/dealer';
import type { IOrderData } from '../types/order';
import type { IProduct, IProductsResponse } from '../types/product';
import type { IService, IServicesResponse } from '../types/service';
import type { IDealerVehicle, IVehiclesResponse } from '../types/vehicle';
import { parseDealerResponse } from '../types/dealer';
import { api } from './api';

export type { IBusinessRegistration, IDealer };
export { parseDealerResponse };

export interface DealerProfile {
  id: string;
  businessName: string;
}

const BUSINESS_REGISTRATION_TIMEOUT_MS = 90000;

export async function getDealerProfile(): Promise<DealerProfile> {
  const { data } = await api.get<DealerProfile>('/dealer/profile');
  return data;
}

export async function fetchDealerOnboarding(): Promise<DealerOnboardingSnapshot> {
  const response = await api.get<{ success: boolean; Response: DealerOnboardingSnapshot }>(
    '/dealer/me/onboarding',
  );
  if (response.data?.success && response.data.Response) {
    return response.data.Response;
  }
  return {
    hasRegistration: false,
    status: null,
    registrationId: null,
    businessName: null,
    businessType: null,
    submittedAt: null,
  };
}

export async function getDealers(query?: IGetDealersRequest): Promise<IDealersResponse> {
  const response = await api.get<IDealersResponse>('/dealers', { params: query || {} });
  return response.data;
}

export async function getDealerById(dealerId: string): Promise<IDealerByIdResponse> {
  const response = await api.get<IDealerByIdResponse>(`/dealers/${dealerId}`);
  return response.data;
}

export interface IGetDealerProductsRequest {
  page?: number;
  limit?: number;
  category?: string;
  vehicleType?: string;
  status?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getDealerProducts(
  query?: IGetDealerProductsRequest,
): Promise<IProductsResponse> {
  const response = await api.get<IProductsResponse>('/dealer/products', { params: query || {} });
  return response.data;
}

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

export async function getDealerInventoryVehicles(
  query?: IGetDealerVehiclesRequest,
): Promise<IVehiclesResponse> {
  const response = await api.get<IVehiclesResponse>('/dealer/vehicles', { params: query || {} });
  return response.data;
}

export interface IGetDealerServicesRequest {
  page?: number;
  limit?: number;
  category?: string;
  homeService?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getDealerServices(
  query?: IGetDealerServicesRequest,
): Promise<IServicesResponse> {
  const response = await api.get<IServicesResponse>('/dealer/services', { params: query || {} });
  return response.data;
}

export async function getBusinessRegistrationByUserId(
  userId: string,
): Promise<IBusinessRegistration | null> {
  try {
    const response = await api.get<IBusinessRegistrationResponse>(
      `/dealer/business-registration/user/${userId}`,
    );
    const data = response.data as any;
    if (data) {
      if (data.Response) {
        return data.Response;
      }
      if (data.data) {
        return data.data;
      }
      if (data.success === false) {
        return null;
      }
      return data;
    }
    return null;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 403) return null;
    throw error;
  }
}

export async function createBusinessRegistrationApi(
  payload: Record<string, unknown>,
): Promise<IBusinessRegistration> {
  const response = await api.post<IBusinessRegistrationResponse>(
    '/dealer/business-registration',
    payload,
    { timeout: BUSINESS_REGISTRATION_TIMEOUT_MS },
  );
  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error('Failed to create business registration');
}

export interface ICreateDealerProductRequest {
  name: string;
  brand: string;
  price: number;
  stock: number;
  images: string[];
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  description?: string;
  specifications?: Record<string, unknown>;
  returnPolicy?: string;
  tags?: string[];
  originalPrice?: number;
  discountPercentage?: number;
  isSparePart?: boolean;
  deliveryTimeMinutes?: number;
  batteryTypeId?: string;
  voltageV?: number;
  vehicleBrandId?: string;
  vehicleModelId?: string;
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
  specifications?: Record<string, unknown>;
  returnPolicy?: string;
  tags?: string[];
  status?: string;
  originalPrice?: number;
  discountPercentage?: number;
  isSparePart?: boolean;
  deliveryTimeMinutes?: number;
  batteryTypeId?: string | null;
  voltageV?: number | null;
  vehicleBrandId?: string | null;
  vehicleModelId?: string | null;
}

export async function createDealerProduct(data: ICreateDealerProductRequest): Promise<IProduct> {
  const response = await api.post<{ success: boolean; Response: IProduct }>(
    '/dealer/products',
    data,
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  throw new Error('Failed to create product');
}

export async function updateDealerProduct(
  productId: string,
  data: IUpdateDealerProductRequest,
): Promise<IProduct> {
  const response = await api.put<{ success: boolean; Response: IProduct }>(
    `/dealer/products/${productId}`,
    data,
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  throw new Error('Failed to update product');
}

export async function deleteDealerProduct(productId: string): Promise<void> {
  await api.delete(`/dealer/products/${productId}`);
}

export async function updateDealerProductStatus(
  productId: string,
  status: string,
): Promise<IProduct> {
  const response = await api.patch<{ success: boolean; Response: IProduct }>(
    `/dealer/products/${productId}/status`,
    { status },
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  throw new Error('Failed to update product status');
}

export interface ICreateDealerVehicleRequest {
  vehicleType: 'Car' | 'Bike';
  brand?: string;
  vehicleModel?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
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
  allowTestDrive?: boolean;
}

export interface IUpdateDealerVehicleRequest {
  vehicleType?: 'Car' | 'Bike';
  brand?: string;
  vehicleModel?: string;
  vehicleBrandId?: string | null;
  vehicleModelId?: string | null;
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
  allowTestDrive?: boolean;
}

export async function createDealerVehicle(
  data: ICreateDealerVehicleRequest,
): Promise<IDealerVehicle> {
  const response = await api.post<{ success: boolean; Response: IDealerVehicle }>(
    '/dealer/vehicles',
    data,
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  throw new Error('Failed to create vehicle');
}

export async function updateDealerVehicle(
  vehicleId: string,
  data: IUpdateDealerVehicleRequest,
): Promise<IDealerVehicle> {
  const response = await api.put<{ success: boolean; Response: IDealerVehicle }>(
    `/dealer/vehicles/${vehicleId}`,
    data,
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  throw new Error('Failed to update vehicle');
}

export async function deleteDealerVehicle(vehicleId: string): Promise<void> {
  await api.delete(`/dealer/vehicles/${vehicleId}`);
}

export interface ICreateDealerServiceRequest {
  name: string;
  price: number;
  durationMinutes: number;
  homeService: boolean;
  description?: string;
  category?: string;
  location?: { latitude: number; longitude: number; address?: string };
  images?: string[];
  isActive?: boolean;
  serviceType?: IService['serviceType'];
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
  slotDurationMinutes?: number;
  slotBookingEnabled?: boolean;
}

export interface IUpdateDealerServiceRequest {
  name?: string;
  price?: number;
  durationMinutes?: number;
  homeService?: boolean;
  description?: string;
  category?: string;
  location?: { latitude: number; longitude: number; address?: string };
  images?: string[];
  isActive?: boolean;
  serviceType?: IService['serviceType'];
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleBrandId?: string | null;
  vehicleModelId?: string | null;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
  slotDurationMinutes?: number;
  slotBookingEnabled?: boolean;
}

export async function createDealerService(data: ICreateDealerServiceRequest): Promise<IService> {
  const response = await api.post<{ success: boolean; Response: IService }>(
    '/dealer/services',
    data,
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  throw new Error('Failed to create service');
}

export async function updateDealerService(
  serviceId: string,
  data: IUpdateDealerServiceRequest,
): Promise<IService> {
  const response = await api.put<{ success: boolean; Response: IService }>(
    `/dealer/services/${serviceId}`,
    data,
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  throw new Error('Failed to update service');
}

export async function deleteDealerService(serviceId: string): Promise<void> {
  await api.delete(`/dealer/services/${serviceId}`);
}

export async function getDealerOrderById(orderId: string): Promise<IOrderData | null> {
  const response = await api.get<{ success: boolean; Response: IOrderData }>(
    `/dealer/orders/${orderId}`,
  );
  if (response.data.success && response.data.Response) return response.data.Response;
  return null;
}
