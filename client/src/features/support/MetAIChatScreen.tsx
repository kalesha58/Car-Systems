import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from 'react-native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { useTheme } from '@hooks/useTheme';
import { Fonts, Colors } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { storage } from '@state/storage';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import {
  clearSupportChatHistory,
  getSupportChatHistory,
  getSupportQuickActions,
  handleSupportQuickAction,
  IQuickAction,
  ISupportChatMessage,
  sendSupportChatMessage,
} from '@service/supportChatService';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
};

const SESSION_KEY = 'supportChat:sessionId';

const MetAIChatScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const listRef = useRef<FlatList<UiMessage>>(null);
  const keyboardOffsetHeight = useKeyboardOffsetHeight();

  const [sessionId, setSessionId] = useState<string>(() => {
    const existing = storage.getString(SESSION_KEY);
    if (existing) return existing;
    const next = `metai_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    storage.set(SESSION_KEY, next);
    return next;
  });

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [quickActions, setQuickActions] = useState<IQuickAction[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);

  const baseQuestions = useMemo(
    () => [
      t('profile.metAI_q_orders') || 'Where is my order?',
      t('profile.metAI_q_refund') || 'How do I get a refund?',
      t('profile.metAI_q_account') || 'Help with my account',
      t('profile.metAI_q_support') || 'Contact support',
    ],
    [t],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { flex: 1 },
        listContent: { padding: 12, paddingBottom: 16 },
        bubble: {
          maxWidth: '86%',
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 14,
          marginBottom: 8,
          borderWidth: 1,
        },
        userBubble: {
          alignSelf: 'flex-end',
          backgroundColor: Colors.secondary,
          borderColor: Colors.secondary,
          borderBottomRightRadius: 4,
        },
        botBubble: {
          alignSelf: 'flex-start',
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderBottomLeftRadius: 4,
        },
        userText: {
          color: '#fff',
          fontFamily: Fonts.Regular,
          fontSize: RFValue(11),
        },
        botText: {
          color: colors.text,
          fontFamily: Fonts.Regular,
          fontSize: RFValue(11),
        },
        timeText: {
          marginTop: 6,
          fontSize: RFValue(8),
          fontFamily: Fonts.Regular,
          opacity: 0.7,
        },
        actionsContainer: {
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 6,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
        actionsRow: { flexDirection: 'row', gap: 8 },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.cardBackground,
        },
        chipText: {
          fontSize: RFValue(9),
          fontFamily: Fonts.Medium,
          color: colors.text,
        },
        inputBar: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.cardBackground,
          gap: 8,
        },
        input: {
          flex: 1,
          minHeight: 44,
          maxHeight: 120,
          backgroundColor: colors.background,
          borderRadius: 24,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.text,
          fontFamily: Fonts.Regular,
          fontSize: RFValue(11),
        },
        sendBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: Colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        headerIconBtn: { paddingHorizontal: 8, paddingVertical: 6 },
      }),
    [colors],
  );

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const mapHistoryToUi = (history: ISupportChatMessage[]): UiMessage[] => {
    return history
      .map((m) => ({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.message,
        createdAt: m.createdAt,
      }))
      .filter((m) => m.text);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [actions, history] = await Promise.all([
        getSupportQuickActions().catch(() => []),
        getSupportChatHistory(sessionId).catch(() => []),
      ]);
      setQuickActions(actions || []);
      setMessages(mapHistoryToUi(history || []));
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appendMessage = (m: UiMessage) => {
    setMessages((prev) => [...prev, m]);
  };

  const getGreetingReply = (text: string): string | null => {
    const s = text.trim().toLowerCase();
    if (!s) return null;
    // Basic greeting detection
    if (
      s === 'hi' ||
      s === 'hello' ||
      s === 'hey' ||
      s === 'hii' ||
      s === 'hiii' ||
      s === 'helo' ||
      s === 'good morning' ||
      s === 'good afternoon' ||
      s === 'good evening'
    ) {
      return (
        t('profile.metAI_greeting') ||
        "Hi! I'm MetAI. Tell me what you need help with—or tap a question above."
      );
    }
    return null;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setInput('');
    const now = new Date().toISOString();
    appendMessage({ id: `u_${Date.now()}`, role: 'user', text: trimmed, createdAt: now });
    scrollToBottom();

    try {
      const greeting = getGreetingReply(trimmed);
      if (greeting) {
        appendMessage({
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: greeting,
          createdAt: new Date().toISOString(),
        });
        scrollToBottom();
        return;
      }

      const res = await sendSupportChatMessage(trimmed, sessionId);
      if (res.sessionId && res.sessionId !== sessionId) {
        setSessionId(res.sessionId);
        storage.set(SESSION_KEY, res.sessionId);
      }
      appendMessage({
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: res.reply || (t('profile.metAI_noResponse') || 'I couldn’t generate a response. Please try again.'),
        createdAt: new Date().toISOString(),
      });
      scrollToBottom();
    } catch (e: any) {
      appendMessage({
        id: `a_err_${Date.now()}`,
        role: 'assistant',
        text: e?.response?.data?.message || e?.message || (t('profile.metAI_error') || 'Something went wrong. Please try again.'),
        createdAt: new Date().toISOString(),
      });
    } finally {
      setSending(false);
    }
  };

  const onQuickActionPress = async (a: IQuickAction) => {
    if (!a?.actionType) return;
    setLoadingActions(true);
    try {
      const now = new Date().toISOString();
      appendMessage({ id: `u_${Date.now()}`, role: 'user', text: a.title, createdAt: now });
      scrollToBottom();

      const res = await handleSupportQuickAction(a.actionType, a.actionData, sessionId);
      if (res.sessionId && res.sessionId !== sessionId) {
        setSessionId(res.sessionId);
        storage.set(SESSION_KEY, res.sessionId);
      }
      appendMessage({
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: res.reply || '',
        createdAt: new Date().toISOString(),
      });
      scrollToBottom();
    } catch (e: any) {
      appendMessage({
        id: `a_err_${Date.now()}`,
        role: 'assistant',
        text: e?.response?.data?.message || e?.message || (t('profile.metAI_error') || 'Something went wrong. Please try again.'),
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoadingActions(false);
    }
  };

  const clearHistory = async () => {
    setLoading(true);
    try {
      await clearSupportChatHistory(sessionId);
      setMessages([]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMsg = ({ item }: { item: UiMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <CustomText style={isUser ? styles.userText : styles.botText}>{item.text}</CustomText>
        <CustomText
          style={[
            styles.timeText,
            { color: isUser ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
          ]}>
          {formatTime(item.createdAt)}
        </CustomText>
      </View>
    );
  };

  const headerRight = (
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.headerIconBtn} onPress={loadAll} disabled={loading || sending}>
        <Icon name="refresh" size={RFValue(16)} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIconBtn} onPress={clearHistory} disabled={loading || sending}>
        <Icon name="trash-outline" size={RFValue(16)} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <CustomHeader title="MetAI" rightComponent={headerRight} />

      <View style={styles.actionsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // Force left-to-right chip scroll even when app is RTL
          style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
          contentContainerStyle={styles.actionsRow}>
          {(quickActions?.length > 0 ? quickActions : []).map((a) => (
            <TouchableOpacity
              key={`${a.actionType}_${a.title}`}
              style={styles.chip}
              onPress={() => onQuickActionPress(a)}
              disabled={sending || loadingActions}
              activeOpacity={0.8}>
              <View style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
                <CustomText style={styles.chipText}>{a.title}</CustomText>
              </View>
            </TouchableOpacity>
          ))}

          {(!quickActions || quickActions.length === 0) &&
            baseQuestions.map((title) => (
              <TouchableOpacity
                key={title}
                style={styles.chip}
                onPress={() => send(title)}
                disabled={sending || loadingActions}
                activeOpacity={0.8}>
                <View style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
                  <CustomText style={styles.chipText}>{title}</CustomText>
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={[styles.content, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMsg}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={{ paddingTop: 20 }}>
              <CustomText style={{ color: colors.textSecondary, textAlign: 'center', fontFamily: Fonts.Medium }}>
                {t('profile.metAI_start') || 'Ask MetAI anything about your orders, services, or account.'}
              </CustomText>
            </View>
          }
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: 10 + (keyboardOffsetHeight || 0) }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t('profile.metAI_placeholder') || 'Type your message…'}
          placeholderTextColor={colors.disabled}
          multiline
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => send(input)}
          disabled={sending || !input.trim()}
          activeOpacity={0.85}>
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={RFValue(16)} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default MetAIChatScreen;

