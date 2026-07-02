import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { getString, setString, StorageKeys } from '@storage/index';
import { api } from './api';
import { handleGreetingAfterRegister, requestNotificationPermission } from './pushNotificationService';

async function getDeviceId(): Promise<string> {
  const existing = await getString(StorageKeys.DEVICE_ID);
  if (existing) {
    return existing;
  }

  const deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await setString(StorageKeys.DEVICE_ID, deviceId);
  return deviceId;
}

export type RegisterFcmTokenOptions = {
  afterLogin?: boolean;
  displayName?: string;
};

/**
 * Register FCM token in Firestore for Cloud Function chat push delivery
 * and on the server for order/booking notifications.
 */
export async function registerFcmToken(
  userId: string,
  options?: RegisterFcmTokenOptions,
): Promise<void> {
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

  try {
    const response = await api.post('/user/fcm-token', {
      fcmToken: token,
      ...(options?.afterLogin ? { afterLogin: true } : {}),
    });

    if (options?.afterLogin) {
      const greetingSent = Boolean(response.data?.Response?.greetingSent);
      const displayName = options.displayName?.trim() || 'there';
      await handleGreetingAfterRegister(greetingSent, displayName);
    }
  } catch (error) {
    console.warn('Server FCM token registration failed:', error);
    if (options?.afterLogin) {
      const displayName = options.displayName?.trim() || 'there';
      await handleGreetingAfterRegister(false, displayName);
    }
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

  try {
    await messaging().deleteToken();
  } catch (error) {
    console.warn('FCM token delete failed:', error);
  }
}
