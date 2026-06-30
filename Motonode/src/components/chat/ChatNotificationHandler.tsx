import { useEffect } from 'react';
import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

import { useChat } from '@context/ChatContext';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { CustomerStackRoutes, RootRoutes } from '@constants/routes';
import { navigationRef } from '@navigation/navigationRef';

function navigateToConversation(
  conversationId: string,
  conversationType: string | undefined,
  userRole: string | undefined,
) {
  if (!navigationRef.isReady()) {
    return;
  }

  const rootRoute = userRole === 'dealer' ? RootRoutes.Dealer : RootRoutes.Customer;
  const chatRoute =
    conversationType === 'dealer' ? CustomerStackRoutes.DealerChat : CustomerStackRoutes.Chat;

  navigationRef.navigate(rootRoute, {
    screen: chatRoute,
  } as never);
}

async function resolveConversationType(conversationId: string): Promise<string | undefined> {
  try {
    const doc = await firestore().collection('conversations').doc(conversationId).get();
    return doc.data()?.type as string | undefined;
  } catch {
    return undefined;
  }
}

function handleChatNotification(
  data: FirebaseMessagingTypes.RemoteMessage['data'],
  setActiveConversationId: (id: string | null) => void,
  userRole: string | undefined,
) {
  const conversationId = data?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    return;
  }

  setActiveConversationId(conversationId);
  void resolveConversationType(conversationId).then((type) => {
    navigateToConversation(conversationId, type, userRole);
  });
}

export function ChatNotificationHandler() {
  const { setActiveConversationId } = useChat();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      handleChatNotification(remoteMessage.data, setActiveConversationId, user?.role);
    });

    void messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage?.data?.type === 'chat') {
          handleChatNotification(remoteMessage.data, setActiveConversationId, user?.role);
        }
      });

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage.data?.type === 'chat') {
        const title = remoteMessage.notification?.title || 'New message';
        const body = remoteMessage.notification?.body || '';
        showToast(`${title}: ${body}`, 'info');
      }
    });

    return () => {
      unsubscribeOpened();
      unsubscribeForeground();
    };
  }, [setActiveConversationId, showToast, user?.role]);

  return null;
}
