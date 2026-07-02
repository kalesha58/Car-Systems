import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAuth } from './AuthContext';
import { useMobileVerificationGate } from './MobileVerificationContext';
import type { Conversation, Message, ConversationType } from '../types/chat';
import * as chatService from '../services/chat.service';
import { ensureFirebaseReady } from '../services/firebaseAuthBridge';
import {
  ChatGateError,
  checkBlockBeforeSend,
  fetchBlockedUserIds,
  verifyDealerForChat,
} from '../services/chatGate.service';

interface ChatContextValue {
  conversations: Conversation[];
  loadingConversations: boolean;
  unreadCount: number;
  activeConversation: Conversation | null;
  activeMessages: Message[];
  loadingMessages: boolean;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (text: string, replyTo?: Message['replyTo']) => Promise<void>;
  sendImage: (uri: string) => Promise<void>;
  sendVoice: (uri: string) => Promise<void>;
  sendDocument: (uri: string, name: string) => Promise<void>;
  createConversation: (
    otherUserId: string,
    type: ConversationType,
    details?: Partial<Conversation>,
  ) => Promise<string>;
  createGroup: (name: string, members: string[], imageUri?: string) => Promise<string>;
  leaveGroup: (conversationId: string) => Promise<void>;
  updateTypingStatus: (isTyping: boolean) => void;
  markAsSeen: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const { runWithMobileCheck } = useMobileVerificationGate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const blockedUserIdsRef = useRef<string[]>([]);

  useEffect(() => {
    blockedUserIdsRef.current = blockedUserIds;
  }, [blockedUserIds]);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setFirebaseUid(firebaseUser?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  const unreadCount = useMemo(() => {
    if (!firebaseUid) return 0;
    return conversations.reduce((sum, conv) => {
      const counts = conv.unreadCounts || {};
      return sum + (counts[firebaseUid] || 0);
    }, 0);
  }, [conversations, firebaseUid]);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (!user || user.isGuest || !firebaseUid || firebaseUid !== user.id) return;

    let cancelled = false;

    const setOnline = async (online: boolean) => {
      if (cancelled) return;

      try {
        if (online) {
          await ensureFirebaseReady(user.id);
        }
        if (cancelled || auth().currentUser?.uid !== user.id) return;
        await chatService.updateOnlineStatus(user.id, online);
      } catch (error) {
        if (__DEV__) {
          console.warn('Presence update skipped:', error);
        }
      }
    };

    void (async () => {
      try {
        await ensureFirebaseReady(user.id);
        if (cancelled) return;
        await chatService.syncUserProfile(user.id, user.name, user.email, user.role, user.avatar);
        await setOnline(true);
      } catch (error) {
        if (__DEV__) {
          console.warn('Chat presence bootstrap failed:', error);
        }
      }
    })();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        void setOnline(true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        void setOnline(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cancelled = true;
      subscription.remove();
      void setOnline(false);
    };
  }, [user, firebaseUid]);

  useEffect(() => {
    if (!user || user.isGuest) {
      setBlockedUserIds([]);
      return;
    }

    void fetchBlockedUserIds()
      .then(setBlockedUserIds)
      .catch((error) => console.error('Failed to load blocked users:', error));
  }, [user]);

  useEffect(() => {
    if (!user || user.isGuest || !firebaseUid) {
      setConversations([]);
      return;
    }

    setLoadingConversations(true);
    const unsubscribe = chatService.listenConversations(
      firebaseUid,
      (updatedConvs) => {
        setConversations(updatedConvs);
        setLoadingConversations(false);
      },
      { blockedUserIds: blockedUserIdsRef.current },
    );

    return () => unsubscribe();
  }, [user, firebaseUid, blockedUserIds]);

