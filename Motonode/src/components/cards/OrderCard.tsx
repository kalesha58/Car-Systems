import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { IOrderData } from '@app-types/order';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  ORDER_PLACED: { label: 'Placed', color: '#F59E0B', icon: 'clock' },
  ORDER_CONFIRMED: { label: 'Confirmed', color: '#FF1A1A', icon: 'check-circle' },
  SHIPPED: { label: 'Out for Delivery', color: '#8B5CF6', icon: 'truck' },
  DELIVERED: { label: 'Delivered', color: '#10B981', icon: 'check-circle' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', icon: 'x-circle' },
  pending: { label: 'Pending', color: '#F59E0B', icon: 'clock' },
  confirmed: { label: 'Confirmed', color: '#FF1A1A', icon: 'check-circle' },
  shipped: { label: 'Out for Delivery', color: '#8B5CF6', icon: 'truck' },
  delivered: { label: 'Delivered', color: '#10B981', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'x-circle' },
};

interface OrderCardProps {
  order: IOrderData;
  onPress?: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const colors = useColors();
  const statusKey = order.status?.toUpperCase?.() || order.status;
  const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG[order.status] || {
    label: order.status,
    color: '#6B7280',
    icon: 'package',
  };
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.orderId, { color: colors.textPrimary }]}>
            Order #{order.orderNumber || order.id}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{orderDate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Feather
            name={status.icon as React.ComponentProps<typeof Feather>['name']}
            size={12}
            color={status.color}
          />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      {order.items.map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            Qty: {item.quantity} · ₹{item.price.toLocaleString('en-IN')}
          </Text>
        </View>
      ))}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <View style={styles.footer}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.total, { color: colors.textPrimary }]}>
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </Text>
        </View>
        {order.expectedDeliveryDate ? (
          <Text style={[styles.delivery, { color: colors.primary }]}>
            Est. {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')}
          </Text>
        ) : null}
        <Pressable style={[styles.trackBtn, { borderColor: colors.primary }]} onPress={onPress}>
          <Text style={[styles.trackBtnText, { color: colors.primary }]}>Track Order</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginVertical: 10 },
  item: { marginBottom: 4 },
  itemName: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  itemMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  total: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  delivery: { fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'center' },
  trackBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  trackBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
