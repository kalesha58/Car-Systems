import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@state/authStore';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts, MIN_TOUCH_TARGET, fontStyle } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@hooks/useTheme';
import { getChats, requestToJoinGroup, getUserJoinRequests, getPendingRequestCount } from '@service/chatService';
import { IChat, IGroupJoinRequest } from '../../types/chat';
import { useToast } from '@hooks/useToast';
import { ChatListSkeleton } from '@components/common/Skeleton/SkeletonLoader';

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const initialTab = (route.params as any)?.initialTab as 'messages' | 'groups' | undefined;
  const [selectedTab, setSelectedTab] = useState<'messages' | 'groups'>(initialTab || 'messages');
  const [chats, setChats] = useState<IChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingGroups, setRequestingGroups] = useState<Set<string>>(new Set());
  const [pendingRequestMap, setPendingRequestMap] = useState<Map<string, string>>(new Map()); // groupId -> requestId
  const [pendingRequestCounts, setPendingRequestCounts] = useState<Map<string, number>>(new Map()); // groupId -> count
  const [totalPendingRequests, setTotalPendingRequests] = useState<number>(0);
  const [firstGroupWithRequests, setFirstGroupWithRequests] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { showError, showSuccess } = useToast();

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

  const loadPendingRequests = async () => {
    try {
      const requests = await getUserJoinRequests();
      // Create a map of groupId -> requestId for pending requests
      const pendingMap = new Map<string, string>();
      requests
        .filter((req: IGroupJoinRequest) => req.status === 'pending')
        .forEach((req: IGroupJoinRequest) => {
          pendingMap.set(req.groupId, req.id);
        });
      setPendingRequestMap(pendingMap);
    } catch (error: any) {
      // Silently fail - don't show error to user
    }
  };

  const loadPendingRequestCountsForOwnedGroups = async () => {
    try {
      // Filter chats to get groups where user is owner
      const ownedGroups = chats.filter(
        chat => chat.type === 'group' && chat.isOwner && chat.groupId
      );

      if (ownedGroups.length === 0) {
        setPendingRequestCounts(new Map());
        setTotalPendingRequests(0);
        setFirstGroupWithRequests(null);
        return;
      }

      // Fetch pending request counts for each owned group
      const countsMap = new Map<string, number>();
      let total = 0;
      let firstGroupId: string | null = null;

      await Promise.all(
        ownedGroups.map(async (chat) => {
          if (!chat.groupId) return;
          try {
            const count = await getPendingRequestCount(chat.groupId);
            countsMap.set(chat.groupId, count);
            total += count;
            if (count > 0 && !firstGroupId) {
              firstGroupId = chat.groupId;
            }
          } catch (error) {
            // Silently fail for individual groups
            countsMap.set(chat.groupId, 0);
          }
        })
      );

      setPendingRequestCounts(countsMap);
      setTotalPendingRequests(total);
      setFirstGroupWithRequests(firstGroupId);
    } catch (error: any) {
      // Silently fail - don't show error to user
    }
  };

  useEffect(() => {
    loadChats();
    loadPendingRequests();
  }, []);

  // Set initial tab from route params
  useEffect(() => {
    if (initialTab) {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  // Load pending request counts after chats are loaded
  useEffect(() => {
    if (chats.length > 0) {
      loadPendingRequestCountsForOwnedGroups();
    }
  }, [chats]);

  // Refresh when screen comes into focus (e.g., after admin approves request)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      loadChats();
      loadPendingRequests();
      // loadPendingRequestCountsForOwnedGroups will be called after chats load
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
    loadPendingRequests();
    // loadPendingRequestCountsForOwnedGroups will be called after chats load
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
        contentContainer: {
          flex: 1,
          backgroundColor: colors.background,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          overflow: 'hidden',
        },
        tabsContainer: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        tab: {
          flex: 1,
          paddingVertical: 14,
          alignItems: 'center',
          borderBottomWidth: 2,
          borderBottomColor: 'transparent',
        },
        activeTab: {
          borderBottomColor: colors.secondary,
        },
        tabText: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
        },
        activeTabText: {
          color: colors.secondary,
          ...fontStyle(Fonts.SemiBold),
        },
        listContent: {
          paddingBottom: 20,
        },
        chatItem: {
          flexDirection: 'row',
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        groupActions: {
          flexDirection: 'row',
          gap: 8,
          marginLeft: 8,
        },
        actionButton: {
          padding: 8,
          borderRadius: 8,
          backgroundColor: colors.backgroundSecondary,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.backgroundSecondary,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },
        avatarImage: {
          width: 48,
          height: 48,
          borderRadius: 24,
          marginRight: 12,
        },
        chatContent: {
          flex: 1,
        },
        chatName: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.SemiBold),
          color: colors.text,
          marginBottom: 2,
        },
        lastMessage: {
          fontSize: RFValue(10),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
        },
        timeContainer: {
          alignItems: 'flex-end',
          marginLeft: 8,
        },
        timeText: {
          fontSize: RFValue(9),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
          marginBottom: 4,
        },
        unreadBadge: {
          backgroundColor: colors.secondary,
          borderRadius: 10,
          minWidth: 18,
          height: 18,
          paddingHorizontal: 4,
          alignItems: 'center',
          justifyContent: 'center',
        },
        unreadText: {
          color: colors.white,
          fontSize: RFValue(8),
          ...fontStyle(Fonts.SemiBold),
        },
        followButton: {
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: colors.secondary,
          marginTop: 6,
          alignSelf: 'flex-start',
        },
        followButtonText: {
          color: colors.white,
          fontSize: RFValue(10),
          ...fontStyle(Fonts.SemiBold),
        },
        requestedButton: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: colors.backgroundSecondary,
          marginTop: 6,
          alignSelf: 'flex-start',
        },
        requestedButtonText: {
          color: colors.textSecondary,
          fontSize: RFValue(10),
          ...fontStyle(Fonts.Medium),
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
        },
        emptyText: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: RFValue(18),
        },
        notificationBadge: {
          position: 'absolute',
          top: -2,
          right: -2,
          backgroundColor: colors.error,
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 3,
          borderWidth: 1.5,
          borderColor: colors.secondary,
        },
        notificationBadgeText: {
          color: colors.white,
          fontSize: RFValue(8),
          ...fontStyle(Fonts.Bold),
        },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerActionButton: {
          minWidth: MIN_TOUCH_TARGET,
          minHeight: MIN_TOUCH_TARGET,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
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

    if (pendingRequestMap.has(groupId) || requestingGroups.has(groupId)) {
      return;
    }

    try {
      setRequestingGroups(prev => new Set(prev).add(groupId));
      const response = await requestToJoinGroup(groupId);
      setPendingRequestMap(prev => new Map(prev).set(groupId, response.id));
      showSuccess('Join request sent successfully');
      loadChats();
      loadPendingRequests();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.Response?.ReturnMessage || error?.response?.data?.message || '';
      if (errorMessage.includes('already have a pending join request') || errorMessage.includes('pending join request')) {
        loadPendingRequests();
      } else {
        showError(errorMessage || 'Failed to send join request');
      }
    } finally {
      setRequestingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const handleShareGroup = (groupId?: string, groupName?: string) => {
    if (!groupId) return;
    showSuccess('Share functionality coming soon');
  };

  const handleMessageGroup = (chatId: string) => {
    (navigation as any).navigate('ChatMessage', { chatId });
  };

  const handleStartNewChat = () => {
    (navigation as any).navigate('UserSelection');
  };

  const renderChatItem = ({ item }: { item: IChat }) => {
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
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const hasPendingRequest = item.groupId ? pendingRequestMap.has(item.groupId) : false;
    const isRequesting = item.groupId ? requestingGroups.has(item.groupId) : false;
    const showFollowButton = item.type === 'group' && item.canFollow && !item.isMember && !hasPendingRequest;
    const isGroupMember = item.type === 'group' && item.isMember;

    return (
      <View style={styles.chatItem}>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}
          onPress={() => (navigation as any).navigate('ChatMessage', { chatId: item.id })}
          activeOpacity={0.7}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Icon name={item.type === 'group' ? 'people' : 'person'} size={RFValue(20)} color={colors.disabled} />
            </View>
          )}
          <View style={styles.chatContent}>
            <CustomText style={styles.chatName} numberOfLines={1}>{chatName}</CustomText>
            {item.lastMessage ? (
              <CustomText style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage.messageType === 'image'
                  ? '📷 Image'
                  : item.lastMessage.messageType === 'location'
                    ? '📍 Location'
                    : item.lastMessage.text}
              </CustomText>
            ) : item.type === 'group' ? (
              <CustomText style={styles.lastMessage}>Group chat</CustomText>
            ) : null}
            {hasPendingRequest && (
              <View style={styles.requestedButton}>
                <CustomText style={styles.requestedButtonText}>Pending approval</CustomText>
              </View>
            )}
            {showFollowButton && (
              <TouchableOpacity
                style={styles.followButton}
                onPress={(e) => handleFollowGroup(item.id, item.groupId, e)}
                disabled={isRequesting}
                activeOpacity={0.7}>
                <CustomText style={styles.followButtonText}>
                  {isRequesting ? 'Requesting...' : 'Follow group'}
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
            {!!item.unreadCount && item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <CustomText style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : String(item.unreadCount)}
                </CustomText>
              </View>
            )}
          </View>

        </TouchableOpacity>
        {isGroupMember && (
          <View style={styles.groupActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShareGroup(item.groupId, item.groupName)}
              activeOpacity={0.7}>
              <Icon name="share-outline" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMessageGroup(item.id)}
              activeOpacity={0.7}>
              <Icon name="chatbubble-outline" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chatbubbles-outline" size={RFValue(64)} color={colors.border} />
      <CustomText style={[styles.emptyText, { marginTop: 16 }]}>
        {selectedTab === 'messages'
          ? 'No conversations yet.\nStart chatting with your friends!'
          : 'You haven\'t joined any groups yet.\nFollow groups to see them here.'}
      </CustomText>
    </View>
  );

  const headerIconSize = Math.min(RFValue(22), 24);

  const renderNotificationIcon = () => {
    if (totalPendingRequests === 0 || !firstGroupWithRequests) {
      return null;
    }

    return (
      <TouchableOpacity
        onPress={() => (navigation as any).navigate('JoinRequests', { groupId: firstGroupWithRequests })}
        style={styles.headerActionButton}
        activeOpacity={0.7}>
        <Icon name="notifications-outline" size={headerIconSize} color={colors.white} />
        {totalPendingRequests > 0 && (
          <View style={styles.notificationBadge}>
            <CustomText style={styles.notificationBadgeText}>
              {totalPendingRequests > 99 ? '99+' : String(totalPendingRequests)}
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeaderRight = () => {
    return (
      <View style={styles.headerActions}>
        {selectedTab === 'messages' && (
          <>
            <TouchableOpacity
              onPress={handleStartNewChat}
              style={styles.headerActionButton}
              activeOpacity={0.7}>
              <Icon name="add-circle-outline" size={headerIconSize} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStartNewChat}
              style={styles.headerActionButton}
              activeOpacity={0.7}>
              <Icon name="search-outline" size={Math.min(RFValue(20), 22)} color={colors.white} />
            </TouchableOpacity>
          </>
        )}
        {selectedTab === 'groups' && (
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('CreateGroup')}
            style={styles.headerActionButton}
            activeOpacity={0.7}>
            <Icon name="add-circle-outline" size={headerIconSize} color={colors.white} />
          </TouchableOpacity>
        )}
        {renderNotificationIcon()}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Chat"
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
        rightComponent={renderHeaderRight()}
      />
      <View style={styles.contentContainer}>
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

        {loading ? (
          <View style={{ padding: 16 }}>
            <ChatListSkeleton />
          </View>
        ) : (
          <FlatList
            data={selectedTab === 'messages' ? directChats : groupChats}
            renderItem={renderChatItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />
            }
          />
        )}
      </View>
    </View>
  );
};

export default ChatScreen;


