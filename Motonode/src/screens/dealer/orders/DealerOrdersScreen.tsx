import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useDealer } from '@context/index';
import { DealerOrder } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

const FILTERS = ['All', 'Pending', 'Accepted', 'Packed', 'Ready', 'Delivered', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  packed: '#8B5CF6',
  ready: '#0891B2',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

const NEXT_STATUS: Record<string, DealerOrder['status'] | null> = {
  pending: 'accepted',
  accepted: 'packed',
  packed: 'ready',
  ready: 'delivered',
  delivered: null,
  cancelled: null,
};

const NEXT_LABEL: Record<string, string> = {
  pending: 'Accept',
  accepted: 'Mark Packed',
  packed: 'Mark Ready',
  ready: 'Mark Delivered',
};

export function DealerOrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, updateOrderStatus } = useDealer();
  const [activeFilter, setActiveFilter] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filtered =
    activeFilter === 0
      ? orders
      : orders.filter((o) => o.status === FILTERS[activeFilter].toLowerCase());

  const handleStatusChange = (order: DealerOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const label = NEXT_LABEL[order.status];
    Alert.alert(label, `Move order #${order.id} to "${next}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        onPress: () => {
          lightHaptic();
          updateOrderStatus(order.id, next);
        },
      },
    ]);
  };

  const handleCancel = (order: DealerOrder) => {
    if (order.status === 'delivered' || order.status === 'cancelled') return;
    Alert.alert('Cancel Order', `Cancel order #${order.id}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Order',
        style: 'destructive',
        onPress: () => {
          lightHaptic();
          updateOrderStatus(order.id, 'cancelled');
        },
      },
    ]);
  };

  const countByStatus = (status: string) => orders.filter((o) => o.status === status).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={[styles.totalBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.totalBadgeText}>{orders.length} Total</Text>
          </View>
        </View>
        <FlatList
          data={FILTERS}
          keyExtractor={(i) => i}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          renderItem={({ item, index }) => {
            const count = index === 0 ? orders.length : countByStatus(item.toLowerCase());
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  activeFilter === index && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  lightHaptic();
                  setActiveFilter(index);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: activeFilter === index ? '#fff' : 'rgba(255,255,255,0.7)' },
                  ]}
                >
                  {item}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterCount,
                      {
                        backgroundColor:
                          activeFilter === index ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                      },
                    ]}
                  >
                    <Text style={styles.filterCountText}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const color = STATUS_COLORS[item.status] || colors.primary;
          const canAdvance = NEXT_STATUS[item.status] !== null && item.status !== 'cancelled';
          return (
            <View
              style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.orderId, { color: colors.textPrimary }]}>#{item.id}</Text>
                  <Text style={[styles.orderTime, { color: colors.textTertiary }]}>
                    {item.time} · {item.date}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.statusText, { color }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.customerRow}>
                <Feather name="user" size={14} color={colors.textTertiary} />
                <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                  {item.customer}
                </Text>
              </View>
              <View style={styles.customerRow}>
                <Feather name="phone" size={14} color={colors.textTertiary} />
                <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
                  {item.phone}
                </Text>
              </View>

              <Text style={[styles.itemName, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.item} × {item.qty}
              </Text>

              {item.address ? (
                <View style={styles.customerRow}>
                  <Feather name="map-pin" size={14} color={colors.textTertiary} />
                  <Text
                    style={[styles.customerPhone, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.address}
                  </Text>
                </View>
              ) : null}

              <View style={styles.orderFooter}>
                <Text style={[styles.total, { color: colors.textPrimary }]}>
                  ₹{item.total.toLocaleString('en-IN')}
                </Text>
                <View style={styles.actions}>
                  {canAdvance && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: color + '20' }]}
                      onPress={() => handleStatusChange(item)}
                    >
                      <Feather name="arrow-right" size={15} color={color} />
                      <Text style={[styles.actionText, { color }]}>{NEXT_LABEL[item.status]}</Text>
                    </Pressable>
                  )}
                  {item.status !== 'delivered' && item.status !== 'cancelled' && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.muted }]}
                      onPress={() => handleCancel(item)}
                    >
                      <Feather name="x" size={15} color={colors.destructive} />
                      <Text style={[styles.actionText, { color: colors.destructive }]}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clipboard" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  totalBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  totalBadgeText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  filtersRow: { gap: 8, paddingBottom: 14 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 12 },
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  orderTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginBottom: 10 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  customerName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  customerPhone: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  itemName: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4, marginTop: 2 },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  total: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  actionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
