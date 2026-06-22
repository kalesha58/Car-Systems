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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
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
  getPendingRequestCount,
  getGroupMembers,
  updateGroupImage,
  editGroupChat,
  blockChatUser,
  reportChatMessage,
} from '@service/chatService';
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
import { resolveVehicleAlert } from '@service/vehicleAlertService';
import { IChat, IMessage } from '../../types/chat';
import { useToast } from '@hooks/useToast';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import AttachmentModal from '@components/common/AttachmentModal';
import { useGroupLiveLocation } from '@hooks/useGroupLiveLocation';
import { getGroupById } from '@service/groupService';
import { IGroup } from '../../types/group';

const ChatMessageScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, vehicleAlertId } = route.params as {
    chatId: string;
    vehicleAlertId?: string;
  };
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [group, setGroup] = useState<IGroup | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const keyboardOffsetHeight = useKeyboardOffsetHeight();
  
  // Use the live location hook for automatic tracking
  const {isActive: isAutoLiveLocationActive} = useGroupLiveLocation({
    group,
    chatId: chat?.type === 'group' ? chatId : undefined,
    enabled: chat?.type === 'group' && group?.liveLocationEnabled === true,
  });

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

      // Load group members and group data if it's a group
      if (data.type === 'group' && data.groupId) {
        loadGroupMembers(data.groupId);
        loadGroupData(data.groupId);
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

  const loadGroupMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const members = await getGroupMembers(groupId);
      setGroupMembers(members);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load group members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadGroupData = async (groupId: string) => {
    try {
      const groupData = await getGroupById(groupId);
      setGroup(groupData);
    } catch (error: any) {
      // Silently fail - not critical
      console.error('Failed to load group data:', error);
    }
  };

  const handleGroupImageUpload = async () => {
    if (!chat?.groupId) return;

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      async (response: ImagePickerResponse) => {
        if (response.didCancel || !response.assets?.[0]) {
          return;
        }

        const imageUri = response.assets[0].uri;
        if (!imageUri) return;

        try {
          await updateGroupImage(chat.groupId!, imageUri);
          showSuccess('Group image updated successfully');
          loadChat(); // Reload chat to get updated image
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Failed to upload group image');
        }
      },
    );
  };

  const handleAddMembers = () => {
    if (!chat?.id || !chat?.groupId) return;
    // Navigate to EditGroup screen to add members
    (navigation as any).navigate('EditGroup', { chatId: chat.id });
  };

  const handleTogglePrivacy = async (newPrivacy: 'public' | 'private') => {
    if (!chat?.id) return;
    try {
      await editGroupChat(chat.id, {
        privacy: newPrivacy,
      });
      showSuccess(`Group is now ${newPrivacy}`);
      loadChat();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update privacy');
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
          maxWidth: '85%',
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 20,
          marginBottom: 8,
          elevation: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        },
        sentMessage: {
          backgroundColor: colors.secondary,
          alignSelf: 'flex-end',
          borderBottomRightRadius: 4,
          marginLeft: 40,
        },
        receivedMessage: {
          backgroundColor: colors.cardBackground,
          alignSelf: 'flex-start',
          borderBottomLeftRadius: 4,
          marginRight: 40,
          borderWidth: 1,
          borderColor: colors.border,
        },
        messageText: {
          fontSize: RFValue(13),
          ...fontStyle(Fonts.Regular),
          color: colors.white,
          lineHeight: RFValue(18),
        },
        receivedMessageText: {
          color: colors.text,
        },
        messageImage: {
          width: 220,
          height: 220,
          borderRadius: 12,
          marginBottom: 6,
        },
        messageLocation: {
          padding: 10,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          marginBottom: 6,
          flexDirection: 'row',
          alignItems: 'center',
        },
        locationText: {
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Regular),
          color: colors.text,
          marginLeft: 6,
        },
        messageTime: {
          fontSize: RFValue(8),
          ...fontStyle(Fonts.Regular),
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'right',
          marginTop: 2,
        },
        receivedMessageTime: {
          color: colors.textSecondary,
        },
        senderName: {
          fontSize: RFValue(10),
          ...fontStyle(Fonts.SemiBold),
          marginBottom: 2,
          color: colors.secondary,
        },
        inputContainer: {
          flexDirection: 'row',
          paddingHorizontal: 10,
          paddingVertical: 10,
          backgroundColor: colors.background,
          alignItems: 'center',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        inputWrapper: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 24,
          paddingHorizontal: 14,
          marginHorizontal: 8,
          borderWidth: 1,
          borderColor: colors.border,
        },
        input: {
          flex: 1,
          paddingVertical: 10,
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Regular),
          color: colors.text,
          maxHeight: 100,
          minHeight: 40,
        },
        sendButton: {
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.secondary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        iconButton: {
          padding: 8,
        },
        typingIndicator: {
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        typingText: {
          fontSize: RFValue(10),
          ...fontStyle(Fonts.Regular),
          fontStyle: 'italic',
          color: colors.textSecondary,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
      }),
    [colors],
  );

  const renderMessage = ({ item }: { item: IMessage }) => {
    const isSent = item.from === user?.id;
    const isGroupChat = chat?.type === 'group';
    const showSenderName = isGroupChat && !isSent && item.fromUserName;

    const messageTextStyles: any[] = [
      styles.messageText,
    ];
    if (!isSent) {
      messageTextStyles.push(styles.receivedMessageText);
    }

    const messageTimeStyles: any[] = [styles.messageTime];
    if (!isSent) {
      messageTimeStyles.push(styles.receivedMessageTime);
    }

    return (
      <View style={{ marginBottom: 4 }}>
        {showSenderName && (
          <CustomText style={[styles.senderName, { marginLeft: 12 }]}>
            {item.fromUserName || 'Unknown User'}
          </CustomText>
        )}
        <View style={[styles.messageBubble, isSent ? styles.sentMessage : styles.receivedMessage]}>
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
                  borderRadius: 12,
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
                <Icon name="location" size={RFValue(14)} color={colors.secondary} />
                <CustomText style={styles.locationText} numberOfLines={1}>
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
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              )}
            </View>
          )}

          <View>
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
        <CustomHeader
          title="Chat"
          backgroundColor={colors.secondary}
          titleColor={colors.white}
          iconColor={colors.white}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  const renderGroupInfo = () => {
    if (!showGroupInfo || chat?.type !== 'group') return null;

    const groupImage = chat.groupImage || chat.participantAvatars?.[0];

    return (
      <View style={{
        backgroundColor: colors.background,
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={handleGroupImageUpload} activeOpacity={0.7}>
            {groupImage ? (
              <Image 
                source={{ uri: groupImage }} 
                style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: colors.border }}
              />
            ) : (
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.backgroundSecondary,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Icon name="camera" size={RFValue(24)} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <CustomText style={{ fontSize: RFValue(16), ...fontStyle(Fonts.SemiBold), color: colors.text }}>
              {chat.groupName || 'Group'}
            </CustomText>
            <CustomText style={{ fontSize: RFValue(11), color: colors.textSecondary, marginTop: 2 }}>
              {loadingMembers ? 'Loading members...' : `${groupMembers.length} ${groupMembers.length === 1 ? 'member' : 'members'}`}
            </CustomText>
          </View>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
          onPress={handleAddMembers}
          activeOpacity={0.7}>
          <Icon name="person-add-outline" size={RFValue(18)} color={colors.secondary} />
          <CustomText style={{ marginLeft: 12, fontSize: RFValue(13), ...fontStyle(Fonts.Medium), color: colors.text }}>
            Add Members
          </CustomText>
        </TouchableOpacity>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="lock-closed-outline" size={RFValue(18)} color={colors.secondary} />
            <CustomText style={{ marginLeft: 12, fontSize: RFValue(13), ...fontStyle(Fonts.Medium), color: colors.text }}>
              Privacy ({chat.privacy === 'public' ? 'Public' : 'Private'})
            </CustomText>
          </View>
          <Switch
            value={chat.privacy === 'public'}
            onValueChange={(value: boolean) => handleTogglePrivacy(value ? 'public' : 'private')}
            trackColor={{ false: colors.border, true: colors.secondary }}
            thumbColor={colors.white}
          />
        </View>

        {chat.isOwner && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            }}
            onPress={() => {
              setShowGroupInfo(false);
              (navigation as any).navigate('EditGroup', { chatId: chat.id });
            }}
            activeOpacity={0.7}>
            <Icon name="settings-outline" size={RFValue(18)} color={colors.secondary} />
            <CustomText style={{ marginLeft: 12, fontSize: RFValue(13), ...fontStyle(Fonts.Medium), color: colors.text }}>
              Edit Group Settings
            </CustomText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const headerRight = () => {
    const directParticipantId = chat?.type === 'direct'
      ? chat.participants.find((participantId) => participantId !== user?.id)
      : undefined;

    if (chat?.type === 'group') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowGroupInfo(!showGroupInfo)}
            style={styles.iconButton}
            activeOpacity={0.7}>
            <Icon name="information-circle-outline" size={RFValue(22)} color={colors.white} />
          </TouchableOpacity>
          {chat.isOwner && chat.groupId && (
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('JoinRequests', { groupId: chat.groupId })}
              style={{ marginRight: 8, position: 'relative', padding: 4 }}>
              <Icon name="notifications-outline" size={RFValue(22)} color={colors.white} />
              {pendingRequestCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: colors.error,
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 3,
                    borderWidth: 1,
                    borderColor: colors.secondary,
                  }}>
                  <CustomText style={{ color: colors.white, fontSize: RFValue(8), ...fontStyle(Fonts.Bold) }}>
                    {pendingRequestCount > 99 ? '99+' : String(pendingRequestCount)}
                  </CustomText>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={async () => {
            if (!directParticipantId) return;
            try {
              await blockChatUser(directParticipantId);
              showSuccess('User blocked successfully');
              navigation.goBack();
            } catch (error: any) {
              showError(error?.response?.data?.message || 'Failed to block user');
            }
          }}>
          <Icon name="ban-outline" size={RFValue(22)} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={async () => {
            const lastMessage = messages[messages.length - 1];
            if (!lastMessage) return;
            try {
              await reportChatMessage({
                targetId: lastMessage.id,
                reason: 'Abusive message',
                targetOwnerId: lastMessage.from,
              });
              showSuccess('Message reported');
            } catch (error: any) {
              showError(error?.response?.data?.message || 'Failed to report message');
            }
          }}>
          <Icon name="flag-outline" size={RFValue(22)} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
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
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
        rightComponent={headerRight()}
      />
      {vehicleAlertId && (
        <View
          style={{
            backgroundColor: '#ef444415',
            borderBottomWidth: 1,
            borderBottomColor: '#ef4444',
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="warning" size={RFValue(18)} color="#ef4444" />
            <CustomText style={{ flex: 1, fontSize: RFValue(11), color: colors.text }}>
              Vehicle alert — please move your vehicle when possible.
            </CustomText>
          </View>
          <TouchableOpacity
            onPress={async () => {
              try {
                await resolveVehicleAlert(vehicleAlertId);
                showSuccess('Alert resolved');
                navigation.goBack();
              } catch (error: any) {
                showError(error?.response?.data?.message || 'Failed to resolve alert');
              }
            }}
            style={{
              backgroundColor: '#ef4444',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}>
            <CustomText style={{ color: '#fff', fontSize: RFValue(10), ...fontStyle(Fonts.SemiBold) }}>
              Resolved
            </CustomText>
          </TouchableOpacity>
        </View>
      )}
      {renderGroupInfo()}
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
      <View style={[
        styles.inputContainer,
        {
          paddingBottom: 16 + keyboardOffsetHeight + (Platform.OS === 'android' ? Math.max(12, insets.bottom) : 0)
        }
      ]}>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Icon name="happy-outline" size={RFValue(24)} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
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
          />
          {!messageText.trim() && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowAttachmentModal(true)}
              activeOpacity={0.7}>
              <Icon name="paper-plane-outline" style={{transform: [{rotate: '45deg'}]}} size={RFValue(20)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {messageText.trim() ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={sending}
            activeOpacity={0.7}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="send" size={RFValue(18)} color={colors.white} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.sendButton}
            activeOpacity={0.7}>
            <Icon name="mic" size={RFValue(22)} color={colors.white} />
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

