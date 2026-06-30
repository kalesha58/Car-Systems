import type {
  ICreateServiceBookingRequest,
  IGetServiceBookingsRequest,
  IServiceBookingResponse,
  IServiceBookingsListResponse,
  ServiceBookingStatus,
} from '../types/serviceBooking';
import { api } from './api';

export type { IServiceBooking, ServiceBookingStatus } from '../types/serviceBooking';

export async function createServiceBooking(
  data: ICreateServiceBookingRequest,
): Promise<IServiceBookingResponse> {
  const response = await api.post<IServiceBookingResponse>('/user/service-bookings', data);
  return response.data;
}

export async function getUserServiceBookings(
  query?: IGetServiceBookingsRequest,
): Promise<IServiceBookingsListResponse> {
  const response = await api.get<IServiceBookingsListResponse>('/user/service-bookings', {
    params: query || {},
  });
  return response.data;
}

export async function getUserServiceBookingById(
  bookingId: string,
): Promise<IServiceBookingResponse> {
  const response = await api.get<IServiceBookingResponse>(
    `/user/service-bookings/${bookingId}`,
  );
  return response.data;
}

export async function cancelUserServiceBooking(
  bookingId: string,
): Promise<IServiceBookingResponse> {
  const response = await api.patch<IServiceBookingResponse>(
    `/user/service-bookings/${bookingId}/cancel`,
  );
  return response.data;
}

export interface IGetDealerServiceBookingsRequest {
  status?: ServiceBookingStatus;
  date?: string;
  page?: number;
  limit?: number;
}

export async function getDealerServiceBookings(
  query?: IGetDealerServiceBookingsRequest,
): Promise<IServiceBookingsListResponse['Response']> {
  const response = await api.get<IServiceBookingsListResponse>('/dealer/service-bookings', {
    params: query || {},
  });
  return response.data.Response;
}

export interface IUpdateServiceBookingStatusRequest {
  status: ServiceBookingStatus;
  dealerNotes?: string;
  assignedMechanic?: string;
  priority?: 'high' | 'medium' | 'low';
  rejectionReason?: string;
}

export async function updateServiceBookingStatus(
  bookingId: string,
  data: IUpdateServiceBookingStatusRequest,
): Promise<IServiceBookingResponse> {
  const response = await api.patch<IServiceBookingResponse>(
    `/dealer/service-bookings/${bookingId}/status`,
    data,
  );
  return response.data;
}
