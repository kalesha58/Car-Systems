import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@services/notification.service';
import type { INotification, NotificationType } from '@app-types/notification';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { formatRelativeTime } from '@utils/formatRelativeTime';
import { lightHaptic } from '@utils/haptics';

const NOTIFICATION_STYLE: Record<
  NotificationType,
  { icon: React.ComponentProps<typeof Feather>['name']; color: string }
> = {
  order_update: { icon: 'package', color: '#8B5CF6' },
  service_update: { icon: 'tool', color: '#F59E0B' },
  test_drive_update: { icon: 'truck', color: '#2563EB' },
  general: { icon: 'bell', color: '#10B981' },
};

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.OrderTracking]: { id: string };
};

type NotificationsNavigationProp = NativeStackNavigationProp<
  CustomerStackParamList,
  typeof CustomerStackRoutes.Notifications
>;

export function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NotificationsNavigationProp>();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (opts?: { refreshing?: boolean }) => {
    if (opts?.refreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getNotifications({ page: 1, limit: 50 });
      setNotifications(response.notifications ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load notifications'));
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    lightHaptic();
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to mark notifications as read'));
    }
  };

  const handleNotificationPress = async (notification: INotification) => {
    lightHaptic();
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );
      } catch {
        // Keep UI responsive even if mark-read fails
      }
    }

    const orderId = notification.data?.orderId;
    if (orderId) {
      navigation.navigate(CustomerStackRoutes.OrderTracking, { id: orderId });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={handleMarkAllRead} disabled={unreadCount === 0}>
          <Text
            style={[
              styles.markAllText,
              { color: unreadCount > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' },
            ]}
          >
            Mark all read
          </Text>
        </Pressable>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 34 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications({ refreshing: true })}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            unreadCount > 0 ? (
              <View style={[styles.unreadBanner, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="bell" size={16} color={colors.primary} />
                <Text style={[styles.unreadText, { color: colors.primary }]}>
                  {unreadCount} unread notifications
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const style = NOTIFICATION_STYLE[item.type] ?? NOTIFICATION_STYLE.general;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.notificationItem,
                  {
                    backgroundColor: item.read ? colors.card : colors.primary + '08',
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={[styles.notifIcon, { backgroundColor: style.color + '20' }]}>
                  <Feather name={style.icon} size={20} color={style.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                    {!item.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell-off" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {error ?? 'No notifications'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  markAllText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  unreadText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  notificationItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 24 },
});
