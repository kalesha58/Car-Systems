import type { IDealerInfo, IPaginationResponse } from './dealer';

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
  serviceType?:
    | 'car_wash'
    | 'car_detailing'
    | 'car_automobile'
    | 'bike_automobile'
    | 'tire_service'
    | 'battery_service'
    | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  serviceSubCategory?: string;
  servicePackage?: 'premium' | 'basic';
  slotDurationMinutes?: number;
  dealer?: IDealerInfo;
  slotBookingEnabled?: boolean;
  serviceCoverageAreas?: string;
  travelFeeEnabled?: boolean;
  travelFeeFreeKm?: number;
  travelFeePerKm?: number;
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
  serviceType?: IService['serviceType'];
  serviceSubCategory?: string;
}

export interface IServicesResponse {
  success: boolean;
  Response: {
    services: IService[];
    pagination: IPaginationResponse;
  };
}

export interface IServiceSlot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: 'center' | 'home';
  maxBookings: number;
  currentBookings: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGetServiceSlotsResult {
  slots: IServiceSlot[];
  dailyCapReached?: boolean;
  dailyBookingsCount?: number;
  maxDailyBookings?: number;
}
