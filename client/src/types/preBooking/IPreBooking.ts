export type PreBookingStatus = 'pending' | 'confirmed' | 'cancelled';

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
  bookingDate: string;
  notes?: string;
}

export interface IGetPreBookingsRequest {
  page?: number;
  limit?: number;
  status?: PreBookingStatus;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}

export interface IUpdatePreBookingStatusRequest {
  status: PreBookingStatus;
  dealerNotes?: string;
}

export interface IPreBookingResponse {
  success: boolean;
  Response: IPreBooking;
}

export interface IPreBookingsListResponse {
  success: boolean;
  Response: {
    preBookings: IPreBooking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}



