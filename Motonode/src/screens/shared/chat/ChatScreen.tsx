import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Modal,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useChat } from '@context/ChatContext';
import { ChatBubble, MessageInput, TypingIndicator, DealerHeader, GroupHeader } from '@components/chat/index';
import { CustomerStackRoutes } from '@constants/routes';
import { lightHaptic } from '@utils/haptics';
import auth from '@react-native-firebase/auth';
import type { Message } from '../../../types/chat';

export function ChatScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    activeConversation,
    activeMessages,
    loadingMessages,
    sendMessage,
    sendImage,
    sendVoice,
    sendDocument,
    updateTypingStatus,
    leaveGroup,
  } = useChat() as any;

  const flatListRef = useRef<FlatList>(null);
  
  // Local state for replies and menu overlays
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Group messages by date
  const chatItems = useMemo(() => {
    const items: any[] = [];
    let lastDateStr = '';

    activeMessages.forEach((msg: Message) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toDateString();

      if (dateStr !== lastDateStr) {
        items.push({
          id: `date-${dateStr}`,
          type: 'date',
          date: msgDate,
        });
        lastDateStr = dateStr;
      }
      items.push({
        ...msg,
        type: 'message',
      });
    });

    return items;
  }, [activeMessages]);

  // Scroll to bottom when list grows
  useEffect(() => {
    if (activeMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [activeMessages.length]);

  const handleSendText = (text: string) => {
    const replyPayload = replyMessage
      ? {
          messageId: replyMessage.id,
          senderName: replyMessage.senderId === auth().currentUser?.uid ? 'You' : (activeConversation?.otherParticipantName || 'User'),
          messageType: replyMessage.messageType,
          text: replyMessage.text || `[${replyMessage.messageType}]`,
        }
      : undefined;

    sendMessage(text, replyPayload);
    setReplyMessage(null);
  };

  const handleMessageLongPress = (message: Message) => {
    lightHaptic();
    setSelectedMessage(message);
    setMenuVisible(true);
  };

  const handleReplyAction = () => {
    setMenuVisible(false);
    if (selectedMessage) {
      setReplyMessage(selectedMessage);
    }
  };

  const handleForwardAction = () => {
    setMenuVisible(false);
    Alert.alert('Forward Message', 'Forwarding functionality placeholder.');
  };

  const handleDeleteAction = () => {
    setMenuVisible(false);
    Alert.alert('Delete Message', 'Message deleted successfully.');
  };

  const renderDateSeparator = (date: Date) => {
    const now = new Date();
    let dateText = '';

    if (date.toDateString() === now.toDateString()) {
      dateText = 'Today';
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        dateText = 'Yesterday';
      } else {
        dateText = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      }
    }

    return (
      <View style={styles.dateSeparator}>
        <View style={[styles.dateSeparatorBg, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateText}</Text>
        </View>
      </View>
    );
  };

  // Header selectors based on active conversation type
  const renderHeader = () => {
    if (!activeConversation) return null;

    if (activeConversation.type === 'dealer') {
      return (
        <DealerHeader
          name={activeConversation.otherParticipantName}
          avatar={activeConversation.otherParticipantAvatar}
          online={activeConversation.isOtherParticipantOnline}
          onBack={() => navigation.goBack()}
          onBookService={() => navigation.navigate(CustomerStackRoutes.ServiceBookingDateTime, { serviceId: 'default' })}
          onBookTestDrive={() => Alert.alert('Test Drive', 'Redirecting to booking...')}
          onViewProducts={() => navigation.navigate(CustomerStackRoutes.DealerStore, { id: activeConversation.otherParticipantId || 'dealer_1' })}
          onViewStore={() => navigation.navigate(CustomerStackRoutes.DealerStore, { id: activeConversation.otherParticipantId || 'dealer_1' })}
          onAskAI={() => navigation.navigate(CustomerStackRoutes.AiAssistant)}
        />
      );
    }

    if (activeConversation.type === 'group') {
      return (
        <GroupHeader
          name={activeConversation.name || 'Group Chat'}
          avatar={activeConversation.image}
          memberCount={activeConversation.participants.length}
          onBack={() => navigation.goBack()}
          onHeaderPress={() => navigation.navigate(CustomerStackRoutes.GroupInfo)}
          onMenu={() => {
            Alert.alert('Group Actions', 'Leave Group?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => {
                  leaveGroup(activeConversation.id);
                  navigation.goBack();
                }
              }
            ]);
          }}
        />
      );
    }

    // Default Private Header
    return (
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerProfile}>
          {activeConversation.otherParticipantAvatar ? (
            <Image source={{ uri: activeConversation.otherParticipantAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather name="user" size={16} color={colors.textSecondary} />
            </View>
          )}
          <View>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>
              {activeConversation.otherParticipantName}
            </Text>
            <Text style={[styles.headerStatus, { color: activeConversation.isOtherParticipantOnline ? colors.success : colors.textTertiary }]}>
              {activeConversation.isOtherParticipantOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => Alert.alert('Voice Call', 'Placing voice call...')}>
            <Feather name="phone" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => Alert.alert('Video Call', 'Placing video call...')}>
            <Feather name="video" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    );
  };

  if (!activeConversation) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}

      {loadingMessages && activeMessages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'date') {
              return renderDateSeparator(item.date);
            }
            return (
              <ChatBubble
                message={item}
                currentUserId={auth().currentUser?.uid || ''}
                onLongPress={() => handleMessageLongPress(item)}
              />
            );
          }}
          ListFooterComponent={
            activeConversation.isOtherParticipantTyping ? <TypingIndicator /> : null
          }
        />
      )}

      {/* Input keyboard container */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <MessageInput
          onSendMessage={handleSendText}
          onSendImage={sendImage}
          onSendVoice={sendVoice}
          onSendDocument={sendDocument}
          onSendLocation={(lat, lng, addr) => {
            sendMessage(`Shared location: ${addr}`, undefined);
          }}
          onTypingStatusChange={updateTypingStatus}
          replyTo={
            replyMessage
              ? {
                  messageId: replyMessage.id,
                  senderName: replyMessage.senderId === auth().currentUser?.uid ? 'You' : (activeConversation.otherParticipantName || 'User'),
                  messageType: replyMessage.messageType,
                  text: replyMessage.text || `[${replyMessage.messageType}]`,
                }
              : null
          }
          onCancelReply={() => setReplyMessage(null)}
        />
      </KeyboardAvoidingView>

      {/* Long-Press Action Modal Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.modalMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textTertiary }]}>Message Options</Text>
            
            <Pressable style={styles.modalItem} onPress={handleReplyAction}>
              <Feather name="corner-up-left" size={18} color={colors.textPrimary} />
              <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>Reply</Text>
            </Pressable>

            <Pressable style={styles.modalItem} onPress={handleForwardAction}>
              <Feather name="corner-up-right" size={18} color={colors.textPrimary} />
              <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>Forward</Text>
            </Pressable>

            <Pressable style={styles.modalItem} onPress={handleDeleteAction}>
              <Feather name="trash-2" size={18} color={colors.destructive} />
              <Text style={[styles.modalItemText, { color: colors.destructive }]}>Delete for everyone</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSeparatorBg: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  // Default Header styling
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    paddingTop: Platform.OS === 'ios' ? 44 : 10,
  },
  headerBtn: {
    padding: 6,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  headerStatus: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Action modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMenu: {
    width: 260,
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    gap: 14,
  },
  modalTitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  modalItemText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
