import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
  type Event,
} from '@notifee/react-native';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

import { getString, setString, StorageKeys } from '@storage/index';

import { CustomerStackRoutes, DealerStackRoutes, RootRoutes } from '@constants/routes';
import { GREETING_NOTIFICATION_IMAGE_URL } from '@config/greetingNotification';
import { navigationRef } from '@navigation/navigationRef';

export const NOTIFICATION_CHANNEL_ID = 'motonode_notifications';

export async function createNotifeeChannel(): Promise<string> {
  if (Platform.OS === 'android') {
    return notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'motonode Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  }
  return NOTIFICATION_CHANNEL_ID;
}

export async function requestNotificationPermission(): Promise<boolean> {
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
      } catch {
        return false;
      }
    }
    return true;
  }

  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function displayNotifeeNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string,
): Promise<string | undefined> {
  try {
    const safeTitle = title.trim() || 'motonode';
    const safeBody = body.trim() || ' ';
    const channelId = await createNotifeeChannel();
    const pictureUrl = imageUrl?.trim() || undefined;

    const androidConfig: Record<string, unknown> = {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
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

    return await notifee.displayNotification({
      title: safeTitle,
      body: safeBody,
      data: data || {},
      android: androidConfig as never,
      ios: {
        sound: 'default',
        attachments: pictureUrl
          ? [{ url: pictureUrl, thumbnailHidden: false }]
          : undefined,
      },
    });
  } catch (error) {
    console.error('[Push] displayNotifeeNotification:', error);
    return undefined;
  }
}

export async function displayRemoteNotificationFromData(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const title =
    remoteMessage.notification?.title ||
    (remoteMessage.data?.title as string | undefined) ||
    'motonode';
  const body =
    remoteMessage.notification?.body || (remoteMessage.data?.body as string | undefined) || '';
  const imageUrl =
    remoteMessage.notification?.android?.imageUrl ||
    (remoteMessage.data?.imageUrl as string | undefined);

  const data = Object.entries(remoteMessage.data || {}).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value != null) {
        acc[key] = String(value);
      }
      return acc;
    },
    {},
  );

  await displayNotifeeNotification(title, body, data, imageUrl);
}

async function resolveConversationType(conversationId: string): Promise<string | undefined> {
  try {
    const doc = await firestore().collection('conversations').doc(conversationId).get();
    return doc.data()?.type as string | undefined;
  } catch {
    return undefined;
  }
}

function navigateToChat(conversationType: string | undefined, userRole?: string) {
  if (!navigationRef.isReady()) {
    return;
  }

  const rootRoute = userRole === 'dealer' ? RootRoutes.Dealer : RootRoutes.Customer;
  const chatRoute =
    conversationType === 'dealer' ? CustomerStackRoutes.DealerChat : CustomerStackRoutes.Chat;

  navigationRef.navigate(rootRoute, { screen: chatRoute } as never);
}

export type NotificationNavigationOptions = {
  userRole?: string;
  setActiveConversationId?: (id: string | null) => void;
};

export async function handleNotificationNavigation(
  data: Record<string, unknown> | undefined,
  options: NotificationNavigationOptions = {},
): Promise<void> {
  if (!data?.type || !navigationRef.isReady()) {
    return;
  }

  const type = String(data.type);
  const orderId = data.orderId ? String(data.orderId) : undefined;
  const bookingId = data.bookingId ? String(data.bookingId) : undefined;
  const conversationId = data.conversationId ? String(data.conversationId) : undefined;
  const chatId = data.chatId ? String(data.chatId) : undefined;
  const userRole = options.userRole;

  if ((type === 'order_update' || type === 'payment') && orderId) {
    if (userRole === 'dealer') {
      navigationRef.navigate(RootRoutes.Dealer, {
        screen: DealerStackRoutes.DealerOrderDetail,
        params: { orderId },
      } as never);
    } else {
      navigationRef.navigate(RootRoutes.Customer, {
        screen: CustomerStackRoutes.OrderTracking,
        params: { id: orderId },
      } as never);
    }
    return;
  }

  if (type === 'chat') {
    const convId = conversationId || chatId;
    if (!convId) {
      return;
    }

    options.setActiveConversationId?.(convId);
    const conversationType = conversationId
      ? await resolveConversationType(conversationId)
      : undefined;
    navigateToChat(conversationType, userRole);
    return;
  }

  if (
    type === 'service_update' ||
    type === 'tyre_service_update' ||
    type === 'tyre_service_request'
  ) {
    if (userRole === 'dealer') {
      if (bookingId) {
        navigationRef.navigate(RootRoutes.Dealer, {
          screen: DealerStackRoutes.DealerBookingDetail,
          params: { bookingId, bookingType: 'service' },
        } as never);
      } else {
        navigationRef.navigate(RootRoutes.Dealer, {
          screen: DealerStackRoutes.ServiceBookings,
        } as never);
      }
    } else if (bookingId) {
      navigationRef.navigate(RootRoutes.Customer, {
        screen: CustomerStackRoutes.ServiceBookingTracking,
        params: { bookingId },
      } as never);
    } else {
      navigationRef.navigate(RootRoutes.Customer, {
        screen: CustomerStackRoutes.Notifications,
      } as never);
    }
    return;
  }

  if (type === 'test_drive_update') {
    if (userRole === 'dealer') {
      if (bookingId) {
        navigationRef.navigate(RootRoutes.Dealer, {
          screen: DealerStackRoutes.DealerBookingDetail,
          params: { bookingId, bookingType: 'test_drive' },
        } as never);
      } else {
        navigationRef.navigate(RootRoutes.Dealer, {
          screen: DealerStackRoutes.DealerTabs,
        } as never);
      }
    } else {
      navigationRef.navigate(RootRoutes.Customer, {
        screen: CustomerStackRoutes.MyOrders,
      } as never);
    }
    return;
  }

  if (type === 'greeting') {
    return;
  }

  if (type === 'general' || type === 'slot_offer') {
    navigationRef.navigate(RootRoutes.Customer, {
      screen: CustomerStackRoutes.Notifications,
    } as never);
  }
}

export async function displayLocalWelcomeNotification(displayName: string): Promise<void> {
  const title = `Welcome to motonode, ${displayName}!`;
  const body = 'Explore vehicles, services, and connect with dealers near you.';

  await displayNotifeeNotification(
    title,
    body,
    {
      type: 'greeting',
      imageUrl: GREETING_NOTIFICATION_IMAGE_URL,
      title,
      body,
    },
    GREETING_NOTIFICATION_IMAGE_URL,
  );
}

async function showWelcomeAfterLogin(greetingSent: boolean, displayName: string): Promise<void> {
  const isForeground = AppState.currentState === 'active';
  if (!isForeground && greetingSent) {
    return;
  }

  await setString(StorageKeys.LAST_GREETING_SHOWN_AT, String(Date.now()));
  await displayLocalWelcomeNotification(displayName);
}

export async function handleGreetingAfterRegister(
  greetingSent: boolean,
  displayName: string,
): Promise<void> {
  await showWelcomeAfterLogin(greetingSent, displayName);
}

export async function initializeNotifications(
  onPress: (data: Record<string, unknown>) => void,
): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[Push] Notification permission denied');
      return;
    }

    await createNotifeeChannel();

    notifee.onForegroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        onPress(detail.notification.data as Record<string, unknown>);
      }
    });

    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification?.notification?.data) {
      onPress(initialNotification.notification.data as Record<string, unknown>);
    }
  } catch (error) {
    console.error('[Push] initializeNotifications:', error);
  }
}
