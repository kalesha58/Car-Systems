import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
  Event,
} from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { appAxios } from './apiInterceptors';
import { navigate, push } from '@utils/NavigationUtils';
import { getOrderById } from './orderService';
import { hasAuthenticatedSession } from './authService';
import { useAuthStore } from '@state/authStore';

/**
 * Create Notifee notification channel for Android
 */
export const createNotifeeChannel = async (): Promise<string> => {
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'motonode_notifications',
      name: 'motonode Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
    return channelId;
  }
  return 'motonode_notifications';
};

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'motonode needs permission to send you notifications about your orders',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
        return false;
      }
    }
    // Android < 13 doesn't require runtime permission
    return true;
  } else {
    // iOS - Use Notifee for permission request
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = AUTHORIZED, 2 = PROVISIONAL
  }
};

/**
 * Request notification permissions
 */
export const displayNotifeeNotification = async (
  title: string,
  body: string,
  data?: any,
  imageUrl?: string,
): Promise<string | undefined> => {
  try {
    const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'motonode';
    const safeBody = typeof body === 'string' && body.trim() ? body.trim() : ' ';

    // Create channel (Android)
    const channelId = await createNotifeeChannel();

    const pictureUrl =
      typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl.trim() : undefined;

    // Display notification
    const androidConfig: any = {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    };

    if (pictureUrl) {
      androidConfig.largeIcon = pictureUrl;
      androidConfig.style = {
        type: AndroidStyle.BIGPICTURE,
        picture: pictureUrl,
      };
    }

    const notificationId = await notifee.displayNotification({
      title: safeTitle,
      body: safeBody,
      data: data || {},
      android: androidConfig,
      ios: {
        sound: 'default',
        attachments: imageUrl
          ? [
            {
              url: imageUrl,
              thumbnailHidden: false,
            },
          ]
          : undefined,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error displaying Notifee notification:', error);
    return undefined;
  }
};



/**
 * Test notification function - displays a test notification
 */
export const testNotification = async (): Promise<void> => {
  try {
    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted for test');
      return;
    }

    await displayNotifeeNotification(
      'Test Notification',
      'This is a test notification to verify push notifications are working!',
      {
        type: 'test',
        timestamp: Date.now().toString(),
      },
    );
    console.log('Test notification sent successfully');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};

/**
 * Initialize notification service
 */
export const initializeNotifications = async (): Promise<void> => {
  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return;
    }

    // Create notification channel
    await createNotifeeChannel();

    // Setup Notifee event handlers
    notifee.onForegroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        await handleNotificationNavigation(detail.notification.data);
      }
    });

    // Check if app was opened from a notification (initial notification)
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      console.log('App opened from notification:', initialNotification);
      if (initialNotification.notification.data) {
        await handleNotificationNavigation(initialNotification.notification.data);
      }
    }

    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

/**
 * Handle navigation based on notification data (FCM / Notifee tap)
 */
export const handleNotificationNavigation = async (data: Record<string, unknown> | undefined) => {
  if (!data?.type) {
    return;
  }

  const type = String(data.type);
  const orderId = data.orderId ? String(data.orderId) : undefined;
  const chatId = data.chatId ? String(data.chatId) : undefined;
  const groupId = data.groupId ? String(data.groupId) : undefined;

  if ((type === 'order_update' || type === 'payment') && orderId) {
    try {
      const order = await getOrderById(orderId);
      if (order) {
        useAuthStore.getState().setCurrentOrder(order);
      }
      navigate('LiveTracking');
    } catch (error) {
      console.error('[Push] Failed to open order from notification:', error);
    }
    return;
  }

  if (type === 'chat' && chatId) {
    push('ChatMessage', { chatId });
    return;
  }

  if (type === 'group_join_request' && groupId) {
    push('JoinRequests', { groupId });
    return;
  }

  if (type === 'test_drive_update') {
    navigate('MyTestDrives');
    return;
  }

  if (type === 'greeting') {
    return;
  }
};

/**
 * Create notification channel for Android (deprecated - use createNotifeeChannel)
 * @deprecated Use createNotifeeChannel instead
 */
export const createNotificationChannel = (): void => {
  if (Platform.OS === 'android') {
    // Channel is created via Notifee now
    createNotifeeChannel();
  }
};

/**
 * In-app notification types and interfaces
 */
export type NotificationType =
  | 'order_update'
  | 'service_update'
  | 'test_drive_update'
  | 'tyre_service_update'
  | 'tyre_service_request'
  | 'general';

export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    orderId?: string;
    serviceId?: string;
    bookingId?: string;
    testDriveId?: string;
    status?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: string;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGetNotificationsResponse {
  notifications: INotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IGetNotificationsParams {
  page?: number;
  limit?: number;
  read?: boolean;
}

/**
 * Get user notifications
 */
export const getNotifications = async (
  params: IGetNotificationsParams = {},
): Promise<IGetNotificationsResponse> => {
  if (!hasAuthenticatedSession()) {
    return {
      notifications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.read !== undefined) queryParams.append('read', params.read.toString());

    const response = await appAxios.get(`/user/notifications?${queryParams.toString()}`);
    return response.data.Response;
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  if (!hasAuthenticatedSession()) return;
  try {
    await appAxios.put(`/user/notifications/${notificationId}/read`);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<{ count: number }> => {
  if (!hasAuthenticatedSession()) return { count: 0 };
  try {
    const response = await appAxios.put('/user/notifications/read-all');
    return response.data.Response;
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  if (!hasAuthenticatedSession()) {
    return 0;
  }
  try {
    const response = await appAxios.get('/user/notifications/unread-count');
    return response.data.Response.count || 0;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      return 0;
    }
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};
