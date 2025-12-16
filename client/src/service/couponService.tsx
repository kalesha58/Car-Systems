import {appAxios} from './apiInterceptors';
import {ICoupon} from '@types/coupon/ICoupon';

export interface ICouponResponse {
  success: boolean;
  data: ICoupon[];
}

/**
 * Get all active coupons
 */
export const getAllCoupons = async (): Promise<ICouponResponse> => {
  try {
    const response = await appAxios.get<ICouponResponse>('/user/coupons');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get applicable coupons for a cart total
 */
export const getApplicableCoupons = async (
  totalAmount: number,
): Promise<ICouponResponse> => {
  try {
    const response = await appAxios.get<ICouponResponse>(
      `/user/cart/applicable-coupons?totalAmount=${totalAmount}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

