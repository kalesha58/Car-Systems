export type ServiceBookingStatus =
  | 'new'
  | 'scheduled'
  | 'in_progress'
  | 'awaiting'
  | 'completed'
  | 'cancelled';

export interface IServiceBooking {
  id: string;
  userId: string;
  dealerId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime?: string;
  serviceRequest: string;
  status: ServiceBookingStatus;
  notes?: string;
  dealerNotes?: string;
  rejectionReason?: string;
  serviceSubCategory?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  requestLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  serviceName?: string;
  serviceType?: string;
  dealerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateServiceBookingRequest {
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  requestLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export interface IServiceBookingResponse {
  success: boolean;
  Response: IServiceBooking;
}

export interface IServiceBookingsListResponse {
  success: boolean;
  Response: {
    bookings: IServiceBooking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface IGetServiceBookingsRequest {
  page?: number;
  limit?: number;
  status?: ServiceBookingStatus;
  serviceType?: string;
}
