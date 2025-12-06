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
  };
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
}

export interface IServicesResponse {
  success: boolean;
  Response: {
    services: IService[];
    pagination: IPaginationResponse;
  };
}

