import {
  VehicleType,
  VehicleAvailability,
  VehicleCondition,
  FuelType,
  TransmissionType,
} from '../../models/DealerVehicle';

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
}

export interface ICreateDealerVehicleRequest {
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
}

export interface IUpdateDealerVehicleRequest {
  vehicleType?: VehicleType;
  brand?: string;
  vehicleModel?: string;
  year?: number;
  price?: number;
  availability?: VehicleAvailability;
  images?: string[];
  numberPlate?: string;
  mileage?: number;
  color?: string;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  description?: string;
  features?: string[];
  condition?: VehicleCondition;
  allowTestDrive?: boolean;
}

export interface IUpdateVehicleAvailabilityRequest {
  availability: VehicleAvailability;
}

export interface IUpdateVehicleImagesRequest {
  images: string[];
}

export interface IGetDealerVehiclesRequest {
  page?: number;
  limit?: number;
  vehicleType?: VehicleType;
  brand?: string;
  availability?: VehicleAvailability;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dealerId?: string;
}


