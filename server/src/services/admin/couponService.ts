import { Coupon, ICouponDocument } from '../../models/Coupon';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IGetCouponsRequest {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ICouponResponse {
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

const couponToInterface = (doc: ICouponDocument): ICouponResponse => {
  return {
    id: (doc._id as any).toString(),
    code: doc.code,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    minOrderAmount: doc.minOrderAmount,
    maxDiscountAmount: doc.maxDiscountAmount,
    validFrom: doc.validFrom.toISOString(),
    validUntil: doc.validUntil.toISOString(),
    isActive: doc.isActive,
    usageLimit: doc.usageLimit,
    usedCount: doc.usedCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const getCoupons = async (
  query: IGetCouponsRequest,
): Promise<{ coupons: ICouponResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      filter.code = { $regex: query.search, $options: 'i' };
    }

    if (query.isActive !== undefined) {
      filter.isActive = String(query.isActive) === 'true';
    }

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      coupons: coupons.map(couponToInterface),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting admin coupons:', error);
    throw error;
  }
};

export const getCouponById = async (id: string): Promise<ICouponResponse> => {
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }
    return couponToInterface(coupon);
  } catch (error) {
    logger.error(`Error getting coupon ${id}:`, error);
    throw error;
  }
};

export const createCoupon = async (data: any): Promise<ICouponResponse> => {
  try {
    const code = String(data.code).toUpperCase().trim();
    
    // Check for duplicate code
    const existing = await Coupon.findOne({ code });
    if (existing) {
      throw new AppError('Coupon code already exists', 400);
    }

    const coupon = new Coupon({
      code,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrderAmount: Number(data.minOrderAmount) || 0,
      maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      isActive: data.isActive !== false,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      usedCount: 0,
    });

    await coupon.save();
    logger.info(`Coupon created: ${coupon._id} (code: ${code})`);
    return couponToInterface(coupon);
  } catch (error) {
    logger.error('Error creating coupon:', error);
    throw error;
  }
};

export const updateCoupon = async (id: string, data: any): Promise<ICouponResponse> => {
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    if (data.code) {
      const code = String(data.code).toUpperCase().trim();
      if (code !== coupon.code) {
        const existing = await Coupon.findOne({ code });
        if (existing) {
          throw new AppError('Coupon code already exists', 400);
        }
        coupon.code = code;
      }
    }

    if (data.discountType) coupon.discountType = data.discountType;
    if (data.discountValue !== undefined) coupon.discountValue = Number(data.discountValue);
    if (data.minOrderAmount !== undefined) coupon.minOrderAmount = Number(data.minOrderAmount);
    if (data.maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount = data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined;
    }
    if (data.validFrom) coupon.validFrom = new Date(data.validFrom);
    if (data.validUntil) coupon.validUntil = new Date(data.validUntil);
    if (data.isActive !== undefined) coupon.isActive = data.isActive === true;
    if (data.usageLimit !== undefined) {
      coupon.usageLimit = data.usageLimit ? Number(data.usageLimit) : undefined;
    }

    await coupon.save();
    logger.info(`Coupon updated: ${id}`);
    return couponToInterface(coupon);
  } catch (error) {
    logger.error(`Error updating coupon ${id}:`, error);
    throw error;
  }
};

export const deleteCoupon = async (id: string): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }
    logger.info(`Coupon deleted: ${id}`);
  } catch (error) {
    logger.error(`Error deleting coupon ${id}:`, error);
    throw error;
  }
};
