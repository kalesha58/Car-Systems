import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { IOrderData } from '@app-types/order';
import { getOrderById } from '@services/order.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { formatCurrency, formatOrderDate, normalizeOrderDisplayStatus } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.DealerStore]: { id: string };
  [CustomerStackRoutes.ServiceDetail]: { id: string };
  [CustomerStackRoutes.DriveDetail]: { id: string };
  [CustomerStackRoutes.MyOrders]: undefined;
  [CustomerStackRoutes.OrderTracking]: { id: string };
};

type OrderTrackingScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.OrderTracking
>;

const TIMELINE_STEPS = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'] as const;

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=100&auto=format&fit=crop&q=80';

function getTimelineProgress(status: string) {
  const displayStatus = normalizeOrderDisplayStatus(status);
  switch (displayStatus) {
    case 'Delivered':
      return 4;
    case 'Out for Delivery':
      return 3;
    case 'Shipped':
      return 2;
    case 'Processing':
    default:
      return 1;
  }
}

export function OrderTrackingScreen({ route, navigation }: OrderTrackingScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { id } = route.params;

  const [order, setOrder] = useState<IOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsExpanded, setItemsExpanded] = useState(true);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderById(id);
      if (data) {
        setOrder(data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load order'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder]),
  );

  const displayStatus = order ? normalizeOrderDisplayStatus(order.status) : 'Processing';
  const progressIndex = order ? getTimelineProgress(order.status) : 0;

  const steps = TIMELINE_STEPS.map((label, idx) => ({
    label,
    date:
      idx <= progressIndex && order
        ? formatOrderDate(order.createdAt).split(',')[0].replace(/\d{4}/, '').trim()
        : '',
    completed: idx <= progressIndex,
    active: idx === progressIndex,
  }));

  const handleCopyOrderId = () => {
    if (!order) return;
    Clipboard.setString(order.orderNumber);
    successHaptic();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader style={styles.header} contentPad={8}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Tracking</Text>
          <View style={styles.iconBtn} />
        </ChromeHeader>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.link} />
        </View>
      </View>
    );
  }

  if (!order || error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader style={styles.header} contentPad={8}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Tracking</Text>
          <View style={styles.iconBtn} />
        </ChromeHeader>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error ?? 'Order not found'}</Text>
        </View>
      </View>
    );
  }

  const address = order.shippingAddress;
  const addressLine = [address.street, address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Tracking</Text>
        <Pressable style={styles.iconBtn}>
          <Feather name="headphones" size={20} color="#ffffff" />
        </Pressable>
      </ChromeHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 20 }]}
      >
        <View style={styles.orderIdRow}>
          <View>
            <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Order ID</Text>
            <Text style={[styles.orderIdValue, { color: colors.textPrimary }]}>{order.orderNumber}</Text>
            <Text style={[styles.orderPlacedOn, { color: colors.textTertiary }]}>
              Placed on {formatOrderDate(order.createdAt)}
            </Text>
          </View>
          <Pressable style={styles.copyBtn} onPress={handleCopyOrderId}>
            <Text style={styles.copyBtnText}>Copy</Text>
          </Pressable>
        </View>

        <View style={[styles.statusCard, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{displayStatus}</Text>
            <Text style={styles.statusSubtitle}>
              {order.expectedDeliveryDate
                ? `Expected by ${new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')}`
                : `Payment: ${order.paymentStatus}`}
            </Text>
          </View>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=300&auto=format&fit=crop&q=80',
            }}
            style={styles.scooterImg}
            resizeMode="contain"
          />
        </View>

        <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.timelineStepperRow}>
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              return (
                <React.Fragment key={step.label}>
                  <View style={styles.stepNode}>
                    <View
                      style={[
                        styles.circleNode,
                        step.completed ? { backgroundColor: '#7E22CE' } : { backgroundColor: '#E2E8F0' },
                        step.active && { borderWidth: 2, borderColor: '#C084FC' },
                      ]}
                    >
                      {step.completed ? (
                        <Feather name="check" size={10} color="#fff" />
                      ) : (
                        <View style={styles.circleInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        step.completed ? { color: colors.textPrimary } : { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                    {step.date ? <Text style={styles.stepDate}>{step.date}</Text> : null}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        steps[idx + 1].completed
                          ? { backgroundColor: '#7E22CE' }
                          : { backgroundColor: '#E2E8F0' },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {order.dealer ? (
          <View style={[styles.partnerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dealer</Text>
            <View style={styles.partnerRow}>
              <View style={[styles.partnerAvatar, { backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="shopping-bag" size={20} color={colors.primary} />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={[styles.partnerName, { color: colors.textPrimary }]}>
                  {order.dealer.businessName || order.dealer.name}
                </Text>
                {order.dealer.phone ? (
                  <Text style={styles.partnerRatingVal}>{order.dealer.phone}</Text>
                ) : null}
              </View>
              <View style={styles.partnerActions}>
                <Pressable style={styles.actionIconBtn} onPress={() => lightHaptic()}>
                  <Feather name="phone" size={16} color="#2563EB" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View style={[styles.accordionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.accordionHeader} onPress={() => setItemsExpanded(!itemsExpanded)}>
            <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
              Order Items ({order.items.length})
            </Text>
            <Feather
              name={itemsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {itemsExpanded && (
            <View style={styles.accordionBody}>
              {order.items.map((item, index) => (
                <View key={`${item.productId}-${index}`} style={styles.itemRow}>
                  <Image source={{ uri: DEFAULT_PRODUCT_IMAGE }} style={styles.itemThumb} />
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
                <Text style={[styles.totalVal, { color: colors.textPrimary }]}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>

              {addressLine ? (
                <Text style={[styles.itemQty, { color: colors.textSecondary, marginTop: 8 }]}>
                  Deliver to: {addressLine}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  scrollContent: { padding: 16, gap: 16, paddingTop: 70 },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  orderIdValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  orderPlacedOn: { fontSize: 10, marginTop: 2 },
  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  copyBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#475569' },
  statusCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#7E22CE' },
  statusSubtitle: { fontSize: 12, color: '#6B21A8', marginTop: 4 },
  scooterImg: { width: 90, height: 70 },
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  timelineStepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepNode: {
    alignItems: 'center',
    width: 60,
  },
  circleNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  stepLabel: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginTop: 6,
  },
  stepDate: {
    fontSize: 7,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: 'Inter_500Medium',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: 10,
  },
  partnerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  partnerRatingVal: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#64748B', marginTop: 2 },
  partnerActions: { flexDirection: 'row', gap: 6 },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  accordionBody: {
    marginTop: 16,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  itemMeta: { flex: 1 },
  itemName: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  itemQty: { fontSize: 10, marginTop: 1 },
  itemPrice: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginVertical: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  totalVal: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
