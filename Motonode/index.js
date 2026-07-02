/**
 * @format
 */

import 'react-native-gesture-handler';

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

import App from './App';
import { name as appName } from './app.json';

const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      await notifee.createChannel({
        id: 'motonode_notifications',
        name: 'motonode Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    } catch (error) {
      console.error('[Push] Error creating notification channel:', error);
    }
  }
};

void createNotificationChannel();

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const { displayRemoteNotificationFromData } = require('./src/services/pushNotificationService');
  await displayRemoteNotificationFromData(remoteMessage);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS && detail.notification?.data) {
    const { handleNotificationNavigation } = require('./src/services/pushNotificationService');
    await handleNotificationNavigation(detail.notification.data);
  }
});

AppRegistry.registerComponent(appName, () => App);
