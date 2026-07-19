import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useAuth } from '@context/AuthContext';
import { ChatBubble, MessageInput, TypingIndicator, AIHeader } from '@components/chat/index';
import { sendAiMessage } from '@services/ai.service';
import { listenMessages, sendMessage, sanitizeFirestoreData, clearConversationMessages } from '@services/chat.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { lightHaptic } from '@utils/haptics';
import type { Message } from '../../../types/chat';
import auth from '@react-native-firebase/auth';

const QUICK_ACTIONS = [
  { icon: 'cpu', label: 'Diagnose Issue', prompt: 'My car is making a strange noise when I brake. Can you help diagnose this?' },
  { icon: 'search', label: 'Find Parts', prompt: 'I need spare parts for my KTM Duke 390 2023. What do you recommend?' },
  { icon: 'tool', label: 'Service Tips', prompt: 'When should I service my bike and what should be checked?' },
  { icon: 'map-pin', label: 'Nearby Dealers', prompt: 'Find me the nearest automobile dealers in Bangalore.' },
];

export function AIChatScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();

  const flatListRef = useRef<FlatList>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // 1. Load or Create AI Conversation on mount
  useEffect(() => {
    if (!user || user.isGuest) {
      setLoading(false);
      return;
    }

    const initAiChat = async () => {
      const firebaseUid = auth().currentUser?.uid;
      if (!firebaseUid) {
        setLoading(false);
        return;
      }
      try {
        // Find existing AI chat
        const snapshot = await firestore()
          .collection('conversations')
          .where('type', '==', 'ai')
          .where('participants', 'array-contains', firebaseUid)
          .get();

        if (!snapshot.empty) {
          setConversationId(snapshot.docs[0].id);
        } else {
          // Create new AI chat
          const docRef = await firestore().collection('conversations').add(sanitizeFirestoreData({
            type: 'ai',
            participants: [firebaseUid, 'moto_ai'],
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
            unreadCounts: { [firebaseUid]: 0, moto_ai: 0 },
          }));

          // Add initial AI assistant welcome message
          await firestore()
            .collection('conversations')
            .doc(docRef.id)
            .collection('messages')
            .add(sanitizeFirestoreData({
              senderId: 'moto_ai',
              receiverId: firebaseUid,
              messageType: 'text',
              text: "Hi! I'm Moto AI, your automotive companion. I can help you diagnose vehicle issues, find compatible parts, recommend services, and locate dealers near you. How can I help you today?",
              createdAt: firestore.FieldValue.serverTimestamp(),
              status: 'seen',
            }));

          setConversationId(docRef.id);
        }
      } catch (err) {
        console.error('Failed to initialize AI Chat:', err);
      } finally {
        setLoading(false);
      }
    };

    void initAiChat();
  }, [user]);

  // 2. Listen to AI Chat messages when conversationId is available
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = listenMessages(conversationId, (updatedMessages: Message[]) => {
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages.length]);

  const handleSendText = async (text: string) => {
    const firebaseUid = auth().currentUser?.uid;
    if (!text.trim() || !conversationId || !user || !firebaseUid) return;
    lightHaptic();

    // Send user message to Firestore
    await sendMessage(conversationId, {
      conversationId,
      senderId: firebaseUid,
      receiverId: 'moto_ai',
      messageType: 'text',
      text: text.trim(),
      status: 'seen',
    });

    setIsTyping(true);

    try {
      // Call external API endpoint for AI
      const response = await sendAiMessage(text.trim());
      
      // Save AI reply in Firestore
      await sendMessage(conversationId, {
        conversationId,
        senderId: 'moto_ai',
        receiverId: firebaseUid,
        messageType: 'text',
        text: response.content,
        status: 'seen',
      });
    } catch (err) {
      const errMsg = getApiErrorMessage(err, 'Sorry, I could not process your request. Please try again.');
      
      // Save error message in Firestore
      await sendMessage(conversationId, {
        conversationId,
        senderId: 'moto_ai',
        receiverId: firebaseUid,
        messageType: 'text',
        text: errMsg,
        status: 'seen',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    const firebaseUid = auth().currentUser?.uid;
    if (!conversationId || !firebaseUid) return;

    Alert.alert('Clear chat', 'Delete all messages in this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setIsTyping(false);
              await clearConversationMessages(conversationId, {
                welcomeMessage: {
                  senderId: 'moto_ai',
                  receiverId: firebaseUid,
                  text: "Hi! I'm Moto AI, your automotive companion. I can help you diagnose vehicle issues, find compatible parts, recommend services, and locate dealers near you. How can I help you today?",
                },
              });
              lightHaptic();
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err, 'Failed to clear chat. Please try again.'));
            }
          })();
        },
      },
    ]);
  };

  const handleMenu = () => {
    Alert.alert('Moto AI', undefined, [
      { text: 'Clear chat', style: 'destructive', onPress: handleClearChat },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AIHeader onBack={() => navigation.goBack()} onMenu={handleMenu} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          messages.length <= 1 ? (
            <View style={styles.quickActionsContainer}>
              <Text style={[styles.quickActionsTitle, { color: colors.textSecondary }]}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <Pressable
                    key={action.label}
                    style={({ pressed }) => [
                      styles.quickAction,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handleSendText(action.prompt)}
                  >
                    <Feather name={action.icon as 'cpu'} size={18} color={colors.primary} />
                    <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            currentUserId={auth().currentUser?.uid || ''}
          />
        )}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <MessageInput
          onSendMessage={handleSendText}
          onSendImage={() => Alert.alert('AI Feature', 'Moto AI does not support image uploads yet.')}
          onSendVoice={() => Alert.alert('AI Feature', 'Moto AI does not support voice notes yet.')}
          onSendDocument={() => Alert.alert('AI Feature', 'Moto AI does not support document uploads yet.')}
          onSendLocation={() => Alert.alert('AI Feature', 'Moto AI does not support sharing locations yet.')}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  quickActionsContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  quickActionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
