import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {useAuthStore} from '@state/authStore';
import {
  getChatById,
  getChatMessages,
  sendMessage,
  sendImageMessage,
  followGroupChat,
  startLiveLocation,
  stopLiveLocation,
} from '@service/chatService';
import {
  initializeSocket,
  joinChatRoom,
  leaveChatRoom,
  onNewMessage,
  offNewMessage,
  onUserTyping,
  offUserTyping,
  emitTyping,
  emitStopTyping,
} from '@service/socketService';
import {IChat, IMessage} from '../../types/chat';
import {useToast} from '@hooks/useToast';

const ChatMessageScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {chatId} = route.params as {chatId: string};
  const {user} = useAuthStore();
  const {colors} = useTheme();
  const {showError, showSuccess} = useToast();

  const [chat, setChat] = useState<IChat | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLiveLocationActive, setIsLiveLocationActive] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeSocket();
    loadChat();
    loadMessages();

    return () => {
      if (chatId) {
        leaveChatRoom(chatId);
        offNewMessage();
        offUserTyping();
      }
    };
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      joinChatRoom(chatId);
      onNewMessage((message: IMessage) => {
        if (message.chatId === chatId) {
          setMessages(prev => {
            if (prev.find(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
          scrollToBottom();
        }
      });

      onUserTyping((data: {chatId: string; userId: string; userName?: string}) => {
        if (data.chatId === chatId && data.userId !== user?.id) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }, 3000);
        }
      });
    }
  }, [chatId, user?.id]);

  const loadChat = async () => {
    try {
      const data = await getChatById(chatId);
      setChat(data);
      navigation.setOptions({
        headerTitle: data.type === 'group' ? data.groupName || 'Group' : data.participantNames?.find(n => n !== user?.name) || 'Chat',
      });
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load chat');
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getChatMessages(chatId, 50);
      setMessages(data);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await sendMessage(chatId, {text, messageType: 'text'});
      emitStopTyping(chatId, user?.id || '');
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to send message');
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      async (response: ImagePickerResponse) => {
        if (response.didCancel || !response.assets?.[0]) return;

        const imageUri = response.assets[0].uri;
        if (!imageUri) return;

        setSending(true);
        try {
          await sendImageMessage(chatId, imageUri);
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Failed to send image');
        } finally {
          setSending(false);
        }
      },
    );
  };

  const handleShareLocation = async () => {
    try {
      Geolocation.getCurrentPosition(
        async position => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          await sendMessage(chatId, {
            text: '📍 Location',
            messageType: 'location',
            location,
          });
        },
        error => {
          showToast('Failed to get location', 'error');
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } catch (error) {
      showError('Failed to share location');
    }
  };

  const handleLiveLocation = async () => {
    if (isLiveLocationActive) {
      try {
        await stopLiveLocation(chatId);
        setIsLiveLocationActive(false);
        showSuccess('Live location stopped');
      } catch (error: any) {
        showError(error?.response?.data?.message || 'Failed to stop live location');
      }
    } else {
      try {
        Geolocation.getCurrentPosition(
          async position => {
            const coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            await startLiveLocation(chatId, coordinates);
            setIsLiveLocationActive(true);
            showSuccess('Live location started');
          },
          error => {
            showError('Failed to get location');
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      } catch (error) {
        showError('Failed to start live location');
      }
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping(chatId, user?.id || '', user?.name);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(chatId, user?.id || '');
    }, 1000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
  };

  const handleFollowGroup = async () => {
    try {
      await followGroupChat(chatId);
      await loadChat();
      showSuccess('Joined group successfully');
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to join group');
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        messagesContainer: {
          flex: 1,
          padding: 16,
        },
        messageBubble: {
          maxWidth: '75%',
          padding: 12,
          borderRadius: 16,
          marginBottom: 8,
        },
        sentMessage: {
          backgroundColor: colors.secondary,
          alignSelf: 'flex-end',
          borderBottomRightRadius: 4,
        },
        receivedMessage: {
          backgroundColor: colors.cardBackground,
          alignSelf: 'flex-start',
          borderBottomLeftRadius: 4,
        },
        messageText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.white,
        },
        receivedMessageText: {
          color: colors.text,
        },
        messageImage: {
          width: 200,
          height: 200,
          borderRadius: 12,
          marginBottom: 8,
        },
        messageLocation: {
          padding: 12,
          backgroundColor: colors.background,
          borderRadius: 8,
          marginTop: 8,
        },
        locationText: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.text,
        },
        messageTime: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Regular,
          color: 'rgba(255,255,255,0.7)',
          marginTop: 4,
        },
        receivedMessageTime: {
          color: colors.disabled,
        },
        inputContainer: {
          flexDirection: 'row',
          padding: 12,
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
        },
        input: {
          flex: 1,
          backgroundColor: colors.background,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.text,
          marginRight: 8,
          maxHeight: 100,
        },
        sendButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.secondary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        actionButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8,
        },
        typingIndicator: {
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        typingText: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          fontStyle: 'italic',
          color: colors.disabled,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [colors],
  );

  const renderMessage = ({item}: {item: IMessage}) => {
    const isSent = item.from === user?.id;
    const showTime = true;

    return (
      <View
        style={[
          styles.messageBubble,
          isSent ? styles.sentMessage : styles.receivedMessage,
        ]}>
        {item.messageType === 'image' && item.imageUrl && (
          <Image source={{uri: item.imageUrl}} style={styles.messageImage} />
        )}
        {item.messageType === 'location' && item.location && (
          <View style={styles.messageLocation}>
            <Icon name="location" size={RFValue(16)} color={colors.secondary} />
            <CustomText style={styles.locationText}>
              {item.location.address || 'Location shared'}
            </CustomText>
          </View>
        )}
        {item.text && (
          <CustomText
            style={[
              styles.messageText,
              !isSent && styles.receivedMessageText,
            ]}>
            {item.text}
          </CustomText>
        )}
        {showTime && (
          <CustomText
            style={[
              styles.messageTime,
              !isSent && styles.receivedMessageTime,
            ]}>
            {formatTime(item.createdAt)}
          </CustomText>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Chat" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  const headerRight = () => {
    if (chat?.type === 'group') {
      if (chat.canFollow) {
        return (
          <TouchableOpacity onPress={handleFollowGroup} style={{marginRight: 16}}>
            <CustomText style={{color: colors.secondary, fontFamily: Fonts.SemiBold}}>
              Follow
            </CustomText>
          </TouchableOpacity>
        );
      }
      // Add edit button logic here if user is owner
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <CustomHeader
        title={
          chat?.type === 'group'
            ? chat.groupName || 'Group'
            : chat?.participantNames?.find(n => n !== user?.name) || 'Chat'
        }
        rightComponent={headerRight()}
      />
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          typingUsers.size > 0 ? (
            <View style={styles.typingIndicator}>
              <CustomText style={styles.typingText}>Someone is typing...</CustomText>
            </View>
          ) : null
        }
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleImagePicker}
          activeOpacity={0.7}>
          <Icon name="image-outline" size={RFValue(24)} color={colors.text} />
        </TouchableOpacity>
        {chat?.type === 'group' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLiveLocation}
            activeOpacity={0.7}>
            <Icon
              name={isLiveLocationActive ? 'location' : 'location-outline'}
              size={RFValue(24)}
              color={isLiveLocationActive ? colors.secondary : colors.text}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShareLocation}
          activeOpacity={0.7}>
          <Icon name="navigate-outline" size={RFValue(24)} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={text => {
            setMessageText(text);
            handleTyping();
          }}
          placeholder="Type a message..."
          placeholderTextColor={colors.disabled}
          multiline
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={sending || !messageText.trim()}
          activeOpacity={0.7}>
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name="send" size={RFValue(20)} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatMessageScreen;

