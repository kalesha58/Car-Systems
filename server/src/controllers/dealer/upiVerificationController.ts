import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import {
  confirmUpiVerification,
  initiateUpiVerification,
} from '../../services/dealer/upiVerificationService';

export const initiateUpiVerificationController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { upiId } = req.body as { upiId?: string };
    if (!upiId?.trim()) {
      res.status(400).json({ success: false, message: 'UPI ID is required' });
      return;
    }

    const data = await initiateUpiVerification(userId, upiId);

    res.status(200).json({ success: true, data });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const confirmUpiVerificationController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { verificationId, amount, upiId } = req.body as {
      verificationId?: string;
      amount?: number;
      upiId?: string;
    };

    if (!verificationId || amount == null || !upiId?.trim()) {
      res.status(400).json({
        success: false,
        message: 'verificationId, amount, and upiId are required',
      });
      return;
    }

    const data = await confirmUpiVerification(userId, verificationId, upiId, Number(amount));

    res.status(200).json({ success: true, data });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
