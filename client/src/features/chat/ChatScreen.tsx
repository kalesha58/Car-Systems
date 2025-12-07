import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuthStore} from '@state/authStore';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getChats, requestToJoinGroup} from '@service/chatService';
import {IChat} from '../../types/chat';
import {useToast} from '@hooks/useToast';

const ChatScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'messages' | 'groups'>('messages');
  const [chats, setChats] = useState<IChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingGroups, setRequestingGroups] = useState<Set<string>>(new Set());
  const [requestedGroups, setRequestedGroups] = useState<Set<string>>(new Set());
  const {user} = useAuthStore();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {showError, showSuccess} = useToast();

  const loadChats = async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const directChats = useMemo(() => chats.filter(chat => chat.type === 'direct'), [chats]);
  const groupChats = useMemo(() => chats.filter(chat => chat.type === 'group'), [chats]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        tabsContainer: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.cardBackground,
        },
        tab: {
          flex: 1,
          paddingVertical: 12,
          alignItems: 'center',
          borderBottomWidth: 2,
          borderBottomColor: 'transparent',
        },
        activeTab: {
          borderBottomColor: colors.secondary,
        },
        tabText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Medium,
        },
        activeTabText: {
          color: colors.secondary,
          fontFamily: Fonts.SemiBold,
        },
        listContent: {
          padding: 16,
        },
        chatItem: {
          flexDirection: 'row',
          padding: 12,
          marginBottom: 12,
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          alignItems: 'center',
        },
        avatar: {
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.border,
          marginRight: 12,
        },
        avatarImage: {
          width: 50,
          height: 50,
          borderRadius: 25,
        },
        chatContent: {
          flex: 1,
        },
        chatName: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 4,
        },
        lastMessage: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
        },
        timeContainer: {
          alignItems: 'flex-end',
        },
        timeText: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
          marginBottom: 4,
        },
        unreadBadge: {
          backgroundColor: colors.secondary,
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          paddingHorizontal: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        unreadText: {
          color: colors.white,
          fontSize: RFValue(10),
          fontFamily: Fonts.SemiBold,
        },
        followButton: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: colors.secondary,
          marginTop: 4,
        },
        followButtonText: {
          color: colors.white,
          fontSize: RFValue(12),
          fontFamily: Fonts.SemiBold,
        },
        requestedButton: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: colors.border,
          marginTop: 4,
        },
        requestedButtonText: {
          color: colors.disabled,
          fontSize: RFValue(12),
          fontFamily: Fonts.Medium,
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        emptyText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
          textAlign: 'center',
        },
        fab: {
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.secondary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
      }),
    [colors],
  );

  const handleFollowGroup = async (chatId: string, groupId?: string, e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!groupId) {
      showError('Group ID not found');
      return;
    }

    if (requestingGroups.has(groupId) || requestedGroups.has(groupId)) {
      return;
    }

    try {
      setRequestingGroups(prev => new Set(prev).add(groupId));
      await requestToJoinGroup(groupId);
      setRequestedGroups(prev => new Set(prev).add(groupId));
      showSuccess('Join request sent successfully');
      loadChats();
    } catch (error: any) {
      showError(error?.response?.data?.Response?.ReturnMessage || 'Failed to send join request');
    } finally {
      setRequestingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const renderChatItem = ({item}: {item: IChat}) => {
    const chatName =
      item.type === 'group'
        ? item.groupName || 'Group Chat'
        : item.participantNames?.find(name => name !== user?.name) || 'Unknown';
    const avatar =
      item.type === 'group'
        ? item.participantAvatars?.[0]
        : item.participantAvatars?.find((_, idx) => item.participantNames?.[idx] !== user?.name);

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    };

    const isRequested = item.groupId ? requestedGroups.has(item.groupId) : false;
    const isRequesting = item.groupId ? requestingGroups.has(item.groupId) : false;
    const showFollowButton = item.type === 'group' && item.canFollow && !item.isMember;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => (navigation as any).navigate('ChatMessage', {chatId: item.id})}
        activeOpacity={0.7}>
        {avatar ? (
          <Image source={{uri: avatar}} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Icon name="person" size={RFValue(24)} color={colors.disabled} />
          </View>
        )}
        <View style={styles.chatContent}>
          <CustomText style={styles.chatName}>{chatName}</CustomText>
          {item.lastMessage && (
            <CustomText style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.messageType === 'image'
                ? '📷 Image'
                : item.lastMessage.messageType === 'location'
                ? '📍 Location'
                : item.lastMessage.text}
            </CustomText>
          )}
          {showFollowButton && (
            <TouchableOpacity
              style={isRequested ? styles.requestedButton : styles.followButton}
              onPress={(e) => handleFollowGroup(item.id, item.groupId, e)}
              disabled={isRequesting || isRequested}
              activeOpacity={0.7}>
              <CustomText style={isRequested ? styles.requestedButtonText : styles.followButtonText}>
                {isRequesting ? 'Requesting...' : isRequested ? 'Requested' : 'Follow'}
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.timeContainer}>
          {item.lastMessage && (
            <CustomText style={styles.timeText}>
              {formatTime(item.lastMessage.createdAt)}
            </CustomText>
          )}
          {item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <CustomText style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : String(item.unreadCount)}
              </CustomText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chatbubbles-outline" size={RFValue(64)} color={colors.disabled} />
      <CustomText style={[styles.emptyText, {marginTop: 16}]}>
        {selectedTab === 'messages'
          ? 'No messages yet'
          : 'No groups yet\nCreate a group to get started'}
      </CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Chat" />
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'messages' && styles.activeTab]}
          onPress={() => setSelectedTab('messages')}>
          <CustomText
            style={
              selectedTab === 'messages'
                ? [styles.tabText, styles.activeTabText]
                : styles.tabText
            }>
            Messages
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'groups' && styles.activeTab]}
          onPress={() => setSelectedTab('groups')}>
          <CustomText
            style={
              selectedTab === 'groups'
                ? [styles.tabText, styles.activeTabText]
                : styles.tabText
            }>
            Groups
          </CustomText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={selectedTab === 'messages' ? directChats : groupChats}
        renderItem={renderChatItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />
        }
      />

      {selectedTab === 'messages' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => (navigation as any).navigate('UserSelection')}
          activeOpacity={0.8}>
          <Icon name="add" size={RFValue(24)} color={colors.white} />
        </TouchableOpacity>
      )}

      {selectedTab === 'groups' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => (navigation as any).navigate('CreateGroup')}
          activeOpacity={0.8}>
          <Icon name="add" size={RFValue(24)} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ChatScreen;

