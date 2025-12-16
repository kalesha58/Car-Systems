import {Request, Response} from 'express';
import {getAllCoupons} from '../../services/user/couponService';
import {logger} from '../../utils/logger';

/**
 * Get all active coupons
 */
export const getAllCouponsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const coupons = await getAllCoupons(userId);

    logger.info(`Getting all coupons, found ${coupons.length} active coupons`);

    // Transform coupons to match frontend format
    const transformedCoupons = coupons.map((coupon: any) => ({
      id: coupon.id,
      code: coupon.code,
      title: `${coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`} - ${coupon.code}`,
      description: coupon.discountType === 'percentage'
        ? `Get ${coupon.discountValue}% discount${coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}`
        : `Get flat ₹${coupon.discountValue} discount`,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      applicableOn: 'all' as const,
    }));

    res.json({
      success: true,
      data: transformedCoupons,
    });
  } catch (error: any) {
    logger.error('Error getting coupons:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get coupons',
    });
  }
};

