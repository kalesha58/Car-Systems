import { ServiceBookingStatus } from '../../models/ServiceBooking';

export interface ICreateUserServiceBookingRequest {
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

export interface IUserServiceBooking {
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

export interface IGetUserServiceBookingsRequest {
  page?: number;
  limit?: number;
  status?: ServiceBookingStatus;
  serviceType?: string;
}
