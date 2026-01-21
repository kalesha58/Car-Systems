import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { SignUp } from '../../models/SignUp';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errorHandler';
import {
  sendGreetingNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../../services/notificationService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

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

    // Check if user had an FCM token before (to determine if this is first registration)
    const user = await SignUp.findById(userId).select('fcmToken').lean();
    const isFirstTimeRegistration = !user || !user.fcmToken;

    // Update user's FCM token
    await SignUp.findByIdAndUpdate(userId, { fcmToken: fcmToken.trim() });

    logger.info(`FCM token registered for user: ${userId}`);

    // Send greeting notification if this is the first time registering a token
    if (isFirstTimeRegistration) {
      try {
        // Send asynchronously without awaiting to not block the response
        sendGreetingNotification(userId).catch((error) => {
          logger.error('Failed to send greeting notification after token registration:', error);
        });
      } catch (error) {
        logger.error('Error sending greeting notification:', error);
        // Don't fail token registration if notification fails
      }
    }

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

/**
 * Test greeting notification controller
 */
export const testGreetingNotificationController = async (
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

    // Send greeting notification
    try {
      await sendGreetingNotification(userId);
      res.status(200).json({
        success: true,
        Response: {
          ReturnMessage: 'Greeting notification sent successfully',
        },
      });
    } catch (error) {
      logger.error('Error sending test greeting notification:', error);
      res.status(500).json({
        success: false,
        Response: {
          ReturnMessage: 'Failed to send greeting notification',
        },
      });
    }
  } catch (error: any) {
    logger.error('Error in test greeting notification controller:', error);
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
          ReturnMessage: 'Failed to send test greeting notification',
        },
      });
    }
  }
};

/**
 * Get user notifications
 */
export const getNotificationsController = async (
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;

    const result = await getUserNotifications(userId, { page, limit, read });

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsReadController = async (
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

    const { id } = req.params;

    if (!id) {
      throw new AppError('Notification ID is required', 400);
    }

    await markAsRead(id, userId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Notification marked as read',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadController = async (
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

    const result = await markAllAsRead(userId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'All notifications marked as read',
        count: result.count,
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCountController = async (
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

    const count = await getUnreadCount(userId);

    res.status(200).json({
      success: true,
      Response: {
        count,
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};


