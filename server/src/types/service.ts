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

export interface ICreateServiceRequest {
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
}

export interface IUpdateServiceRequest {
  name?: string;
  price?: number;
  durationMinutes?: number;
  homeService?: boolean;
  description?: string;
  category?: string;
  images?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface IUpdateServiceImagesRequest {
  images: string[];
}

