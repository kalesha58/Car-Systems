/**
 * Vehicle Service
 * API calls for vehicle management
 */

import type { IVehicle } from '../types/vehicle';
import apiClient from './apiClient';

export interface IVehicleListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vehicleType?: string;
  brand?: string;
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  dealerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IVehicleListResponse {
  vehicles: IVehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ICreateVehiclePayload {
  vehicleType: string;
  brand: string;
  vehicleModel: string;
  year: number;
  price: number;
  availability: 'available' | 'sold' | 'reserved';
  images?: string[];
  numberPlate: string;
  mileage: number;
  color: string;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission: 'Manual' | 'Automatic';
  description: string;
  features?: string[];
  condition: 'New' | 'Used' | 'Refurbished';
}

export interface IUpdateVehiclePayload {
  vehicleType?: string;
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
  condition?: 'New' | 'Used' | 'Refurbished';
}

/**
 * Get all vehicles with pagination and filters
 * @param params - Query parameters for filtering and pagination
 * @returns Promise with vehicles list and pagination info
 */
export const getVehicles = async (params?: IVehicleListQueryParams): Promise<IVehicleListResponse> => {
  const response = await apiClient.get<{ success: boolean; Response?: IVehicleListResponse } | IVehicleListResponse>('/admin/dealers/vehicles', { params });
  
  // Handle nested Response structure
  if ('Response' in response.data && response.data.Response) {
    return response.data.Response;
  }
  
  // Fallback to direct structure if Response is not present
  if ('vehicles' in response.data && 'pagination' in response.data) {
    return response.data as IVehicleListResponse;
  }
  
  throw new Error('Invalid response structure from getVehicles API');
};

/**
 * Get vehicle details by vehicle ID
 * @param vehicleId - The vehicle ID (path parameter)
 */
export const getVehicleById = async (vehicleId: string): Promise<IVehicle> => {
  const response = await apiClient.get<{ success: boolean; Response?: IVehicle & { dealerId?: string } } | IVehicle>(`/admin/dealers/vehicles/${vehicleId}`);
  
  // Handle nested Response structure
  let vehicleData: IVehicle & { dealerId?: string };
  if ('Response' in response.data && response.data.Response) {
    vehicleData = response.data.Response;
  } else if ('id' in response.data || 'vehicleType' in response.data) {
    // Fallback to direct structure if Response is not present
    vehicleData = response.data as IVehicle & { dealerId?: string };
  } else {
    throw new Error('Invalid response structure from getVehicleById API');
  }
  
  // Map dealerId to dealerID for consistency
  const vehicle: IVehicle = {
    ...vehicleData,
    dealerID: vehicleData.dealerId || vehicleData.dealerID,
  };
  
  return vehicle;
};

/**
 * Create a new vehicle for a dealer
 * @param dealerId - The dealer ID (path parameter)
 * @param payload - Vehicle data
 */
export const createVehicle = async (dealerId: string, payload: ICreateVehiclePayload): Promise<IVehicle> => {
  const response = await apiClient.post<IVehicle>(`/admin/dealers/${dealerId}/vehicles`, payload);
  return response.data;
};

/**
 * Update vehicle information for a dealer
 * @param userId - The user ID (must have dealer role) (path parameter)
 * @param vehicleId - The vehicle ID (path parameter)
 * @param payload - Vehicle data
 */
export const updateVehicle = async (userId: string, vehicleId: string, payload: IUpdateVehiclePayload): Promise<IVehicle> => {
  const response = await apiClient.put<{ success: boolean; Response?: IVehicle } | IVehicle>(`/admin/dealers/${userId}/vehicles/${vehicleId}`, payload);
  
  // Handle nested Response structure
  if ('Response' in response.data && response.data.Response) {
    return response.data.Response;
  }
  
  // Fallback to direct structure if Response is not present
  if ('id' in response.data || 'vehicleType' in response.data) {
    return response.data as IVehicle;
  }
  
  throw new Error('Invalid response structure from updateVehicle API');
};

/**
 * Delete a vehicle
 * @param vehicleId - The vehicle ID (path parameter)
 */
export const deleteVehicle = async (vehicleId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/dealer/vehicles/${vehicleId}`);
  return response.data;
};

