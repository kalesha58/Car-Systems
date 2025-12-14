import { getMessaging } from '../config/firebase';
import { SignUp } from '../models/SignUp';
import { logger } from '../utils/logger';
import * as admin from 'firebase-admin';

export interface INotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: {
    type?: 'order_update' | 'payment' | 'chat' | 'general' | 'group_join_request' | 'greeting';
    orderId?: string;
    status?: string;
    chatId?: string;
    groupId?: string;
    requestId?: string;
    userId?: string;
    userName?: string;
    [key: string]: any;
  };
}

/**
 * Send push notification to a single user by userId
 */
export const sendPushNotification = async (
  userId: string,
  payload: INotificationPayload,
): Promise<boolean> => {
  try {
    const user = await SignUp.findById(userId).select('fcmToken').lean();

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return false;
    }

    if (!user.fcmToken) {
      logger.warn(`No FCM token found for user: ${userId}`);
      return false;
    }

    return await sendPushNotificationToToken(user.fcmToken, payload);
  } catch (error) {
    logger.error(`Error sending push notification to user ${userId}:`, error);
    return false;
  }
};

/**
 * Send push notification to a single FCM token
 */
export const sendPushNotificationToToken = async (
  fcmToken: string,
  payload: INotificationPayload,
): Promise<boolean> => {
  try {
    const messaging = getMessaging();

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data
        ? Object.entries(payload.data).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as { [key: string]: string })
        : {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'carconnect_notifications',
          sound: 'default',
          priority: 'high' as const,
          imageUrl: payload.imageUrl,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
        fcmOptions: payload.imageUrl
          ? {
              imageUrl: payload.imageUrl,
            }
          : undefined,
      },
    };

    const response = await messaging.send(message);
    logger.info(`Push notification sent successfully: ${response}`, {
      fcmToken: fcmToken.substring(0, 20) + '...',
      title: payload.title,
    });
    return true;
  } catch (error: any) {
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
      logger.warn(`Invalid or unregistered FCM token: ${fcmToken.substring(0, 20)}...`);
      // Optionally remove the token from database
      await removeInvalidToken(fcmToken);
    } else {
      logger.error('Error sending push notification:', error);
    }
    return false;
  }
};

/**
 * Send push notification to multiple users
 */
export const sendPushNotificationToUsers = async (
  userIds: string[],
  payload: INotificationPayload,
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  logger.info(`Bulk notification sent: ${success} success, ${failed} failed`);
  return { success, failed };
};

/**
 * Send greeting notification after login
 */
export const sendGreetingNotification = async (userId: string): Promise<void> => {
  try {
    const imageUrl = process.env.GREETING_NOTIFICATION_IMAGE_URL || 
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1765692021/All-Vehicles_oiikhd.jpg';
    
    await sendPushNotification(userId, {
      title: 'Welcome to Car Connect!',
      body: 'Explore our amazing collection of vehicles and connect with dealers.',
      imageUrl,
      data: {
        type: 'greeting',
      },
    });
    
    logger.info(`Greeting notification sent to user: ${userId}`);
  } catch (error) {
    logger.error('Error sending greeting notification:', error);
    // Don't throw - greeting notification failure shouldn't affect login
  }
};

/**
 * Remove invalid FCM token from database
 */
const removeInvalidToken = async (fcmToken: string): Promise<void> => {
  try {
    await SignUp.updateMany({ fcmToken }, { $unset: { fcmToken: 1 } });
    logger.info(`Removed invalid FCM token from database`);
  } catch (error) {
    logger.error('Error removing invalid FCM token:', error);
  }
};


