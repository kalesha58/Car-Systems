import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { updateDealerPayout, getDealerPayout } from '../../services/dealer/payoutService';

/**
 * Update dealer payout credentials controller
 */
export const updatePayoutController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const payout = await updateDealerPayout(userId, req.body);

    res.status(200).json({
      success: true,
      data: payout,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get dealer payout credentials controller
 */
export const getPayoutController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const payout = await getDealerPayout(userId);

    res.status(200).json({
      success: true,
      data: payout,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

