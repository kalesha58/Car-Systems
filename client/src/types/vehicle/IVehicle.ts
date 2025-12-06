import {IPaginationResponse} from '../dealer/IDealer';
import {IDealerInfo} from '../dealer/IDealer';

export type VehicleType = 'Car' | 'Bike';
export type VehicleAvailability = 'available' | 'sold' | 'reserved';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type TransmissionType = 'Manual' | 'Automatic';
export type VehicleCondition = 'New' | 'Used' | 'Certified Pre-owned';

export interface IDealerVehicle {
  id: string;
  dealerId: string;
  vehicleType: VehicleType;
  brand: string;
  vehicleModel: string;
  year: number;
  price: number;
  availability: VehicleAvailability;
  images: string[];
  numberPlate?: string;
  mileage?: number;
  color?: string;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  description?: string;
  features?: string[];
  condition?: VehicleCondition;
  allowTestDrive?: boolean;
  createdAt: string;
  updatedAt: string;
  dealer?: IDealerInfo;
}

export interface IGetVehiclesRequest {
  page?: number;
  limit?: number;
  vehicleType?: VehicleType;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IVehiclesResponse {
  success: boolean;
  Response: {
    vehicles: IDealerVehicle[];
    pagination: IPaginationResponse;
  };
}

