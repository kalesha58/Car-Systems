import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import type { Conversation } from '../../types/chat';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ConversationCard({
  conversation,
  currentUserId,
  onPress,
  onPin,
  onMute,
  onArchive,
  onDelete,
}: ConversationCardProps) {
  const colors = useColors();
  const isPinned = conversation.pinned?.[currentUserId];
  const isMuted = conversation.muted?.[currentUserId];
  const isArchived = conversation.archived?.[currentUserId];
  const unreadCount = conversation.unreadCounts?.[currentUserId] || 0;

  const actionsCount = [onPin, onMute, onArchive, onDelete].filter(Boolean).length;
  const actionButtonWidth = 70;
  const actionsWidth = actionsCount * actionButtonWidth;

  const scrollViewRef = useRef<ScrollView>(null);

  // Format message timestamp
  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const displayName = conversation.type === 'group' 
    ? (conversation as any).name || 'Group Chat' 
    : conversation.otherParticipantName || 'User';

  const displayAvatar = conversation.type === 'group'
    ? (conversation as any).image
    : conversation.otherParticipantAvatar;

  const isOnline = conversation.type !== 'group' && conversation.isOtherParticipantOnline;
  const isTyping = conversation.type !== 'group' && conversation.isOtherParticipantTyping;

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToOffsets={[0, actionsWidth]}
      snapToEnd={false}
      decelerationRate="fast"
      disableIntervalMomentum={true}
      bounces={true}
      contentContainerStyle={{ width: SCREEN_WIDTH + actionsWidth }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            width: SCREEN_WIDTH,
            backgroundColor: pressed ? colors.muted : colors.card,
            borderBottomColor: colors.border,
          },
          isPinned && { backgroundColor: `${colors.primary}08` }
        ]}
        onPress={onPress}
      >
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather
                name={conversation.type === 'group' ? 'users' : 'user'}
                size={20}
                color={colors.textSecondary}
              />
            </View>
          )}
          {isOnline && <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />}
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.displayName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {conversation.isVerifiedDealer && (
                <View style={[styles.badge, { backgroundColor: `${colors.success}15` }]}>
                  <Feather name="check-circle" size={12} color={colors.success} />
                </View>
              )}
              {isPinned && <Feather name="pin" size={12} color={colors.textTertiary} style={styles.metaIcon} />}
              {isMuted && <Feather name="bell-off" size={12} color={colors.textTertiary} style={styles.metaIcon} />}
            </View>
            <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
              {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
            </Text>
          </View>

          <View style={styles.messageRow}>
            {isTyping ? (
              <Text style={[styles.typingText, { color: colors.primary }]} numberOfLines={1}>
                Typing...
              </Text>
            ) : (
              <Text
                style={[
                  styles.lastMessage,
                  { color: colors.textSecondary },
                  unreadCount > 0 && { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
                ]}
                numberOfLines={1}
              >
                {conversation.lastMessage?.text || 'No messages yet'}
              </Text>
            )}

            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCountText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      <View style={[styles.actionsContainer, { width: actionsWidth }]}>
        {onPin && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.info, width: actionButtonWidth }]}
            onPress={() => {
              onPin();
              scrollViewRef.current?.scrollTo({ x: 0, animated: true });
            }}
          >
            <Feather name="pin" size={18} color="#fff" />
            <Text style={styles.actionText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
          </Pressable>
        )}
        {onMute && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.warning, width: actionButtonWidth }]}
            onPress={() => {
              onMute();
              scrollViewRef.current?.scrollTo({ x: 0, animated: true });
            }}
          >
            <Feather name={isMuted ? 'bell' : 'bell-off'} size={18} color="#fff" />
            <Text style={styles.actionText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </Pressable>
        )}
        {onArchive && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.textSecondary, width: actionButtonWidth }]}
            onPress={() => {
              onArchive();
              scrollViewRef.current?.scrollTo({ x: 0, animated: true });
            }}
          >
            <Feather name="archive" size={18} color="#fff" />
            <Text style={styles.actionText}>{isArchived ? 'Unarchive' : 'Archive'}</Text>
          </Pressable>
        )}
        {onDelete && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.destructive, width: actionButtonWidth }]}
            onPress={() => {
              onDelete();
              scrollViewRef.current?.scrollTo({ x: 0, animated: true });
            }}
          >
            <Feather name="trash-2" size={18} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  displayName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    maxWidth: '75%',
  },
  badge: {
    padding: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaIcon: {
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    marginRight: 12,
  },
  typingText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontStyle: 'italic',
    flex: 1,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadCountText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
});
