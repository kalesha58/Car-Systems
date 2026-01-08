import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler } from '../../utils/errorHandler';
import {
  createPreBooking,
  getUserPreBookings,
  getUserPreBookingById,
  cancelUserPreBooking,
} from '../../services/user/preBookingService';
import {
  ICreatePreBookingRequest,
  IGetPreBookingsRequest,
} from '../../types/preBooking/IPreBooking';

/**
 * Create pre-booking request
 */
export const createPreBookingController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const data: ICreatePreBookingRequest = req.body;
    const preBooking = await createPreBooking(userId, data);

    res.status(201).json({
      success: true,
      Response: preBooking,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Get user's pre-bookings
 */
export const getUserPreBookingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const query: IGetPreBookingsRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as any,
      vehicleId: req.query.vehicleId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await getUserPreBookings(userId, query);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Get pre-booking by ID
 */
export const getUserPreBookingByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const { id } = req.params;
    const preBooking = await getUserPreBookingById(userId, id);

    res.status(200).json({
      success: true,
      Response: preBooking,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Cancel pre-booking
 */
export const cancelUserPreBookingController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const { id } = req.params;
    const preBooking = await cancelUserPreBooking(userId, id);

    res.status(200).json({
      success: true,
      Response: preBooking,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

