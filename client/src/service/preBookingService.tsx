import { appAxios } from './apiInterceptors';
import {
  IPreBookingResponse,
  IPreBookingsListResponse,
  ICreatePreBookingRequest,
  IGetPreBookingsRequest,
  IUpdatePreBookingStatusRequest,
} from '../types/preBooking/IPreBooking';

/**
 * Create a pre-booking request
 */
export const createPreBooking = async (
  data: ICreatePreBookingRequest,
): Promise<IPreBookingResponse> => {
  try {
    const response = await appAxios.post<IPreBookingResponse>('/user/pre-bookings', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's pre-bookings
 */
export const getUserPreBookings = async (
  query?: IGetPreBookingsRequest,
): Promise<IPreBookingsListResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IPreBookingsListResponse>('/user/pre-bookings', {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get pre-booking by ID
 */
export const getUserPreBookingById = async (
  preBookingId: string,
): Promise<IPreBookingResponse> => {
  try {
    const response = await appAxios.get<IPreBookingResponse>(`/user/pre-bookings/${preBookingId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel pre-booking
 */
export const cancelUserPreBooking = async (
  preBookingId: string,
): Promise<IPreBookingResponse> => {
  try {
    const response = await appAxios.patch<IPreBookingResponse>(
      `/user/pre-bookings/${preBookingId}/cancel`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get dealer's pre-bookings
 */
export const getDealerPreBookings = async (
  query?: IGetPreBookingsRequest,
): Promise<IPreBookingsListResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IPreBookingsListResponse>('/dealer/pre-bookings', {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get dealer pre-booking by ID
 */
export const getDealerPreBookingById = async (
  preBookingId: string,
): Promise<IPreBookingResponse> => {
  try {
    const response = await appAxios.get<IPreBookingResponse>(`/dealer/pre-bookings/${preBookingId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update pre-booking status (dealer)
 */
export const updatePreBookingStatus = async (
  preBookingId: string,
  data: IUpdatePreBookingStatusRequest,
): Promise<IPreBookingResponse> => {
  try {
    const response = await appAxios.patch<IPreBookingResponse>(
      `/dealer/pre-bookings/${preBookingId}/status`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};



