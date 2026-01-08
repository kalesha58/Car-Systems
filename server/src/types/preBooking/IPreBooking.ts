import { PreBookingStatus } from '../../models/PreBooking';

export interface IPreBooking {
  id: string;
  userId: string;
  vehicleId: string;
  dealerId: string;
  bookingDate: string;
  status: PreBookingStatus;
  notes?: string;
  dealerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreatePreBookingRequest {
  vehicleId: string;
  bookingDate: string; // ISO date string
  notes?: string;
}

export interface IUpdatePreBookingStatusRequest {
  status: PreBookingStatus;
  dealerNotes?: string;
}

export interface IGetPreBookingsRequest {
  page?: number;
  limit?: number;
  status?: PreBookingStatus;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}

