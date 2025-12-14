import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType, Event } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { appAxios } from './apiInterceptors';

/**
 * Create Notifee notification channel for Android
 */
export const createNotifeeChannel = async (): Promise<string> => {
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'carconnect_notifications',
      name: 'CarConnect Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
    return channelId;
  }
  return 'carconnect_notifications';
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
            message: 'Car Connect needs permission to send you notifications about your orders',
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
 * Get FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFCMToken = async (token: string): Promise<boolean> => {
  try {
    await appAxios.post('/user/fcm-token', { fcmToken: token });
    console.log('FCM token registered successfully');
    return true;
  } catch (error: any) {
    console.error('Error registering FCM token:', error);
    return false;
  }
};

/**
 * Display notification using Notifee
 */
export const displayNotifeeNotification = async (
  title: string,
  body: string,
  data?: any,
  imageUrl?: string,
): Promise<string | undefined> => {
  try {
    // Create channel (Android)
    const channelId = await createNotifeeChannel();

    // Display notification
    const androidConfig: any = {
      channelId,
      smallIcon: 'ic_launcher',
      largeIcon: imageUrl,
      pressAction: {
        id: 'default',
      },
      importance: AndroidImportance.HIGH,
      sound: 'default',
    };

    // Add image style for Android if image URL is provided
    if (imageUrl) {
      androidConfig.style = {
        type: 1, // BigPictureStyle
        picture: imageUrl,
      };
    }

    const notificationId = await notifee.displayNotification({
      title,
      body,
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

    // Get and register token
    const token = await getFCMToken();
    if (token) {
      await registerFCMToken(token);
    }

    // Setup token refresh listener
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed:', newToken);
      await registerFCMToken(newToken);
    });

    // Setup foreground message handler - Use Notifee to display
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      if (remoteMessage.notification) {
        // Extract image URL from notification (FCM sends it in notification.imageUrl)
        const imageUrl = (remoteMessage.notification as any).imageUrl || 
                         remoteMessage.data?.imageUrl;
        
        await displayNotifeeNotification(
          remoteMessage.notification.title || 'Car Connect',
          remoteMessage.notification.body || '',
          remoteMessage.data,
          imageUrl,
        );
      }
    });

    // Setup Notifee event handlers (replaces Firebase's onNotificationOpenedApp and getInitialNotification)
    notifee.onForegroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed (foreground):', detail.notification);
        if (detail.notification?.data) {
          handleNotificationNavigation(detail.notification.data);
        }
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed (background):', detail.notification);
        if (detail.notification?.data) {
          handleNotificationNavigation(detail.notification.data);
        }
      }
    });

    // Check if app was opened from a notification (initial notification)
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      console.log('App opened from notification:', initialNotification);
      if (initialNotification.notification.data) {
        handleNotificationNavigation(initialNotification.notification.data);
      }
    }

    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

/**
 * Handle navigation based on notification data
 */
const handleNotificationNavigation = (data: any) => {
  if (!data) return;

  // Import navigation dynamically to avoid circular dependencies
  // Navigation will be handled by the app's navigation system
  // For now, we'll use a navigation service or event emitter pattern
  
  // Handle different notification types
  if (data.type === 'order_update' && data.orderId) {
    // Navigate to order details (LiveTracking screen)
    console.log('Navigate to order:', data.orderId);
    // You can emit an event here that the Navigation component listens to
    // Or use a navigation service
  } else if (data.type === 'payment' && data.orderId) {
    // Navigate to payment/order status
    console.log('Navigate to payment for order:', data.orderId);
  } else if (data.type === 'chat' && data.chatId) {
    // Navigate to chat (ChatMessage screen)
    console.log('Navigate to chat:', data.chatId);
  } else if (data.type === 'group_join_request' && data.groupId) {
    // Navigate to join requests screen for the group
    console.log('Navigate to join requests for group:', data.groupId);
    // You can emit an event here to navigate to JoinRequestsScreen with groupId
  } else if (data.type === 'greeting') {
    // Greeting notification - no navigation needed, just display
    console.log('Greeting notification received');
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

