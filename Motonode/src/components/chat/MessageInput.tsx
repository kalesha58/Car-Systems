import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Pressable,
  Text,
  Platform,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { AttachmentSheet } from './AttachmentSheet';
import { VoiceRecorder } from './VoiceRecorder';
import type { Message } from '../../types/chat';

const QUICK_EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🔥', '🚗', '🏍️', '✅', '🎉', '❤️', '👋'];

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onSendImage: (uri: string) => void;
  onSendVoice: (uri: string) => void;
  onSendDocument: (uri: string, name: string) => void;
  onSendLocation: (latitude: number, longitude: number, address: string) => void;
  onTypingStatusChange?: (isTyping: boolean) => void;
  replyTo?: Message['replyTo'] | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  onSendMessage,
  onSendImage,
  onSendVoice,
  onSendDocument,
  onSendLocation,
  onTypingStatusChange,
  replyTo,
  onCancelReply,
}: MessageInputProps) {
  const colors = useColors();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle typing state callbacks
  const handleTextChange = (val: string) => {
    setText(val);

    if (onTypingStatusChange) {
      onTypingStatusChange(val.length > 0);

      // Reset typing status after 2 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTypingStatusChange(false);
      }, 2000);
    }
  };

  // Clean up typing timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    setEmojiPickerVisible(false);
    if (onTypingStatusChange) {
      onTypingStatusChange(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    handleTextChange(text + emoji);
  };

  if (isRecording) {
    return (
      <VoiceRecorder
        onRecordingComplete={(uri) => {
          setIsRecording(false);
          onSendVoice(uri);
        }}
        onCancel={() => setIsRecording(false)}
      />
    );
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Reply Preview Above Composer */}
      {replyTo && (
        <View style={[styles.replyContainer, { backgroundColor: colors.muted, borderLeftColor: colors.primary }]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replyUser, { color: colors.primary }]}>
              Replying to {replyTo.senderName}
            </Text>
            <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} style={styles.replyCloseBtn}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}

      {emojiPickerVisible && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emojiRow}
          style={[styles.emojiPicker, { borderBottomColor: colors.border }]}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => insertEmoji(emoji)}
              style={styles.emojiChip}
              hitSlop={4}
            >
              <Text style={styles.emojiChipText}>{emoji}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input row */}
      <View style={styles.container}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.muted }]}
          onPress={() => {
            setEmojiPickerVisible(false);
            setSheetVisible(true);
          }}
        >
          <Feather name="plus" size={20} color={colors.textSecondary} />
        </Pressable>

        <View style={[styles.inputWrapper, { backgroundColor: colors.muted }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />
          <Pressable
            style={styles.emojiBtn}
            onPress={() => setEmojiPickerVisible((prev) => !prev)}
            hitSlop={6}
          >
            <Feather
              name="smile"
              size={20}
              color={emojiPickerVisible ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        </View>

        {text.trim().length > 0 ? (
          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={handleSend}
          >
            <Feather name="send" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            onPress={() => {
              setEmojiPickerVisible(false);
              setIsRecording(true);
            }}
          >
            <Feather name="mic" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <AttachmentSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelectImage={onSendImage}
        onSelectDocument={onSendDocument}
        onSelectLocation={onSendLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyUser: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
  },
  replyCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emojiPicker: {
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  emojiChip: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChipText: {
    fontSize: 22,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    paddingRight: 4,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
