/**
 * Notifee web shim — uses Notification API when available.
 */

export const AndroidImportance = {
  HIGH: 4,
  DEFAULT: 3,
} as const;

export const AndroidStyle = {
  BIGPICTURE: 0,
} as const;

export const EventType = {
  PRESS: 1,
  DISMISSED: 2,
} as const;

export type Event = {
  type: number;
  detail: { notification?: { data?: Record<string, unknown> } };
};

const notifee = {
  createChannel: async (channel: { id: string }) => channel.id,
  requestPermission: async () => {
    if (typeof Notification === 'undefined') {
      return { authorizationStatus: 0 };
    }
    const permission = await Notification.requestPermission();
    return { authorizationStatus: permission === 'granted' ? 1 : 0 };
  },
  displayNotification: async (notification: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      console.info('[Web Push]', notification.title, notification.body);
      return 'web-log';
    }
    const n = new Notification(notification.title || 'Motonode', {
      body: notification.body,
      data: notification.data,
    });
    return String(Date.now());
  },
  onForegroundEvent: (_cb: (event: Event) => void) => () => undefined,
  onBackgroundEvent: async (_cb: (event: Event) => void) => undefined,
  getInitialNotification: async () => null,
};

export default notifee;
