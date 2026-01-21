import { getMessaging } from '../config/firebase';
import { SignUp } from '../models/SignUp';
import { Notification, INotificationDocument, NotificationType } from '../models/Notification';
import { logger } from '../utils/logger';
import * as admin from 'firebase-admin';
import { emitToUserNotificationRoom } from './socket/socketService';

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

/**
 * Create in-app notification record
 */
export interface ICreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    orderId?: string;
    serviceId?: string;
    status?: string;
    [key: string]: any;
  };
  relatedId?: string;
}

export const createNotification = async (
  data: ICreateNotificationData,
): Promise<INotificationDocument> => {
  try {
    const notification = new Notification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data || {},
      relatedId: data.relatedId,
      read: false,
    });

    await notification.save();

    // Emit socket event for real-time notification
    try {
      emitToUserNotificationRoom(data.userId, 'newNotification', {
        id: (notification._id as any).toString(),
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        relatedId: notification.relatedId,
        read: notification.read,
        createdAt: notification.createdAt,
      });
    } catch (socketError) {
      logger.error('Error emitting socket event for notification:', socketError);
      // Don't throw - socket failure shouldn't block notification creation
    }

    logger.info(`Notification created for user: ${data.userId}, type: ${data.type}`);
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get user notifications with pagination
 */
export interface IGetUserNotificationsRequest {
  page?: number;
  limit?: number;
  read?: boolean;
}

export interface IUserNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    orderId?: string;
    serviceId?: string;
    status?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: string;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

export const getUserNotifications = async (
  userId: string,
  query: IGetUserNotificationsRequest = {},
): Promise<{
  notifications: IUserNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (query.read !== undefined) {
      filter.read = query.read;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const formattedNotifications: IUserNotification[] = notifications.map((notif) => ({
      id: (notif._id as any).toString(),
      type: notif.type,
      title: notif.title,
      body: notif.body,
      data: notif.data,
      read: notif.read,
      readAt: notif.readAt?.toISOString(),
      relatedId: notif.relatedId,
      createdAt: notif.createdAt.toISOString(),
      updatedAt: notif.updatedAt.toISOString(),
    }));

    return {
      notifications: formattedNotifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (
  notificationId: string,
  userId: string,
): Promise<INotificationDocument> => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all user notifications as read
 */
export const markAllAsRead = async (userId: string): Promise<{ count: number }> => {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );

    return { count: result.modifiedCount };
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    return count;
  } catch (error) {
    logger.error('Error getting unread notification count:', error);
    throw error;
  }
};


