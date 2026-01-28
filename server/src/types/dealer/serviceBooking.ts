import { ServiceBookingStatus } from '../../models/ServiceBooking';

export interface IServiceBooking {
  id: string;
  userId: string;
  dealerId: string;
  serviceId: string;
  vehicleId?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  bookingDate: string;
  bookingTime?: string;
  serviceRequest: string;
  status: ServiceBookingStatus;
  assignedMechanic?: string;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  dealerNotes?: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerPhone?: string;
  serviceName?: string;
  vehicleName?: string;
}

export interface IGetDealerServiceBookingsRequest {
  status?: ServiceBookingStatus;
  limit?: number;
  page?: number;
  date?: string; // For filtering by date
}

export interface IUpdateServiceBookingStatusRequest {
  status: ServiceBookingStatus;
  dealerNotes?: string;
  assignedMechanic?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface IDealerServiceBookingsResponse {
  bookings: IServiceBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
