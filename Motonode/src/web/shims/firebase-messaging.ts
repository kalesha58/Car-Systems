/**
 * Web messaging shim — graceful degrade when Web Push / VAPID is unavailable.
 * Foreground in-app notifications still work via the push notification service shim.
 */

type MessageHandler = (message: {
  data?: Record<string, string>;
  notification?: { title?: string; body?: string };
}) => void;

const noopUnsubscribe = () => undefined;

function messaging() {
  return {
    requestPermission: async () => 1,
    getToken: async () => {
      console.info('[Web Push] FCM web token unavailable without VAPID key; skipping');
      return '';
    },
    deleteToken: async () => undefined,
    registerDeviceForRemoteMessages: async () => undefined,
    onTokenRefresh: (_cb: (token: string) => void) => noopUnsubscribe,
    onMessage: (_cb: MessageHandler) => noopUnsubscribe,
    onNotificationOpenedApp: (_cb: MessageHandler) => noopUnsubscribe,
    getInitialNotification: async () => null,
    setBackgroundMessageHandler: async (_cb: MessageHandler) => undefined,
  };
}

export type FirebaseMessagingTypes = {
  RemoteMessage: {
    data?: Record<string, string>;
    notification?: { title?: string; body?: string };
  };
};

export default messaging;
