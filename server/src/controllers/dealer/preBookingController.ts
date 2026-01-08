import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler } from '../../utils/errorHandler';
import {
  getDealerPreBookings,
  getDealerPreBookingById,
  updatePreBookingStatus,
} from '../../services/dealer/preBookingService';
import {
  IGetPreBookingsRequest,
  IUpdatePreBookingStatusRequest,
} from '../../types/preBooking/IPreBooking';

/**
 * Get dealer's pre-bookings
 */
export const getDealerPreBookingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    if (!dealerId) {
      return next(new Error('Dealer ID not found'));
    }

    const query: IGetPreBookingsRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as any,
      vehicleId: req.query.vehicleId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await getDealerPreBookings(dealerId, query);

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
export const getDealerPreBookingByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    if (!dealerId) {
      return next(new Error('Dealer ID not found'));
    }

    const { id } = req.params;
    const preBooking = await getDealerPreBookingById(dealerId, id);

    res.status(200).json({
      success: true,
      Response: preBooking,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Update pre-booking status
 */
export const updatePreBookingStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    if (!dealerId) {
      return next(new Error('Dealer ID not found'));
    }

    const { id } = req.params;
    const data: IUpdatePreBookingStatusRequest = req.body;
    const preBooking = await updatePreBookingStatus(dealerId, id, data);

    res.status(200).json({
      success: true,
      Response: preBooking,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

