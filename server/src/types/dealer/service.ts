import { IService } from '../../types/service';

export interface IDealerService extends IService {
  isActive?: boolean;
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
}

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
  isActive?: boolean;
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
  slotBookingEnabled?: boolean;
  slotDurationMinutes?: number;
  serviceCoverageAreas?: string;
  travelFeeEnabled?: boolean;
  travelFeeFreeKm?: number;
  travelFeePerKm?: number;
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
  isActive?: boolean;
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleBrandId?: string | null;
  vehicleModelId?: string | null;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
  slotBookingEnabled?: boolean;
  slotDurationMinutes?: number;
  serviceCoverageAreas?: string;
  travelFeeEnabled?: boolean;
  travelFeeFreeKm?: number;
  travelFeePerKm?: number;
}

export interface IUpdateServiceStatusRequest {
  isActive: boolean;
}

export interface IUpdateServiceImagesRequest {
  images: string[];
}

export interface IGetDealerServicesRequest {
  page?: number;
  limit?: number;
  category?: string;
  homeService?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
  serviceSubCategory?: string;
}



