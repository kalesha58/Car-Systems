import { useEffect } from 'react';

import { useAuth } from '@context/AuthContext';
import { useChat } from '@context/ChatContext';
import {
  handleNotificationNavigation,
  initializeNotifications,
} from '@services/pushNotificationService';
import {
  handleInitialNotificationOpen,
  processPendingLoginGreeting,
  setPushNavigationOptions,
  setupPushMessaging,
  teardownPushMessaging,
} from '@services/pushMessagingService';

export function PushNotificationHandler() {
  const { user } = useAuth();
  const { setActiveConversationId } = useChat();

  useEffect(() => {
    const userRole = user?.role;
    const userId = user?.id;

    setPushNavigationOptions({
      userRole,
      setActiveConversationId,
    });

    if (!userId || user?.isGuest) {
      teardownPushMessaging();
      return;
    }

    void initializeNotifications((data) => {
      void handleNotificationNavigation(data, {
        userRole,
        setActiveConversationId,
      });
    });

    setupPushMessaging(userId);
    void handleInitialNotificationOpen();
    void processPendingLoginGreeting(userId, user.name || 'there');

    return () => {
      teardownPushMessaging();
    };
  }, [setActiveConversationId, user?.id, user?.isGuest, user?.name, user?.role]);

  return null;
}
