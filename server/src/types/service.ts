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
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
  slotDurationMinutes?: number;
  slotBookingEnabled?: boolean;
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
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
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
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
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
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
  slotDurationMinutes?: number;
  slotBookingEnabled?: boolean;
}

export interface IUpdateServiceImagesRequest {
  images: string[];
}

