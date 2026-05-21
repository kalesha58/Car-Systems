import firebase from '@react-native-firebase/app';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { appAxios } from './apiInterceptors';
import { tokenStorage } from '@state/storage';
import {
  displayNotifeeNotification,
  requestNotificationPermission,
} from './notificationService';

let tokenRefreshUnsubscribe: (() => void) | null = null;
let foregroundUnsubscribe: (() => void) | null = null;

const logPushError = (context: string, error: unknown) => {
  const err = error as Error & { code?: string };
  console.error(`[Push] ${context}:`, {
    name: err?.name,
    code: err?.code,
    message: err?.message,
    stack: err?.stack,
  });
};

const warnIfFirebaseClientMisconfigured = (): void => {
  if (!__DEV__) {
    return;
  }
  try {
    const { apiKey, appId } = firebase.app().options;
    if (!apiKey || apiKey.includes('REPLACE') || !appId || appId.includes('REPLACE')) {
      console.warn(
        '[Push] Firebase client config looks invalid. Replace google-services.json / GoogleService-Info.plist — see client/firebase/README.md',
      );
    }
  } catch {
    // Native Firebase not ready yet
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    warnIfFirebaseClientMisconfigured();
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }
    const token = await messaging().getToken();
    return token || null;
  } catch (error) {
    logPushError('getToken', error);
    return null;
  }
};

export const registerFCMTokenWithBackend = async (options?: {
  afterLogin?: boolean;
}): Promise<boolean> => {
  const accessToken = tokenStorage.getString('accessToken');
  if (!accessToken) {
    return false;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.warn('[Push] Notification permission not granted');
    return false;
  }

  const fcmToken = await getFCMToken();
  if (!fcmToken) {
    return false;
  }

  try {
    await appAxios.post('/user/fcm-token', {
      fcmToken,
      ...(options?.afterLogin ? { afterLogin: true } : {}),
    });
    console.log('[Push] FCM token registered with backend');
    return true;
  } catch (error) {
    logPushError('registerFCMTokenWithBackend', error);
    return false;
  }
};

export const clearFCMTokenOnBackend = async (): Promise<void> => {
  const accessToken = tokenStorage.getString('accessToken');
  if (!accessToken) {
    return;
  }
  try {
    await appAxios.delete('/user/fcm-token');
  } catch (error) {
    logPushError('clearFCMTokenOnBackend', error);
  }
};

export const unregisterPushNotifications = async (): Promise<void> => {
  try {
    await clearFCMTokenOnBackend();
    await messaging().deleteToken();
  } catch (error) {
    logPushError('unregisterPushNotifications', error);
  }
};

export const displayRemoteNotificationFromData = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> => {
  const title =
    remoteMessage.notification?.title ||
    (remoteMessage.data?.title as string) ||
    'motonode';
  const body =
    remoteMessage.notification?.body ||
    (remoteMessage.data?.body as string) ||
    '';
  const imageUrl =
    remoteMessage.notification?.android?.imageUrl ||
    (remoteMessage.data?.imageUrl as string | undefined);

  await displayNotifeeNotification(title, body, remoteMessage.data || {}, imageUrl);
};

export const setupTokenRefreshListener = (): void => {
  if (tokenRefreshUnsubscribe) {
    return;
  }
  tokenRefreshUnsubscribe = messaging().onTokenRefresh(async () => {
    await registerFCMTokenWithBackend();
  });
};

export const setupForegroundPushHandler = (): void => {
  if (foregroundUnsubscribe) {
    return;
  }
  foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
    await displayRemoteNotificationFromData(remoteMessage);
  });
};

let notificationOpenedUnsubscribe: (() => void) | null = null;

export const setupNotificationOpenedHandlers = (): void => {
  if (notificationOpenedUnsubscribe) {
    return;
  }
  notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage.data) {
      const { handleNotificationNavigation } = require('./notificationService');
      void handleNotificationNavigation(remoteMessage.data as Record<string, unknown>);
    }
  });
};

export const handleInitialNotificationOpen = async (): Promise<void> => {
  const initial = await messaging().getInitialNotification();
  if (initial?.data) {
    const { handleNotificationNavigation } = require('./notificationService');
    await handleNotificationNavigation(initial.data as Record<string, unknown>);
  }
};

export const setupPushMessaging = (): void => {
  setupTokenRefreshListener();
  setupForegroundPushHandler();
  setupNotificationOpenedHandlers();
};
