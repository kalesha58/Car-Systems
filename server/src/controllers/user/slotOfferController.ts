import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  acceptSlotOffer,
  declineSlotOffer,
  getSlotOfferById,
} from '../../services/slotOffer/slotOfferService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getSlotOfferController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }

    const offer = await getSlotOfferById(userId, req.params.id);
    res.status(200).json({ success: true, Response: offer });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const acceptSlotOfferController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }

    const offer = await acceptSlotOffer(userId, req.params.id);
    res.status(200).json({
      success: true,
      Response: { offer, ReturnMessage: 'Slot switched successfully' },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const declineSlotOfferController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }

    const offer = await declineSlotOffer(userId, req.params.id);
    res.status(200).json({
      success: true,
      Response: { offer, ReturnMessage: 'Offer declined' },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
