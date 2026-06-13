import { appAxios } from './apiInterceptors';
import {
  ICreateServiceBookingRequest,
  IGetServiceBookingsRequest,
  IServiceBookingResponse,
  IServiceBookingsListResponse,
} from '../types/service/IServiceBooking';

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
