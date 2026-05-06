/**
 * Service Category Service
 * Fetches the service category configuration from the API
 */

import apiClient from './apiClient';

export type ServiceTypeValue =
  | 'car_automobile'
  | 'bike_automobile'
  | 'car_wash'
  | 'tire_service'
  | 'car_detailing'
  | 'battery_service'
  | 'general';

export type ServicePackageValue = 'premium' | 'basic';
export type DeliveryModeValue = 'home' | 'store' | 'dealer_center';

export interface IServiceSubCategory {
  id: string;
  label: string;
}

export interface IServiceSection {
  id: string;
  label: string;
  serviceType: ServiceTypeValue;
  vehicleType?: 'Car' | 'Bike' | 'Both';
  hasDeliveryModes: boolean;
  deliveryModes?: Array<{ value: DeliveryModeValue; label: string }>;
  hasPackages: boolean;
  packages?: Array<{ value: ServicePackageValue; label: string }>;
  subcategories: IServiceSubCategory[];
}

export interface IServiceCategoriesResponse {
  sections: IServiceSection[];
  sparePartsBrands: { Car: string[]; Bike: string[] };
}

export const getServiceCategories = async (): Promise<IServiceCategoriesResponse> => {
  const response = await apiClient.get<{ success: boolean; Response: IServiceCategoriesResponse }>(
    '/api/service-categories',
  );
  return response.data.Response;
};

// ─── Admin Service CRUD ────────────────────────────────────────────────────

export interface IAdminService {
  id: string;
  dealerId: string;
  name: string;
  price: number;
  durationMinutes: number;
  homeService: boolean;
  description?: string;
  category?: string;
  images?: string[];
  isActive?: boolean;
  serviceType?: ServiceTypeValue;
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceSubCategory?: string;
  servicePackage?: ServicePackageValue;
  dealer?: { businessName: string; type: string; phone: string; address: string };
  createdAt: string;
  updatedAt: string;
}

export interface IAdminServiceListResponse {
  services: IAdminService[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface IAdminServiceQueryParams {
  page?: number;
  limit?: number;
  dealerId?: string;
  serviceType?: string;
  serviceSubCategory?: string;
  servicePackage?: string;
  vehicleType?: string;
  homeService?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateAdminServicePayload {
  dealerId: string;
  name: string;
  price: number;
  durationMinutes: number;
  homeService: boolean;
  description?: string;
  category?: string;
  images?: string[];
  serviceType?: ServiceTypeValue;
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceSubCategory?: string;
  servicePackage?: ServicePackageValue;
}

export const getAdminServices = async (
  params?: IAdminServiceQueryParams,
): Promise<IAdminServiceListResponse> => {
  const response = await apiClient.get<{ success: boolean; Response: IAdminServiceListResponse }>(
    '/api/services',
    { params },
  );
  return response.data.Response;
};

export const getAdminServiceById = async (id: string): Promise<IAdminService> => {
  const response = await apiClient.get<{ success: boolean; Response: IAdminService }>(
    `/api/services/${id}`,
  );
  return response.data.Response;
};

export const createAdminService = async (
  payload: ICreateAdminServicePayload,
): Promise<IAdminService> => {
  const response = await apiClient.post<{ success: boolean; Response: IAdminService }>(
    '/api/services',
    payload,
  );
  return response.data.Response;
};

export const updateAdminService = async (
  id: string,
  payload: Partial<ICreateAdminServicePayload>,
): Promise<IAdminService> => {
  const response = await apiClient.put<{ success: boolean; Response: IAdminService }>(
    `/api/services/${id}`,
    payload,
  );
  return response.data.Response;
};

export const deleteAdminService = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/services/${id}`);
};
