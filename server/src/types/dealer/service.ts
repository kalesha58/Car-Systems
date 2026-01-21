import { IService } from '../../types/service';

export interface IDealerService extends IService {
  isActive?: boolean;
  serviceType?: string;
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
  serviceType?: 'car_wash' | 'general';
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
  serviceType?: 'car_wash' | 'general';
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
}



