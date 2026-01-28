import { appAxios } from './apiInterceptors';

export type ServiceBookingStatus = 'new' | 'scheduled' | 'in_progress' | 'awaiting' | 'completed' | 'cancelled';

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
  date?: string;
}

export interface IDealerServiceBookingsResponse {
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

export const getDealerServiceBookings = async (
  query?: IGetDealerServiceBookingsRequest,
): Promise<{ bookings: IServiceBooking[]; pagination: any }> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IDealerServiceBookingsResponse>('/dealer/service-bookings', { params });
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    return { bookings: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  } catch (error) {
    throw error;
  }
};

export interface IUpdateServiceBookingStatusRequest {
  status?: ServiceBookingStatus;
  dealerNotes?: string;
  assignedMechanic?: string;
  priority?: 'high' | 'medium' | 'low';
}

export const updateServiceBookingStatus = async (
  bookingId: string,
  data: IUpdateServiceBookingStatusRequest,
): Promise<IServiceBooking> => {
  try {
    const response = await appAxios.patch<{ success: boolean; Response: IServiceBooking }>(
      `/dealer/service-bookings/${bookingId}/status`,
      data,
    );
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to update service booking status');
  } catch (error) {
    throw error;
  }
};
