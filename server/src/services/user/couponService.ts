import {Coupon} from '../../models/Coupon';
import {logger} from '../../utils/logger';

/**
 * Get all active coupons for a user
 */
export const getAllCoupons = async (userId?: string): Promise<any[]> => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: {$lte: now},
      validUntil: {$gte: now},
    })
      .select('code discountType discountValue minOrderAmount maxDiscountAmount validFrom validUntil isActive')
      .lean();

    return coupons.map((coupon: any) => ({
      id: coupon._id.toString(),
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: coupon.validFrom instanceof Date ? coupon.validFrom.toISOString() : coupon.validFrom,
      validUntil: coupon.validUntil instanceof Date ? coupon.validUntil.toISOString() : coupon.validUntil,
      isActive: coupon.isActive,
    }));
  } catch (error) {
    logger.error('Error getting coupons:', error);
    return [];
  }
};