  useEffect(() => {
    if (!activeConversationId) {
      setActiveMessages([]);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = chatService.listenMessages(activeConversationId, (updatedMessages) => {
      setActiveMessages(updatedMessages);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeConversationId]);

  useEffect(() => {
    if (!user || user.isGuest || !activeConversationId || activeMessages.length === 0 || !firebaseUid) {
      return;
    }

    const lastMsg = activeMessages[activeMessages.length - 1];
    if (lastMsg && lastMsg.senderId !== firebaseUid && lastMsg.status !== 'seen') {
      void chatService.markAsSeen(activeConversationId, firebaseUid);
    }
  }, [activeConversationId, activeMessages, user, firebaseUid]);

  const getOtherParticipantId = useCallback((): string => {
    if (!activeConversation || !firebaseUid) return '';
    return activeConversation.participants.find((p) => p !== firebaseUid) || '';
  }, [activeConversation, firebaseUid]);

  const runPreSendGates = useCallback(async () => {
    await runWithMobileCheck(async () => {
      if (!user || user.isGuest) {
        throw new ChatGateError('Authentication required');
      }

      await ensureFirebaseReady(user.id);

      const otherParticipantId = getOtherParticipantId();
      if (!otherParticipantId) {
        throw new ChatGateError('Conversation participant not found');
      }

      await checkBlockBeforeSend(otherParticipantId);

      if (activeConversation?.type === 'dealer' && activeConversation.dealerId) {
        await verifyDealerForChat(activeConversation.dealerId);
      }
    });
  }, [runWithMobileCheck, user, getOtherParticipantId, activeConversation]);

  const showGateError = useCallback((error: unknown) => {
    const message =
      error instanceof ChatGateError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unable to send message';
    Alert.alert('Message not sent', message);
  }, []);

  const handleSendMessage = useCallback(
    async (text: string, replyTo?: Message['replyTo']) => {
      if (!user || !activeConversationId || !firebaseUid || !text.trim()) return;

      try {
        await runPreSendGates();
        const otherParticipantId = getOtherParticipantId();

        await chatService.sendMessage(activeConversationId, {
          conversationId: activeConversationId,
          senderId: firebaseUid,
          receiverId: otherParticipantId,
          messageType: 'text',
          text: text.trim(),
          status: 'sent',
          replyTo,
        });
      } catch (error) {
        showGateError(error);
        throw error;
      }
    },
    [user, activeConversationId, firebaseUid, runPreSendGates, getOtherParticipantId, showGateError],
  );

  const handleSendImage = useCallback(
    async (uri: string) => {
      if (!user || !activeConversationId || !firebaseUid) return;

      try {
        await runPreSendGates();
        await chatService.sendImage(activeConversationId, firebaseUid, uri);
      } catch (error) {
        showGateError(error);
        throw error;
      }
    },
    [user, activeConversationId, firebaseUid, runPreSendGates, showGateError],
  );

  const handleSendVoice = useCallback(
    async (uri: string) => {
      if (!user || !activeConversationId || !firebaseUid) return;

      try {
        await runPreSendGates();
        await chatService.sendVoice(activeConversationId, firebaseUid, uri);
      } catch (error) {
        showGateError(error);
        throw error;
      }
    },
    [user, activeConversationId, firebaseUid, runPreSendGates, showGateError],
  );

  const handleSendDocument = useCallback(
    async (uri: string, name: string) => {
      if (!user || !activeConversationId || !firebaseUid) return;

      try {
        await runPreSendGates();
        await chatService.sendDocument(activeConversationId, firebaseUid, uri, name);
      } catch (error) {
        showGateError(error);
        throw error;
      }
    },
    [user, activeConversationId, firebaseUid, runPreSendGates, showGateError],
  );

  const handleCreateConversation = useCallback(
    async (otherUserId: string, type: ConversationType, details: Partial<Conversation> = {}) => {
      if (!user || user.isGuest) throw new ChatGateError('Authentication required');

      await ensureFirebaseReady(user.id);
      await checkBlockBeforeSend(otherUserId);

      const participantNames = {
        ...(details.participantNames || {}),
        [user.id]: user.name,
      };

      return chatService.createConversation([user.id, otherUserId], type, {
        ...details,
        participantNames,
      });
    },
    [user],
  );

  const handleCreateGroup = useCallback(
    async (name: string, members: string[], imageUri?: string) => {
      if (!user || !firebaseUid) throw new Error('Authentication required');
      await ensureFirebaseReady(user.id);
      const allMembers = Array.from(new Set([firebaseUid, ...members]));
      return chatService.createGroup(name, allMembers, imageUri);
    },
    [user, firebaseUid],
  );

  const handleLeaveGroup = useCallback(
    async (conversationId: string) => {
      if (!user || !firebaseUid) return;
      await chatService.leaveGroup(conversationId, firebaseUid);
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    },
    [user, activeConversationId, firebaseUid],
  );

  const handleUpdateTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!user || !activeConversationId || !firebaseUid) return;
      void chatService.updateTypingStatus(activeConversationId, firebaseUid, isTyping);
    },
    [user, activeConversationId, firebaseUid],
  );

  const handleMarkAsSeen = useCallback(async () => {
    if (!user || !activeConversationId || !firebaseUid) return;
    await chatService.markAsSeen(activeConversationId, firebaseUid);
  }, [user, activeConversationId, firebaseUid]);

  const value = useMemo(
    () => ({
      conversations,
      loadingConversations,
      unreadCount,
      activeConversation,
      activeMessages,
      loadingMessages,
      setActiveConversationId,
      sendMessage: handleSendMessage,
      sendImage: handleSendImage,
      sendVoice: handleSendVoice,
      sendDocument: handleSendDocument,
      createConversation: handleCreateConversation,
      createGroup: handleCreateGroup,
      leaveGroup: handleLeaveGroup,
      updateTypingStatus: handleUpdateTypingStatus,
      markAsSeen: handleMarkAsSeen,
    }),
    [
      conversations,
      loadingConversations,
      unreadCount,
      activeConversation,
      activeMessages,
      loadingMessages,
      handleSendMessage,
      handleSendImage,
      handleSendVoice,
      handleSendDocument,
      handleCreateConversation,
      handleCreateGroup,
      handleLeaveGroup,
      handleUpdateTypingStatus,
      handleMarkAsSeen,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
