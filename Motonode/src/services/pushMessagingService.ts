import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import { getString, setString, remove, StorageKeys } from '@storage/index';
import { registerFcmToken } from './fcmTokenService';
import {
  displayRemoteNotificationFromData,
  type NotificationNavigationOptions,
} from './pushNotificationService';

let tokenRefreshUnsubscribe: (() => void) | null = null;
let foregroundUnsubscribe: (() => void) | null = null;
let notificationOpenedUnsubscribe: (() => void) | null = null;

let navigationOptions: NotificationNavigationOptions = {};

export function setPushNavigationOptions(options: NotificationNavigationOptions): void {
  navigationOptions = options;
}

export function markPendingLoginGreeting(): void {
  void setString(StorageKeys.PENDING_LOGIN_GREETING, '1');
}

export async function processPendingLoginGreeting(userId: string, displayName: string): Promise<void> {
  const pending = await getString(StorageKeys.PENDING_LOGIN_GREETING);
  if (pending !== '1') {
    return;
  }

  await remove(StorageKeys.PENDING_LOGIN_GREETING);
  await remove(StorageKeys.LAST_GREETING_SHOWN_AT);
  await registerFcmToken(userId, { afterLogin: true, displayName });
}

export function setupTokenRefreshListener(userId: string): void {
  if (tokenRefreshUnsubscribe) {
    return;
  }

  tokenRefreshUnsubscribe = messaging().onTokenRefresh(async () => {
    await registerFcmToken(userId);
  });
}

export function teardownTokenRefreshListener(): void {
  tokenRefreshUnsubscribe?.();
  tokenRefreshUnsubscribe = null;
}

export function setupForegroundPushHandler(): void {
  if (foregroundUnsubscribe) {
    return;
  }

  foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
    if (remoteMessage.data?.type === 'greeting') {
      const lastShown = await getString(StorageKeys.LAST_GREETING_SHOWN_AT);
      if (lastShown && Date.now() - Number(lastShown) < 8000) {
        return;
      }
      await setString(StorageKeys.LAST_GREETING_SHOWN_AT, String(Date.now()));
    }

    await displayRemoteNotificationFromData(remoteMessage);
  });
}

export function setupNotificationOpenedHandlers(): void {
  if (notificationOpenedUnsubscribe) {
    return;
  }

  notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage.data) {
      void handleNotificationOpen(remoteMessage.data as Record<string, unknown>);
    }
  });
}

async function handleNotificationOpen(data: Record<string, unknown>): Promise<void> {
  const { handleNotificationNavigation } = await import('./pushNotificationService');
  await handleNotificationNavigation(data, navigationOptions);
}

export async function handleInitialNotificationOpen(): Promise<void> {
  const initial = await messaging().getInitialNotification();
  if (initial?.data) {
    await handleNotificationOpen(initial.data as Record<string, unknown>);
  }
}

export function setupPushMessaging(userId: string): void {
  setupTokenRefreshListener(userId);
  setupForegroundPushHandler();
  setupNotificationOpenedHandlers();
}

export function teardownPushMessaging(): void {
  teardownTokenRefreshListener();
  foregroundUnsubscribe?.();
  foregroundUnsubscribe = null;
  notificationOpenedUnsubscribe?.();
  notificationOpenedUnsubscribe = null;
}

export async function displayRemoteNotificationFromMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  await displayRemoteNotificationFromData(remoteMessage);
}
