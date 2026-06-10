import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../../services/admin/couponService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getCouponsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getCoupons(req.query as any);
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getCouponByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const coupon = await getCouponById(req.params.id);
    res.status(200).json({
      success: true,
      Response: coupon,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createCouponController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const coupon = await createCoupon(req.body);
    res.status(201).json({
      success: true,
      Response: coupon,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateCouponController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const coupon = await updateCoupon(req.params.id, req.body);
    res.status(200).json({
      success: true,
      Response: coupon,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteCouponController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteCoupon(req.params.id);
    res.status(200).json({
      success: true,
      Response: { ReturnMessage: 'Coupon deleted successfully' },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
