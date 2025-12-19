import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { getDealerInfo, verifyDealerForChat } from '../../services/user/dealerService';

/**
 * Get dealer info by dealerId
 * GET /api/user/dealer/:dealerId/info
 */
export const getDealerInfoController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = req.params.dealerId;

    if (!dealerId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Dealer ID is required',
        },
      });
      return;
    }

    const dealerInfo = await getDealerInfo(dealerId);

    res.status(200).json({
      success: true,
      Response: dealerInfo,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Verify dealer for chat (checks if dealer is approved)
 * GET /api/user/dealer/:dealerId/verify
 */
export const verifyDealerForChatController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = req.params.dealerId;

    if (!dealerId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Dealer ID is required',
        },
      });
      return;
    }

    const dealerInfo = await verifyDealerForChat(dealerId);

    res.status(200).json({
      success: true,
      Response: dealerInfo,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
