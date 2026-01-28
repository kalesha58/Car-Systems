import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getDealerServiceBookings, updateServiceBookingStatus } from '../../services/dealer/serviceBookingService';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export const getDealerServiceBookingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const query = req.query as any;

    const result = await getDealerServiceBookings(dealerId, query);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateServiceBookingStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const bookingId = req.params.id;

    const booking = await updateServiceBookingStatus(bookingId, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: booking,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
