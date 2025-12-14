import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { SignUp } from '../../models/SignUp';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errorHandler';

/**
 * Register/Update FCM token for authenticated user
 */
export const registerFCMTokenController = async (
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

    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length === 0) {
      throw new AppError('FCM token is required', 400);
    }

    // Validate token format (basic validation - FCM tokens are typically long strings)
    if (fcmToken.length < 50) {
      throw new AppError('Invalid FCM token format', 400);
    }

    // Update user's FCM token
    await SignUp.findByIdAndUpdate(userId, { fcmToken: fcmToken.trim() });

    logger.info(`FCM token registered for user: ${userId}`);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'FCM token registered successfully',
      },
    });
  } catch (error: any) {
    logger.error('Error registering FCM token:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        Response: {
          ReturnMessage: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        Response: {
          ReturnMessage: 'Failed to register FCM token',
        },
      });
    }
  }
};


