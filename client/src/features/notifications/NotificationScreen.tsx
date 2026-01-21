import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  INotification,
  IGetNotificationsParams,
} from '@service/notificationService';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '@components/common/EmptyState/EmptyState';
import { navigate } from '@utils/NavigationUtils';

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { showError, showSuccess } = useToast();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const loadNotifications = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: IGetNotificationsParams = {
        page: pageNum,
        limit: 20,
      };

      const response = await getNotifications(params);
      
      if (pageNum === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }

      setPage(pageNum);
      setTotal(response.total);
      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [showError]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(1, false);
    }, [loadNotifications]),
  );

  const handleRefresh = useCallback(() => {
    loadNotifications(1, true);
  }, [loadNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadNotifications(page + 1, false);
    }
  }, [loadingMore, hasMore, page, loadNotifications]);

  const handleNotificationPress = async (notification: INotification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
          ),
        );
      }

      // Navigate based on notification type
      if (notification.type === 'order_update' && notification.data?.orderId) {
        navigate('LiveTracking', { orderId: notification.data.orderId });
      } else if (notification.type === 'service_update' && notification.data?.serviceId) {
        // Navigate to service details if needed
        // navigate('ServiceDetail', { serviceId: notification.data.serviceId });
      }
    } catch (error: any) {
      showError('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showSuccess('All notifications marked as read');
    } catch (error: any) {
      showError('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return 'receipt-outline';
      case 'service_update':
        return 'car-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotificationItem = ({ item }: { item: INotification }) => {
    const isUnread = !item.read;
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: colors.cardBackground, borderBottomColor: colors.border },
          isUnread && { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}>
        <View style={styles.notificationContent}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor:
                  item.type === 'order_update'
                    ? colors.secondary + '20'
                    : item.type === 'service_update'
                    ? colors.primary + '20'
                    : colors.border,
              },
            ]}>
            <Icon
              name={getNotificationIcon(item.type)}
              size={RFValue(20)}
              color={
                item.type === 'order_update'
                  ? colors.secondary
                  : item.type === 'service_update'
                  ? colors.primary
                  : colors.text
              }
            />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <CustomText
                style={[styles.title, { color: colors.text }]}
                fontFamily={Fonts.SemiBold}
                numberOfLines={1}>
                {item.title}
              </CustomText>
              {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.secondary }]} />}
            </View>
            <CustomText
              style={[styles.body, { color: colors.textSecondary }]}
              fontFamily={Fonts.Regular}
              numberOfLines={2}>
              {item.body}
            </CustomText>
            <CustomText
              style={[styles.time, { color: colors.disabled }]}
              fontFamily={Fonts.Regular}
              variant="h8">
              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        notificationItem: {
          padding: 16,
          borderBottomWidth: 1,
        },
        notificationContent: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        textContainer: {
          flex: 1,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        },
        title: {
          fontSize: RFValue(14),
          flex: 1,
        },
        unreadDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          marginLeft: 8,
        },
        body: {
          fontSize: RFValue(12),
          marginBottom: 4,
        },
        time: {
          fontSize: RFValue(10),
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        },
      }),
    [colors],
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const headerRight = useMemo(
    () => (
      <View style={styles.headerRight}>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <CustomText style={{ color: colors.secondary, fontSize: RFValue(12) }} fontFamily={Fonts.Medium}>
              Mark all read
            </CustomText>
          </TouchableOpacity>
        )}
      </View>
    ),
    [unreadCount, handleMarkAllAsRead, colors, styles],
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Notifications" rightComponent={headerRight} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Notifications" rightComponent={headerRight} />
      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications"
          message="You don't have any notifications yet"
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.secondary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16 }}>
                <ActivityIndicator size="small" color={colors.secondary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

export default NotificationScreen;
