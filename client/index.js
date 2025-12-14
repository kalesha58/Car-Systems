/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Create notification channel for Android (must be called early, before handler registration)
const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      const channelId = await notifee.createChannel({
        id: 'carconnect_notifications',
        name: 'CarConnect Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      console.log('Background notification channel created:', channelId);
      return channelId;
    } catch (error) {
      console.error('Error creating notification channel:', error);
      return 'carconnect_notifications';
    }
  }
  return 'carconnect_notifications';
};

// Initialize channel immediately
createNotificationChannel();

// Register background message handler
// This must be called outside of your application logic, as early as possible
// It handles messages when the app is in background or quit state
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);

  try {
    // Ensure channel exists
    const channelId = await createNotificationChannel();
    
    // Extract notification data
    const title = remoteMessage.notification?.title || 'Car Connect';
    const body = remoteMessage.notification?.body || '';
    const imageUrl = (remoteMessage.notification)?.imageUrl || remoteMessage.data?.imageUrl;
    const data = remoteMessage.data || {};

    // Display notification using Notifee
    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: 'carconnect_notifications',
        smallIcon: 'ic_launcher',
        largeIcon: imageUrl,
        pressAction: {
          id: 'default',
        },
        importance: AndroidImportance.HIGH,
        sound: 'default',
        ...(imageUrl && {
          style: {
            type: 1, // BigPictureStyle
            picture: imageUrl,
          },
        }),
      },
      ios: {
        sound: 'default',
        ...(imageUrl && {
          attachments: [
            {
              url: imageUrl,
              thumbnailHidden: false,
            },
          ],
        }),
      },
    });

    console.log('Background notification displayed successfully');

    // Handle different notification types for logging/debugging
    if (data.type) {
      const { type, orderId, status, chatId } = data;

      if (type === 'order_update' && orderId) {
        console.log('Background: Order update received', { orderId, status });
        // You can update local storage, sync data, etc.
        // Example: Update cached order status
      } else if (type === 'payment' && orderId) {
        console.log('Background: Payment notification received', { orderId });
        // Handle payment-related background tasks
      } else if (type === 'chat' && chatId) {
        console.log('Background: Chat message received', { chatId });
        // Handle chat-related background tasks
      }
    }
  } catch (error) {
    console.error('Error displaying background notification:', error);
  }

  // The handler must return a promise once logic is completed
  return Promise.resolve();
});

AppRegistry.registerComponent(appName, () => App);
