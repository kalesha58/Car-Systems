import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import { getString, setString, StorageKeys } from '@storage/index';
import { api } from './api';

async function getDeviceId(): Promise<string> {
  const existing = await getString(StorageKeys.DEVICE_ID);
  if (existing) {
    return existing;
  }

  const deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await setString(StorageKeys.DEVICE_ID, deviceId);
  return deviceId;
}

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Register FCM token in Firestore for Cloud Function chat push delivery.
 */
export async function registerFcmToken(userId: string): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    return;
  }

  if (Platform.OS === 'ios') {
    await messaging().registerDeviceForRemoteMessages();
  }

  const token = await messaging().getToken();
  if (!token) {
    return;
  }

  const deviceId = await getDeviceId();

  await firestore()
    .collection('users')
    .doc(userId)
    .collection('fcmTokens')
    .doc(deviceId)
    .set({
      token,
      platform: Platform.OS,
      updatedAt: Date.now(),
    });

  // Keep server Mongo token for order/booking notifications
  try {
    await api.post('/user/fcm-token', { fcmToken: token });
  } catch (error) {
    console.warn('Server FCM token registration failed:', error);
  }
}

export async function unregisterFcmToken(userId: string): Promise<void> {
  const deviceId = await getDeviceId();

  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .doc(deviceId)
      .delete();
  } catch (error) {
    console.warn('Firestore FCM token cleanup failed:', error);
  }

  try {
    await api.delete('/user/fcm-token');
  } catch (error) {
    console.warn('Server FCM token cleanup failed:', error);
  }
}
