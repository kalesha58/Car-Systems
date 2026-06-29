import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { icon: 'cpu', label: 'Diagnose Issue', prompt: 'My car is making a strange noise when I brake. Can you help diagnose this?' },
  { icon: 'search', label: 'Find Parts', prompt: 'I need spare parts for my KTM Duke 390 2023. What do you recommend?' },
  { icon: 'tool', label: 'Service Tips', prompt: 'When should I service my bike and what should be checked?' },
  { icon: 'map-pin', label: 'Nearby Dealers', prompt: 'Find me the nearest automobile dealers in Bangalore.' },
];

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Moto AI, your automotive companion. I can help you diagnose vehicle issues, find compatible parts, recommend services, and locate dealers near you. How can I help you today?",
  timestamp: new Date(),
};

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
};

type AiScreenNavigationProp = NativeStackNavigationProp<
  CustomerStackParamList,
  typeof CustomerStackRoutes.AiAssistant
>;

export function AiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AiScreenNavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    lightHaptic();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "Based on your description, this could be worn brake pads or warped rotors. I'd recommend getting your brakes inspected at a certified workshop. Would you like me to find nearby service centers?",
        "For your KTM Duke 390 2023, I'd recommend OEM KTM spare parts for critical components. Authorized dealers stock genuine parts with warranty. Would you like me to show dealers near you?",
        'For optimal performance, your KTM Duke should be serviced every 3,000 km or 3 months, whichever comes first. Key checks include engine oil, chain tension, brake pads, and air filter.',
        'I found 8 automobile dealers within 5km of your location in Koramangala. Speed Auto Parts, KTM Bangalore, and AutoZone are rated 4.5+ with great reviews.',
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const assistantMsg: Message = {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.aiAvatar, { backgroundColor: '#7C3AED' }]}>
            <Feather name="cpu" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Moto AI</Text>
            <Text style={styles.headerStatus}>Online · Ready to help</Text>
          </View>
        </View>
        <Pressable style={styles.iconBtn}>
          <Feather name="more-vertical" size={22} color="#fff" />
        </Pressable>
      </View>

      {messages.length === 1 && (
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.quickActionsTitle, { color: colors.textSecondary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => sendMessage(action.prompt)}
              >
                <Feather name={action.icon as 'cpu'} size={20} color={colors.primary} />
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.typingIndicator, { backgroundColor: colors.card }]}>
              <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.role === 'user' && styles.userMessageRow]}>
            {item.role === 'assistant' && (
              <View style={[styles.messageAvatar, { backgroundColor: '#7C3AED' }]}>
                <Feather name="cpu" size={16} color="#fff" />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                item.role === 'user'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.messageText, { color: item.role === 'user' ? '#fff' : colors.textPrimary }]}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Pressable style={[styles.inputAction, { backgroundColor: colors.muted }]}>
            <Feather name="mic" size={20} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.muted }]}
            placeholder="Ask anything about your vehicle..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
          >
            <Feather name="send" size={18} color={input.trim() ? '#fff' : colors.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 14, gap: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerStatus: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  quickActionsContainer: { padding: 16, paddingBottom: 0 },
  quickActionsTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 10 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  quickActionLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  messagesContent: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  userMessageRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  messageAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  messageBubble: { borderRadius: 18, padding: 12, flex: 1 },
  messageText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  typingIndicator: { flexDirection: 'row', gap: 4, padding: 14, borderRadius: 18, alignSelf: 'flex-start', marginTop: 8 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1 },
  inputAction: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
