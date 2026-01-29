import {IPaginationResponse} from '../dealer/IDealer';
import {IDealerInfo} from '../dealer/IDealer';

export interface IService {
  id: string;
  dealerId: string;
  name: string;
  price: number;
  durationMinutes: number;
  homeService: boolean;
  description?: string;
  category?: string;
  images?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isActive?: boolean;
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceSubCategory?: string;
  dealer?: IDealerInfo;
  createdAt: string;
  updatedAt: string;
}

export interface IGetServicesRequest {
  page?: number;
  limit?: number;
  dealerId?: string;
  category?: string;
  homeService?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'general';
  serviceSubCategory?: string;
}

export interface IServicesResponse {
  success: boolean;
  Response: {
    services: IService[];
    pagination: IPaginationResponse;
  };
}

