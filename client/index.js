/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { displayRemoteNotificationFromData } from './src/service/pushNotificationService';

const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      const channelId = await notifee.createChannel({
        id: 'motonode_notifications',
        name: 'motonode Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      console.log('Background notification channel created:', channelId);
      return channelId;
    } catch (error) {
      console.error('Error creating notification channel:', error);
      return 'motonode_notifications';
    }
  }
  return 'motonode_notifications';
};

createNotificationChannel();

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await displayRemoteNotificationFromData(remoteMessage);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS && detail.notification?.data) {
    const { handleNotificationNavigation } = require('./src/service/notificationService');
    await handleNotificationNavigation(detail.notification.data);
  }
});

AppRegistry.registerComponent(appName, () => App);
