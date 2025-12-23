import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  PermissionsAndroid,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import {
  getChatById,
  getChatMessages,
  sendMessage,
  sendImageMessage,
  followGroupChat,
  startLiveLocation,
  stopLiveLocation,
} from '@service/chatService';
import { getPendingRequestCount } from '@service/chatService';
import {
  initializeSocket,
  joinChatRoom,
  leaveChatRoom,
  onNewMessage,
  offNewMessage,
  onUserTyping,
  offUserTyping,
  onUserStoppedTyping,
  offUserStoppedTyping,
  emitTyping,
  emitStopTyping,
} from '@service/socketService';
import { IChat, IMessage } from '../../types/chat';
import { useToast } from '@hooks/useToast';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import AttachmentModal from '@components/common/AttachmentModal';

const ChatMessageScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params as { chatId: string };
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { showError, showSuccess } = useToast();

  const [chat, setChat] = useState<IChat | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLiveLocationActive, setIsLiveLocationActive] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const keyboardOffsetHeight = useKeyboardOffsetHeight();

  useEffect(() => {
    initializeSocket();
    loadChat();
    loadMessages();
  }, [chatId]);

  // Refresh pending count when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (chat?.type === 'group' && chat.isOwner && chat.groupId) {
        loadPendingRequestCount(chat.groupId);
      }
    });
    return unsubscribe;
  }, [navigation, chat]);

  // Socket event listeners - consolidated into single useEffect with proper cleanup
  useEffect(() => {
    if (!chatId || !user?.id) return;

    // Initialize socket
    const socketInstance = initializeSocket();
    
    // Handle new messages
    const handleNewMessage = (message: IMessage) => {
      console.log('[ChatMessageScreen] Received new message:', message);
      if (message.chatId === chatId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m.id === message.id)) {
            console.log('[ChatMessageScreen] Message already exists, skipping:', message.id);
            return prev;
          }
          console.log('[ChatMessageScreen] Adding new message to list');
          return [...prev, message];
        });
        scrollToBottom();
      }
    };

    // Handle typing indicators
    const handleUserTyping = (data: { chatId: string; userId: string; userName?: string }) => {
      console.log('[ChatMessageScreen] User typing:', data);
      if (data.chatId === chatId && data.userId !== user?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(data.userId);
          return newSet;
        });
        
        // Clear existing timeout for this user if any
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Auto-remove typing indicator after 3 seconds if not explicitly stopped
        const timeoutId = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }, 3000);
        
        // Store timeout ID for cleanup
        typingTimeoutRef.current = timeoutId;
      }
    };

    // Handle stopped typing
    const handleUserStoppedTyping = (data: { chatId: string; userId: string }) => {
      console.log('[ChatMessageScreen] User stopped typing:', data);
      if (data.chatId === chatId && data.userId !== user?.id) {
        // Clear timeout when user stops typing
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    // Wait for socket connection before joining room
    const setupConnection = () => {
      if (socketInstance.connected) {
        console.log('[ChatMessageScreen] Socket connected, joining room:', chatId);
        joinChatRoom(chatId);
      } else {
        console.log('[ChatMessageScreen] Socket not connected, waiting...');
        socketInstance.once('connect', () => {
          console.log('[ChatMessageScreen] Socket connected, joining room:', chatId);
          joinChatRoom(chatId);
        });
      }
    };

    // Add event listeners first (they'll work once socket connects)
    onNewMessage(handleNewMessage);
    onUserTyping(handleUserTyping);
    onUserStoppedTyping(handleUserStoppedTyping);

    // Setup connection
    setupConnection();

    // Cleanup function
    return () => {
      console.log('[ChatMessageScreen] Cleaning up socket listeners for chatId:', chatId);
      
      // Clear any pending typing timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Remove event listeners
      offNewMessage();
      offUserTyping();
      offUserStoppedTyping();
      
      // Leave chat room
      leaveChatRoom(chatId);
    };
  }, [chatId, user?.id]);

  const loadChat = async () => {
    try {
      const data = await getChatById(chatId);
      setChat(data);
      navigation.setOptions({
        headerTitle: data.type === 'group' ? data.groupName || 'Group' : data.participantNames?.find(n => n !== user?.name) || 'Chat',
      });

      // Check if user is not a member of a public group
      if (data.type === 'group' && !data.isMember && data.canFollow) {
        Alert.alert(
          'Join Request Required',
          'You must follow this group first to view its messages. Please go back and click the Follow button.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      // Load pending request count if user is owner
      if (data.type === 'group' && data.isOwner && data.groupId) {
        loadPendingRequestCount(data.groupId);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.Response?.ReturnMessage || error?.response?.data?.message || 'Failed to load chat';
      if (errorMessage.includes('must follow') || errorMessage.includes('not a member')) {
        Alert.alert(
          'Access Denied',
          'You must follow this group first to view its messages. Please go back and click the Follow button.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        showError(errorMessage);
      }
    }
  };

  const loadPendingRequestCount = async (groupId: string) => {
    try {
      const count = await getPendingRequestCount(groupId);
      setPendingRequestCount(count);
    } catch (error) {
      // Silently fail - not critical
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getChatMessages(chatId, 50);
      setMessages(data);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.Response?.ReturnMessage || error?.response?.data?.message || 'Failed to load messages';
      if (errorMessage.includes('must follow') || errorMessage.includes('not a member')) {
        Alert.alert(
          'Access Denied',
          'You must follow this group first to view its messages. Please go back and click the Follow button.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        showError(errorMessage);
      }
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
      await sendMessage(chatId, { text, messageType: 'text' });
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

        // Create temporary loading message
        const tempMessage: IMessage & { isUploading?: boolean } = {
          id: `temp-${Date.now()}`,
          chatId,
          from: user?.id || '',
          text: 'Image',
          messageType: 'image',
          imageUrl: imageUri, // Show local image while uploading
          createdAt: new Date().toISOString(),
          isUploading: true, // Custom flag for loading state
        };

        // Add temporary message to UI
        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        setSending(true);
        try {
          await sendImageMessage(chatId, imageUri);
          // Reload messages to get the actual message from server
          await loadMessages();
        } catch (error: any) {
          // Remove temporary message on error
          setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
          showError(error?.response?.data?.message || 'Failed to send image');
        } finally {
          setSending(false);
        }
      },
    );
  };

  const handleCameraCapture = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        cameraType: 'back',
        saveToPhotos: false,
      },
      async (response: ImagePickerResponse) => {
        if (response.didCancel || !response.assets?.[0]) return;

        const imageUri = response.assets[0].uri;
        if (!imageUri) return;

        // Create temporary loading message
        const tempMessage: IMessage & { isUploading?: boolean } = {
          id: `temp-${Date.now()}`,
          chatId,
          from: user?.id || '',
          text: 'Image',
          messageType: 'image',
          imageUrl: imageUri, // Show local image while uploading
          createdAt: new Date().toISOString(),
          isUploading: true, // Custom flag for loading state
        };

        // Add temporary message to UI
        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        setSending(true);
        try {
          await sendImageMessage(chatId, imageUri);
          // Reload messages to get the actual message from server
          await loadMessages();
        } catch (error: any) {
          // Remove temporary message on error
          setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
          showError(error?.response?.data?.message || 'Failed to send image');
        } finally {
          setSending(false);
        }
      },
    );
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to share it in chat.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        showError('Location permission denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleShareLocation = () => {
    (navigation as any).navigate('LocationPicker', {
      onLocationSelect: async (location: { latitude: number; longitude: number }) => {
        // Create temporary loading message
        const tempMessage: IMessage & { isUploading?: boolean } = {
          id: `temp-${Date.now()}`,
          chatId,
          from: user?.id || '',
          text: '📍 Location',
          messageType: 'location',
          location,
          createdAt: new Date().toISOString(),
          isUploading: true, // Custom flag for loading state
        };

        // Add temporary message to UI
        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        setSending(true);
        try {
          await sendMessage(chatId, {
            text: '📍 Location',
            messageType: 'location',
            location,
          });
          // Reload messages to get the actual message from server
          await loadMessages();
        } catch (error: any) {
          // Remove temporary message on error
          setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
          showError(error?.response?.data?.message || 'Failed to send location');
        } finally {
          setSending(false);
        }
      },
    });
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
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

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
            showError('Failed to get location: ' + error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
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
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
          backgroundColor: colors.chatBackground,
        },
        backgroundPattern: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
        },
        messagesContainer: {
          paddingHorizontal: 10,
          paddingTop: 16,
        },
        messageBubble: {
          maxWidth: '80%',
          padding: 6,
          paddingHorizontal: 10,
          borderRadius: 12,
          marginBottom: 4,
          elevation: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 1,
        },
        sentMessage: {
          backgroundColor: colors.secondary,
          alignSelf: 'flex-end',
          borderBottomRightRadius: 2,
          marginLeft: 40,
        },
        receivedMessage: {
          backgroundColor: colors.cardBackground,
          alignSelf: 'flex-start',
          borderBottomLeftRadius: 2,
          marginRight: 40,
        },
        messageText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.white,
          marginBottom: 2,
        },
        receivedMessageText: {
          color: colors.text,
        },
        messageImage: {
          width: 220,
          height: 220,
          borderRadius: 8,
          marginBottom: 4,
        },
        messageLocation: {
          padding: 8,
          backgroundColor: colors.background,
          borderRadius: 8,
          marginTop: 4,
        },
        locationText: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.text,
        },
        messageDataContainer: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          minWidth: 50,
        },
        messageTime: {
          fontSize: RFValue(9),
          fontFamily: Fonts.Regular,
          color: 'rgba(255,255,255,0.7)',
          marginLeft: 4,
          alignSelf: 'flex-end',
        },
        receivedMessageTime: {
          color: colors.disabled,
        },
        senderName: {
          fontSize: RFValue(11),
          fontFamily: Fonts.Medium,
          marginBottom: 2,
        },
        inputContainer: {
          flexDirection: 'row',
          paddingHorizontal: 8,
          paddingVertical: 8,
          backgroundColor: colors.cardBackground,
          alignItems: 'flex-end',
        },
        input: {
          flex: 1,
          backgroundColor: colors.background,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.text,
          marginHorizontal: 8,
          maxHeight: 100,
          minHeight: 40,
        },
        sendButton: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.secondary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        attachButton: {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        },
        emojiButton: {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 4,
        },
        cameraButton: {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
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

  const renderMessage = ({ item }: { item: IMessage }) => {
    const isSent = item.from === user?.id;
    const showTime = true;
    const isGroupChat = chat?.type === 'group';
    const showSenderName = isGroupChat && !isSent && item.fromUserName;

    // Build style arrays conditionally to avoid TypeScript errors
    const messageTextStyles: any[] = [
      styles.messageText,
      { marginRight: 8, maxWidth: '85%' }
    ];
    if (!isSent) {
      messageTextStyles.push(styles.receivedMessageText);
    }

    const messageTimeStyles: any[] = [styles.messageTime];
    if (!isSent) {
      messageTimeStyles.push(styles.receivedMessageTime);
    }
    if (!item.text || (item.messageType === 'image' && item.text === 'Image')) {
      messageTimeStyles.push({ marginLeft: 'auto' });
    }

    return (
      <View style={{ marginBottom: 8 }}>
        {showSenderName && (
          <CustomText
            style={[
              styles.senderName,
              { color: colors.text, opacity: 0.7, marginBottom: 4, marginLeft: 4 },
            ]}>
            {item.fromUserName || 'Unknown User'}
          </CustomText>
        )}
        <View
          style={[
            styles.messageBubble,
            isSent ? styles.sentMessage : styles.receivedMessage,
          ]}>
        {item.messageType === 'image' && item.imageUrl && (
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
            {(item as any).isUploading && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            )}
          </View>
        )}
        {item.messageType === 'location' && item.location && (
          <View style={{ position: 'relative' }}>
            <View style={styles.messageLocation}>
              <Icon name="location" size={RFValue(16)} color={colors.secondary} />
              <CustomText style={styles.locationText}>
                {item.location.address || 'Location shared'}
              </CustomText>
            </View>
            {(item as any).isUploading && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            )}
          </View>
        )}

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          {item.text && (item.messageType !== 'image' || item.text !== 'Image') && (
            <CustomText style={messageTextStyles}>
              {item.text}
            </CustomText>
          )}

          <CustomText style={messageTimeStyles}>
            {formatTime(item.createdAt)}
          </CustomText>
        </View>
      </View>
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
      if (chat.isOwner && chat.groupId) {
        return (
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('JoinRequests', { groupId: chat.groupId })}
            style={{ marginRight: 16, position: 'relative' }}>
            <Icon name="notifications-outline" size={RFValue(24)} color={colors.text} />
            {pendingRequestCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: colors.secondary,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                <CustomText style={{ color: colors.white, fontSize: RFValue(10), fontFamily: Fonts.SemiBold }}>
                  {pendingRequestCount > 99 ? '99+' : String(pendingRequestCount)}
                </CustomText>
              </View>
            )}
          </TouchableOpacity>
        );
      }
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
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.messagesContainer,
          { paddingBottom: keyboardOffsetHeight > 0 ? keyboardOffsetHeight + 20 : 20 },
        ]}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          typingUsers.size > 0 ? (
            <View style={styles.typingIndicator}>
              <CustomText style={styles.typingText}>Someone is typing...</CustomText>
            </View>
          ) : null
        }
      />
      <View style={[styles.inputContainer, { paddingBottom: 8 + keyboardOffsetHeight }]}>
        <TouchableOpacity
          style={styles.emojiButton}
          activeOpacity={0.7}>
          <Icon name="happy-outline" size={RFValue(26)} color={colors.disabled} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={text => {
            setMessageText(text);
            handleTyping();
          }}
          placeholder="Message"
          placeholderTextColor={colors.disabled}
          multiline
        />
        {!messageText.trim() && (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachmentModal(true)}
            activeOpacity={0.7}>
            <Icon name="attach" size={RFValue(26)} color={colors.disabled} />
          </TouchableOpacity>
        )}
        {messageText.trim() ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={sending}
            activeOpacity={0.7}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="send" size={RFValue(20)} color={colors.white} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.sendButton}
            activeOpacity={0.7}>
            <Icon name="mic" size={RFValue(24)} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <AttachmentModal
        visible={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        options={[
          {
            id: 'gallery',
            label: 'Gallery',
            icon: 'images',
            color: '#7C4DFF',
            onPress: handleImagePicker,
          },
          {
            id: 'camera',
            label: 'Camera',
            icon: 'camera',
            color: '#EC407A',
            onPress: handleCameraCapture,
          },
          {
            id: 'location',
            label: 'Location',
            icon: 'location',
            color: '#00C853',
            onPress: handleShareLocation,
          },
          {
            id: 'document',
            label: 'Document',
            icon: 'document-text',
            color: '#5E35B1',
            onPress: () => { },
          },
        ]}
      />
    </KeyboardAvoidingView>
  );
};

export default ChatMessageScreen;

