import { appAxios } from './apiInterceptors';
import {
  ICreateServiceBookingRequest,
  IGetServiceBookingsRequest,
  IServiceBookingResponse,
  IServiceBookingsListResponse,
  ServiceBookingStatus,
} from '../types/service/IServiceBooking';

export type { IServiceBooking, ServiceBookingStatus } from '../types/service/IServiceBooking';

export const createServiceBooking = async (
  data: ICreateServiceBookingRequest,
): Promise<IServiceBookingResponse> => {
  const response = await appAxios.post<IServiceBookingResponse>('/user/service-bookings', data);
  return response.data;
};

export const getUserServiceBookings = async (
  query?: IGetServiceBookingsRequest,
): Promise<IServiceBookingsListResponse> => {
  const response = await appAxios.get<IServiceBookingsListResponse>('/user/service-bookings', {
    params: query || {},
  });
  return response.data;
};

export const getUserServiceBookingById = async (
  bookingId: string,
): Promise<IServiceBookingResponse> => {
  const response = await appAxios.get<IServiceBookingResponse>(
    `/user/service-bookings/${bookingId}`,
  );
  return response.data;
};

export const cancelUserServiceBooking = async (
  bookingId: string,
): Promise<IServiceBookingResponse> => {
  const response = await appAxios.patch<IServiceBookingResponse>(
    `/user/service-bookings/${bookingId}/cancel`,
  );
  return response.data;
};

// Dealer Service Booking APIs
export interface IGetDealerServiceBookingsRequest {
  status?: ServiceBookingStatus;
  date?: string;
  page?: number;
  limit?: number;
}

export const getDealerServiceBookings = async (
  query?: IGetDealerServiceBookingsRequest,
): Promise<IServiceBookingsListResponse['Response']> => {
  const response = await appAxios.get<IServiceBookingsListResponse>('/dealer/service-bookings', {
    params: query || {},
  });
  return response.data.Response;
};

export interface IUpdateServiceBookingStatusRequest {
  status: ServiceBookingStatus;
  dealerNotes?: string;
  assignedMechanic?: string;
  priority?: 'high' | 'medium' | 'low';
  rejectionReason?: string;
}

export const updateServiceBookingStatus = async (
  bookingId: string,
  data: IUpdateServiceBookingStatusRequest,
): Promise<IServiceBookingResponse> => {
  const response = await appAxios.patch<IServiceBookingResponse>(
    `/dealer/service-bookings/${bookingId}/status`,
    data,
  );
  return response.data;
};
