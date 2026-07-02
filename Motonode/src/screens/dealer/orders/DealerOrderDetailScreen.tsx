import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { ChromeHeader } from '@components/common';
import { InAppBrowserModal } from '@components/common/InAppBrowserModal';
import { DealerOrderLifecycleStepper } from '@components/orders/DealerOrderLifecycleStepper';
import { OrderItemThumbnail } from '@components/orders/OrderItemThumbnail';
import { DealerOrderDetailSkeleton } from '@components/loaders';
import { API_BASE_URL } from '@config/env';
import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { useOrderItemImages } from '@hooks/useOrderItemImages';
import type { IOrderData } from '@app-types/order';
import {
  getDealerOrderById,
  updateDealerOrderStatus,
} from '@services/order.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import {
  canCancelDealerOrder,
  formatCurrency,
  formatOrderDate,
  formatOrderDateParts,
  getNextDealerOrderLabel,
  getNextDealerOrderStatus,
  getOrderId,
  getOrderShippingAddress,
  getOrderStatusColor,
  getOrderStatusLabel,
  isDealerOrderCancelled,
} from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import { getString, StorageKeys } from '@storage/index';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.DealerOrderDetail
>;

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Feather name={icon} size={15} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon as any} size={14} color={colors.textSecondary} />
      <View style={styles.infoTexts}>
        <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export function DealerOrderDetailScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { orderId } = route.params;

  const [order, setOrder] = useState<IOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const orderItemImages = useOrderItemImages(order ? [order] : []);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDealerOrderById(orderId);
      setOrder(data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      void fetchOrder();
    }, [fetchOrder]),
  );

  const handleAdvanceStatus = () => {
    if (!order) return;
    const next = getNextDealerOrderStatus(order.status);
    const label = getNextDealerOrderLabel(order.status);
    if (!next || !label) return;

    Alert.alert(
      label,
      `Move order #${order.orderNumber} to "${getOrderStatusLabel(next)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          onPress: async () => {
            try {
              setUpdating(true);
              lightHaptic();
              const updated = await updateDealerOrderStatus(getOrderId(order), next);
              if (updated) {
                setOrder(updated);
                successHaptic();
              } else {
                await fetchOrder();
              }
            } catch (error) {
              Alert.alert('Error', getApiErrorMessage(error, 'Failed to update order'));
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    if (!order || !canCancelDealerOrder(order.status)) return;

    Alert.alert('Cancel Order', `Cancel order #${order.orderNumber}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Order',
        style: 'destructive',
        onPress: async () => {
          try {
            setUpdating(true);
            lightHaptic();
            const updated = await updateDealerOrderStatus(getOrderId(order), 'CANCELLED_BY_DEALER');
            if (updated) {
              setOrder(updated);
            } else {
              await fetchOrder();
            }
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to cancel order'));
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handleCallCustomer = () => {
    if (!order?.customer?.phone) {
      Alert.alert('No phone', 'Customer phone number is not available.');
      return;
    }
    lightHaptic();
    Linking.openURL(`tel:${order.customer.phone}`).catch(() => undefined);
  };

  const handleShareInvoice = async () => {
    if (!order) return;
    lightHaptic();
    try {
      const token = await getString(StorageKeys.ACCESS_TOKEN);
      const url = `${API_BASE_URL}/invoices/order/${getOrderId(order)}?token=${token}`;
      await Share.share({
        message: `Order Invoice link: ${url}`,
        title: `Invoice - ${order.orderNumber}`,
      });
    } catch {
      Alert.alert('Share Failed', 'Unable to share invoice link.');
    }
  };

  const handleViewInvoice = async () => {
    if (!order) return;
    lightHaptic();
    try {
      const token = await getString(StorageKeys.ACCESS_TOKEN);
      const url = `${API_BASE_URL}/invoices/order/${getOrderId(order)}?token=${token}`;
      setInvoiceUrl(url);
      setInvoiceModalVisible(true);
    } catch {
      Alert.alert('Error', 'Unable to retrieve access token.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader contentPad={8}>
          <View style={styles.headerRow}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Feather name="chevron-left" size={24} color={colors.headerForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Order Details</Text>
            <View style={styles.headerBtn} />
          </View>
        </ChromeHeader>
        <DealerOrderDetailSkeleton />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader contentPad={8}>
          <View style={styles.headerRow}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Feather name="chevron-left" size={24} color={colors.headerForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Order Details</Text>
            <View style={styles.headerBtn} />
          </View>
        </ChromeHeader>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Order not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getOrderStatusColor(order.status);
  const statusLabel = getOrderStatusLabel(order.status);
  const nextLabel = getNextDealerOrderLabel(order.status);
  const canAdvance = Boolean(nextLabel) && canCancelDealerOrder(order.status);
  const cancelled = isDealerOrderCancelled(order.status);
  const { date, time } = formatOrderDateParts(order.createdAt);
  const addressLine = getOrderShippingAddress(order);

  return (
    <View style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color={colors.headerForeground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>#{order.orderNumber}</Text>
            <Text style={styles.headerSubtitle}>{date} • {time}</Text>
          </View>
          <Pressable style={styles.headerBtn} onPress={handleCallCustomer}>
            <Feather name="phone" size={20} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
      >
        <View style={[styles.statusHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: statusColor + '18' }]}>
            <Feather name="package" size={22} color={statusColor} />
          </View>
          <View style={styles.statusHeroTexts}>
            <Text style={[styles.statusHeroLabel, { color: colors.textSecondary }]}>Current status</Text>
            <Text style={[styles.statusHeroValue, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <View style={[styles.paymentPill, { backgroundColor: colors.muted }]}>
            <Text style={[styles.paymentPillText, { color: colors.textSecondary }]}>
              {order.paymentMethod.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <DealerOrderLifecycleStepper
          status={order.status}
          placedAtLabel={`Placed on ${formatOrderDate(order.createdAt)}`}
        />

        {!cancelled ? (
          <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.invoiceHeader}>
              <Feather name="file-text" size={20} color={colors.primary} />
              <View style={styles.invoiceInfo}>
                <Text style={[styles.invoiceTitle, { color: colors.textPrimary }]}>Order Invoice</Text>
                <Text style={[styles.invoiceSubtitle, { color: colors.textSecondary }]}>
                  Download or share invoice for your records
                </Text>
              </View>
            </View>
            <View style={styles.invoiceActions}>
              <Pressable
                style={[styles.invoiceBtn, { backgroundColor: colors.muted }]}
                onPress={handleShareInvoice}
              >
                <Feather name="share-2" size={16} color={colors.textPrimary} />
                <Text style={[styles.invoiceBtnText, { color: colors.textPrimary }]}>Share</Text>
              </Pressable>
              <Pressable
                style={[styles.invoiceBtn, { backgroundColor: colors.primary }]}
                onPress={handleViewInvoice}
              >
                <Feather name="download" size={16} color="#ffffff" />
                <Text style={[styles.invoiceBtnText, { color: '#ffffff' }]}>Download</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <SectionCard title="Customer" icon="user">
          <InfoRow icon="user" label="Name" value={order.customer?.name || 'Customer'} />
          <InfoRow icon="phone" label="Phone" value={order.customer?.phone || '—'} />
          <InfoRow icon="map-pin" label="Delivery address" value={addressLine} />
        </SectionCard>

        <SectionCard title="Order items" icon="shopping-bag">
          {order.items.map((item, index) => (
            <View
              key={`${item.productId}-${index}`}
              style={[
                styles.itemRow,
                index < order.items.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 },
              ]}
            >
              <OrderItemThumbnail
                uri={orderItemImages[item.productId]}
                style={styles.itemThumb}
                iconSize={18}
              />
              <View style={styles.itemMeta}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>Qty: {item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}

          <View style={[styles.totalRow, { borderTopColor: colors.divider }]}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
              {formatCurrency(order.subtotal)}
            </Text>
          </View>
          {order.shipping > 0 ? (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Shipping</Text>
              <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
                {formatCurrency(order.shipping)}
              </Text>
            </View>
          ) : null}
          {order.tax > 0 ? (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Tax</Text>
              <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
                {formatCurrency(order.tax)}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.textPrimary }]}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </SectionCard>
      </ScrollView>

      {!cancelled && (canAdvance || canCancelDealerOrder(order.status)) ? (
        <View style={[styles.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.card }]}>
          {canAdvance && nextLabel ? (
            <Pressable
              style={[styles.primaryBtn, updating && styles.btnDisabled]}
              onPress={handleAdvanceStatus}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="arrow-right-circle" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>{nextLabel}</Text>
                </>
              )}
            </Pressable>
          ) : null}

          {canCancelDealerOrder(order.status) && nextLabel ? (
            <Pressable
              style={[styles.secondaryBtn, updating && styles.btnDisabled]}
              onPress={handleCancel}
              disabled={updating}
            >
              <Feather name="x-circle" size={16} color="#EF4444" />
              <Text style={styles.secondaryBtnText}>Cancel order</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <InAppBrowserModal
        visible={invoiceModalVisible}
        url={invoiceUrl}
        onClose={() => setInvoiceModalVisible(false)}
        title="Order Invoice"
        orderId={order ? String(getOrderId(order)) : 'invoice'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  content: { padding: 16, gap: 14 },
  statusHero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeroTexts: { flex: 1 },
  statusHeroLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  statusHeroValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 2 },
  paymentPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  paymentPillText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  invoiceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceInfo: { flex: 1 },
  invoiceTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  invoiceSubtitle: { fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
  invoiceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  invoiceBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoTexts: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  infoValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', lineHeight: 18 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  itemThumb: { width: 48, height: 48, borderRadius: 10 },
  itemMeta: { flex: 1 },
  itemName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  itemQty: { fontSize: 11, marginTop: 2 },
  itemPrice: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  totalLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  totalValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  grandTotalLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  grandTotalValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E60012',
    borderRadius: 12,
    height: 48,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
  },
  secondaryBtnText: { color: '#EF4444', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  btnDisabled: { opacity: 0.6 },
});
