import React from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'order',
    icon: 'package',
    title: 'Order Shipped!',
    body: 'Your Steelbird SBA-2 Helmet is out for delivery',
    time: '10 min ago',
    color: '#8B5CF6',
    read: false,
  },
  {
    id: '2',
    type: 'service',
    icon: 'tool',
    title: 'Service Reminder',
    body: 'KTM Duke 390 service due in 500 km. Book now!',
    time: '2h ago',
    color: '#F59E0B',
    read: false,
  },
  {
    id: '3',
    type: 'offer',
    icon: 'tag',
    title: 'Flash Sale! 40% Off',
    body: 'Helmets and riding gear — today only until midnight',
    time: '5h ago',
    color: '#10B981',
    read: true,
  },
  {
    id: '4',
    type: 'community',
    icon: 'users',
    title: 'New Community Post',
    body: 'Arjun Sharma shared a ride story from Bangalore-Mysore',
    time: '1d ago',
    color: '#FF1A1A',
    read: true,
  },
  {
    id: '5',
    type: 'insurance',
    icon: 'shield',
    title: 'Insurance Reminder',
    body: 'Vehicle insurance for KA 01 HB 4832 expires in 30 days',
    time: '2d ago',
    color: '#EF4444',
    read: true,
  },
];

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
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
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable>
          <Text style={[styles.markAllText, { color: 'rgba(255,255,255,0.7)' }]}>
            Mark all read
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 34 }]}
        showsVerticalScrollIndicator={false}
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
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.notificationItem,
              {
                backgroundColor: item.read ? colors.card : colors.primary + '08',
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.notifIcon, { backgroundColor: item.color + '20' }]}>
              <Feather name={item.icon as 'package'} size={20} color={item.color} />
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
              <Text style={[styles.notifTime, { color: colors.textTertiary }]}>{item.time}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notifications
            </Text>
          </View>
        }
      />
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
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
