import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getAdminServiceBookings } from '../../services/admin/serviceBookingService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getAdminServiceBookingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getAdminServiceBookings(req.query as any);
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
