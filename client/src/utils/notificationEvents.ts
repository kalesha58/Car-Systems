type NotificationInvalidateListener = () => void;

const listeners = new Set<NotificationInvalidateListener>();

export const onNotificationsInvalidated = (
  listener: NotificationInvalidateListener,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const invalidateNotifications = (): void => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[Notifications] invalidate listener error:', error);
    }
  });
};
