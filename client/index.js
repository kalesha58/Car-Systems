/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
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

AppRegistry.registerComponent(appName, () => App);
