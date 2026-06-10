/**
 * Coupon Service
 * API calls for coupon management
 */

import apiClient from './apiClient';

export interface ICoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICouponListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ICouponListResponse {
  bookings?: ICoupon[];
  coupons?: ICoupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ICreateCouponPayload {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
  usageLimit?: number;
}

export interface IUpdateCouponPayload extends Partial<ICreateCouponPayload> {}

/**
 * Get all coupons with pagination and filters
 */
export const getCoupons = async (params?: ICouponListQueryParams): Promise<ICouponListResponse> => {
  const response = await apiClient.get<{ success: boolean; Response: ICouponListResponse }>(
    '/admin/coupons',
    { params },
  );
  return response.data.Response;
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (id: string): Promise<ICoupon> => {
  const response = await apiClient.get<{ success: boolean; Response: ICoupon }>(
    `/admin/coupons/${id}`,
  );
  return response.data.Response;
};

/**
 * Create a new coupon
 */
export const createCoupon = async (payload: ICreateCouponPayload): Promise<ICoupon> => {
  const response = await apiClient.post<{ success: boolean; Response: ICoupon }>(
    '/admin/coupons',
    payload,
  );
  return response.data.Response;
};

/**
 * Update coupon
 */
export const updateCoupon = async (id: string, payload: IUpdateCouponPayload): Promise<ICoupon> => {
  const response = await apiClient.put<{ success: boolean; Response: ICoupon }>(
    `/admin/coupons/${id}`,
    payload,
  );
  return response.data.Response;
};

/**
 * Delete coupon
 */
export const deleteCoupon = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/coupons/${id}`);
};

/**
 * Get all admin service bookings with pagination and filters
 */
export interface IAdminServiceBooking {
  id: string;
  userId: string;
  dealerId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime?: string;
  serviceRequest: string;
  status: string;
  priority: string;
  notes?: string;
  dealerNotes?: string;
  rejectionReason?: string;
  assignedMechanic?: string;
  customerName?: string;
  customerPhone?: string;
  dealerName?: string;
  serviceName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminServiceBookingListResponse {
  bookings: IAdminServiceBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IAdminServiceBookingQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  dealerId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export const getAdminServiceBookings = async (
  params?: IAdminServiceBookingQueryParams,
): Promise<IAdminServiceBookingListResponse> => {
  const response = await apiClient.get<{
    success: boolean;
    Response: IAdminServiceBookingListResponse;
  }>('/admin/service-bookings', { params });
  return response.data.Response;
};
