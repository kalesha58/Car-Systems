import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { cardShadow } from '@utils/shadows';
import type { IOrderData } from '@app-types/order';
import {
  formatCurrency,
  formatOrderDate,
  normalizeOrderDisplayStatus,
  type OrderDisplayStatus,
} from '@utils/displayMappers';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80';

function getStatusStyle(
  displayStatus: OrderDisplayStatus,
  colors: ReturnType<typeof useColors>,
): { bg: string; text: string; accent: string; icon: React.ComponentProps<typeof Feather>['name'] } {
  switch (displayStatus) {
    case 'Processing':
      return { bg: colors.muted, text: colors.warning, accent: colors.warning, icon: 'clock' };
    case 'Shipped':
      return { bg: colors.muted, text: colors.info, accent: colors.info, icon: 'package' };
    case 'Out for Delivery':
      return { bg: colors.muted, text: colors.info, accent: colors.info, icon: 'truck' };
    case 'Delivered':
      return { bg: colors.muted, text: colors.success, accent: colors.success, icon: 'check-circle' };
    case 'Cancelled':
      return { bg: colors.muted, text: colors.destructive, accent: colors.destructive, icon: 'x-circle' };
    default:
      return { bg: colors.muted, text: colors.textSecondary, accent: colors.primary, icon: 'clock' };
  }
}

interface OrderCardProps {
  order: IOrderData;
  onPress?: () => void;
}

function getStatusMessage(order: IOrderData, displayStatus: OrderDisplayStatus): string {
  if (order.expectedDeliveryDate && (displayStatus === 'Out for Delivery' || displayStatus === 'Shipped')) {
    const eta = new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
    return `Arriving by ${eta}`;
  }
  if (displayStatus === 'Delivered') {
    return `Delivered on ${formatOrderDate(order.updatedAt).split(',')[0]}`;
  }
  if (displayStatus === 'Cancelled') {
    return order.cancellationReason || 'Order was cancelled';
  }
  if (displayStatus === 'Shipped') {
    return `Shipped on ${formatOrderDate(order.updatedAt).split(',')[0]}`;
  }
  return 'Will be shipped soon';
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const colors = useColors();
  const displayStatus = normalizeOrderDisplayStatus(order.status);
  const status = getStatusStyle(displayStatus, colors);
  const firstItem = order.items[0];
  const extraCount = Math.max(order.items.length - 1, 0);
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.97 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.accentBar, { backgroundColor: status.accent }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.orderId, { color: colors.textPrimary }]} numberOfLines={1}>
              #{order.orderNumber || order.id}
            </Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={11} color={colors.textTertiary} />
              <Text style={[styles.date, { color: colors.textTertiary }]}>{orderDate}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Feather name={status.icon} size={11} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>{displayStatus}</Text>
          </View>
        </View>

        <View style={[styles.body, { backgroundColor: colors.surfaceSecondary }]}>
          <Image source={{ uri: DEFAULT_PRODUCT_IMAGE }} style={styles.productImg} />
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
              {firstItem?.name ?? 'Order items'}
            </Text>
            {extraCount > 0 ? (
              <Text style={[styles.extraItems, { color: colors.textSecondary }]}>
                +{extraCount} more {extraCount === 1 ? 'item' : 'items'}
              </Text>
            ) : (
              <Text style={[styles.extraItems, { color: colors.textSecondary }]}>
                Qty {firstItem?.quantity ?? 1}
              </Text>
            )}
            <Text style={[styles.price, { color: colors.textPrimary }]}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.statusMessageRow}>
          <View style={[styles.statusDot, { backgroundColor: status.accent }]} />
          <Text style={[styles.statusMessage, { color: status.text }]} numberOfLines={1}>
            {getStatusMessage(order, displayStatus)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={onPress}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Details</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={onPress}
          >
            <Feather name="map-pin" size={13} color="#fff" />
            <Text style={styles.primaryBtnText}>Track Order</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 2,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  orderId: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 10,
  },
  productImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  extraItems: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  price: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },
  statusMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusMessage: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
