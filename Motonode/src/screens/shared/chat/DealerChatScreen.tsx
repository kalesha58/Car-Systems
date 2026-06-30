import React, { useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useChat } from '@context/ChatContext';
import { ChatBubble, MessageInput, TypingIndicator, DealerHeader } from '@components/chat/index';
import { CustomerStackRoutes } from '@constants/routes';
import auth from '@react-native-firebase/auth';
import type { Message } from '../../../types/chat';

export function DealerChatScreen() {
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
  } = useChat() as any;

  const flatListRef = useRef<FlatList>(null);

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

  useEffect(() => {
    if (activeMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [activeMessages.length]);

  const handleSendText = (text: string) => {
    sendMessage(text);
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

  // Reusable Dealer Profile Card inside the message list (renders at the top)
  const renderDealerProfileCard = () => {
    if (!activeConversation) return null;
    return (
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profileRow}>
          {activeConversation.otherParticipantAvatar ? (
            <Image source={{ uri: activeConversation.otherParticipantAvatar }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather name="briefcase" size={24} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.profileDetails}>
            <View style={styles.titleRow}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {activeConversation.otherParticipantName}
              </Text>
              <Feather name="check-circle" size={14} color={colors.success} style={styles.metaIcon} />
            </View>
            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>Verified Motonode Partner</Text>
            
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color={colors.starActive} />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>4.8</Text>
              <Text style={[styles.reviewsCount, { color: colors.textTertiary }]}> (142 reviews)</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.hoursRow}>
          <Feather name="clock" size={14} color={colors.textTertiary} />
          <Text style={[styles.hoursText, { color: colors.textSecondary }]}>
            Business Hours: 9:00 AM - 7:00 PM (Mon - Sat)
          </Text>
        </View>

        <View style={styles.addressRow}>
          <Feather name="map-pin" size={14} color={colors.textTertiary} />
          <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
            102, Residency Rd, Ashok Nagar, Bengaluru, KA
          </Text>
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
          ListHeaderComponent={renderDealerProfileCard}
          renderItem={({ item }) => {
            if (item.type === 'date') {
              return renderDateSeparator(item.date);
            }
            return (
              <ChatBubble
                message={item}
                currentUserId={auth().currentUser?.uid || ''}
              />
            );
          }}
          ListFooterComponent={
            activeConversation.isOtherParticipantTyping ? <TypingIndicator /> : null
          }
        />
      )}

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
  // Profile Card styling
  profileCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
  },
  profileAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  metaIcon: {
    marginLeft: 6,
  },
  profileRole: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
  },
  reviewsCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 0.5,
    marginVertical: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  hoursText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
