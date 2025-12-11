import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { getPayouts, getPayoutStats, retryPayout } from '../../services/admin/payoutService';

/**
 * Get payouts controller
 */
export const getPayoutsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
      orderId: req.query.orderId as string,
    };

    const result = await getPayouts(query);

    res.status(200).json({
      success: true,
      data: result.payouts,
      pagination: result.pagination,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get payout statistics controller
 */
export const getPayoutStatsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await getPayoutStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Retry payout controller
 */
export const retryPayoutController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orderId = req.params.orderId;
    const adminId = req.user?.userId || '';

    const result = await retryPayout(orderId, adminId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

