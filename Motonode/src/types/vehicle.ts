import type { IDealerInfo, IPaginationResponse } from './dealer';

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
  vehicleBrandId?: string;
  vehicleModelId?: string;
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
  dealerId?: string;
  allowTestDrive?: boolean;
}

export interface IVehiclesResponse {
  success: boolean;
  Response: {
    vehicles: IDealerVehicle[];
    pagination: IPaginationResponse;
  };
}

export interface IVehicleDocuments {
  rc?: string;
  insurance?: string;
  pollution?: string;
  dl?: string;
}

export interface IUserVehicle {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  numberPlate: string;
  documents?: IVehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images: string[];
  isOwnVehicle?: boolean;
  relation?: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateVehicleRequest {
  brand: string;
  model: string;
  numberPlate: string;
  documents?: IVehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images: string[];
  isOwnVehicle?: boolean;
  relation?: string;
  ownerName?: string;
}

export interface IUpdateVehicleRequest {
  brand?: string;
  model?: string;
  numberPlate?: string;
  documents?: IVehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images?: string[];
  isOwnVehicle?: boolean;
  relation?: string;
  ownerName?: string;
}

export interface IUserVehicleResponse {
  success: boolean;
  Response: IUserVehicle;
}

export interface IUserVehiclesResponse {
  success: boolean;
  Response: IUserVehicle[];
}
