import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import type { Message } from '../../types/chat';

interface ChatBubbleProps {
  message: Message;
  currentUserId: string;
  onLongPress?: () => void;
  onSwipeToReply?: () => void;
  onReactionSelected?: (reaction: string) => void;
}

export function ChatBubble({
  message,
  currentUserId,
  onLongPress,
}: ChatBubbleProps) {
  const colors = useColors();
  const isMe = message.senderId === currentUserId;
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Status Ticks
  const renderStatus = () => {
    if (!isMe) return null;
    switch (message.status) {
      case 'seen':
        return <Feather name="check-all" size={14} color="#38bdf8" style={styles.tickIcon} />;
      case 'delivered':
        return <Feather name="check-all" size={14} color={colors.textTertiary} style={styles.tickIcon} />;
      case 'sent':
      default:
        return <Feather name="check" size={14} color={colors.textTertiary} style={styles.tickIcon} />;
    }
  };

  // Open Location on Native Maps
  const openLocation = () => {
    if (!message.location) return;
    const { latitude, longitude, address } = message.location;
    const label = encodeURIComponent(address || 'Shared Location');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    Linking.openURL(url).catch(err => console.error("Couldn't open maps", err));
  };

  // Render message body content based on type
  const renderContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <View style={styles.imageWrapper}>
            {message.image ? (
              <Image source={{ uri: message.image }} style={styles.bubbleImage} resizeMode="cover" />
            ) : (
              <View style={styles.loadingFile}>
                <Feather name="image" size={32} color={colors.textTertiary} />
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Loading Image...</Text>
              </View>
            )}
          </View>
        );

      case 'voice':
        return (
          <View style={styles.voiceContainer}>
            <Pressable
              style={[styles.voicePlayBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.muted }]}
              onPress={() => setIsPlayingVoice(!isPlayingVoice)}
            >
              <Feather name={isPlayingVoice ? 'pause' : 'play'} size={18} color={isMe ? '#fff' : colors.primary} />
            </Pressable>
            <View style={styles.voiceProgressContainer}>
              <View style={[styles.voiceProgressLine, { backgroundColor: isMe ? 'rgba(255,255,255,0.3)' : colors.border }]}>
                <View style={[styles.voiceProgressFill, { width: isPlayingVoice ? '60%' : '10%', backgroundColor: isMe ? '#fff' : colors.primary }]} />
              </View>
              <Text style={[styles.voiceDuration, { color: isMe ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                {isPlayingVoice ? '0:04' : '0:12'}
              </Text>
            </View>
          </View>
        );

      case 'pdf':
        return (
          <Pressable
            style={[styles.documentContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : colors.muted }]}
            onPress={() => message.pdf && Linking.openURL(message.pdf)}
          >
            <View style={[styles.docIconContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.border }]}>
              <Feather name="file-text" size={20} color={isMe ? '#fff' : colors.primary} />
            </View>
            <View style={styles.docDetails}>
              <Text
                style={[styles.docName, { color: isMe ? '#fff' : colors.textPrimary }]}
                numberOfLines={1}
              >
                {message.attachments?.[0]?.name || 'Document.pdf'}
              </Text>
              <Text style={[styles.docSize, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                {message.attachments?.[0]?.size ? `${(message.attachments[0].size / 1024 / 1024).toFixed(2)} MB` : '1.2 MB'}
              </Text>
            </View>
            <Feather name="download" size={16} color={isMe ? '#fff' : colors.textSecondary} />
          </Pressable>
        );

      case 'location':
        return (
          <Pressable style={styles.locationContainer} onPress={openLocation}>
            <View style={[styles.locationMapPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather name="map-pin" size={28} color={colors.primary} />
              <Text style={[styles.locationMapText, { color: colors.textSecondary }]}>Shared Location</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={[styles.locationTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {message.location?.address || 'View location on Maps'}
              </Text>
              <Text style={[styles.locationSubtitle, { color: colors.textTertiary }]}>
                {message.location?.latitude.toFixed(4)}, {message.location?.longitude.toFixed(4)}
              </Text>
            </View>
          </Pressable>
        );

      case 'text':
      default:
        return (
          <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.textPrimary }]}>
            {message.text}
          </Text>
        );
    }
  };

  const bubbleBgColor = isMe ? colors.primary : colors.card;
  const alignSelf = isMe ? 'flex-end' : 'flex-start';

  return (
    <Pressable
      style={[
        styles.container,
        { alignSelf },
        isMe ? styles.myMessageRow : styles.otherMessageRow,
      ]}
      onLongPress={onLongPress}
    >
      {/* Reply To Preview Box */}
      {message.replyTo && (
        <View
          style={[
            styles.replyBox,
            {
              backgroundColor: isMe ? 'rgba(255,255,255,0.12)' : colors.muted,
              borderLeftColor: isMe ? '#fff' : colors.primary,
            },
          ]}
        >
          <Text style={[styles.replySender, { color: isMe ? '#fff' : colors.primary }]} numberOfLines={1}>
            {message.replyTo.senderName}
          </Text>
          <Text style={[styles.replyText, { color: isMe ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]} numberOfLines={1}>
            {message.replyTo.text}
          </Text>
        </View>
      )}

      {/* Main Content Bubble */}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBgColor,
            borderBottomRightRadius: isMe ? 4 : 18,
            borderBottomLeftRadius: isMe ? 18 : 4,
          },
          isMe && styles.myBubbleShadow,
          !isMe && { borderColor: colors.border, borderWidth: 0.5 },
        ]}
      >
        {renderContent()}

        {/* Footer Meta Row */}
        <View style={styles.metaRow}>
          <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
            {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {renderStatus()}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '82%',
    paddingHorizontal: 12,
  },
  myMessageRow: {
    paddingLeft: 40,
  },
  otherMessageRow: {
    paddingRight: 40,
  },
  bubble: {
    borderRadius: 18,
    padding: 10,
    position: 'relative',
  },
  myBubbleShadow: {
    shadowColor: '#E60012',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  replyBox: {
    borderLeftWidth: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  replySender: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  tickIcon: {
    marginLeft: 2,
  },
  // Media Styling
  imageWrapper: {
    width: 200,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
  },
  loadingFile: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Voice note Styling
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    paddingVertical: 4,
  },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  voiceProgressContainer: {
    flex: 1,
  },
  voiceProgressLine: {
    height: 3,
    borderRadius: 1.5,
    width: '100%',
    position: 'relative',
    marginBottom: 4,
  },
  voiceProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  // Document Styling
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    width: 220,
  },
  docIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  docDetails: {
    flex: 1,
    marginRight: 8,
  },
  docName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  docSize: {
    fontSize: 11,
  },
  // Location Styling
  locationContainer: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationMapPlaceholder: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  locationMapText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  locationDetails: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  locationTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  locationSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
