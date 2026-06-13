import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  createUserServiceBooking,
  getUserServiceBookings,
  getUserServiceBookingById,
  cancelUserServiceBooking,
} from '../../services/user/serviceBookingService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const createUserServiceBookingController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const booking = await createUserServiceBooking(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      Response: booking,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getUserServiceBookingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getUserServiceBookings(req.user!.userId, req.query as any);
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getUserServiceBookingByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const booking = await getUserServiceBookingById(req.user!.userId, req.params.id);
    res.status(200).json({
      success: true,
      Response: booking,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const cancelUserServiceBookingController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const booking = await cancelUserServiceBooking(req.user!.userId, req.params.id);
    res.status(200).json({
      success: true,
      Response: booking,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
