import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { BottomSheet } from '@components/bottomSheet';
import { DealerStackRoutes } from '@constants/routes';
import { ChromeHeader } from '@components/common';
import { GarageBookingsListSkeleton, GarageOrdersListSkeleton } from '@components/loaders';
import { OrderItemThumbnail } from '@components/orders/OrderItemThumbnail';
import type { BookingFilter } from '@data/bookingsData';
import { getStatusColor, getStatusLabel } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { getOrderItemImageUri, useOrderItemImages } from '@hooks/useOrderItemImages';
import { getDealerOrders, updateDealerOrderStatus } from '@services/order.service';
import {
  getDealerServiceBookings,
  updateServiceBookingStatus,
} from '@services/serviceBooking.service';
import type { IOrderData } from '@app-types/order';
import type { IServiceBooking, ServiceBookingStatus } from '../../../types/serviceBooking';
import { getApiErrorMessage } from '@utils/apiHelpers';
import {
  mapServiceBookingStatus,
  mapServiceBookingToCustomerBooking,
} from '@utils/bookingMappers';
import {
  canCancelDealerOrder,
  formatOrderDateParts,
  getNextDealerOrderLabel,
  getNextDealerOrderStatus,
  getOrderId,
  getOrderItemQty,
  getOrderPrimaryItemName,
  getOrderShippingAddress,
  getOrderStatusColor,
  getOrderStatusLabel,
  matchesOrderFilter,
} from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

const FILTERS = ['All', 'Pending', 'Accepted', 'Packed', 'Ready', 'Delivered', 'Cancelled'];

const SERVICE_FILTERS: { key: BookingFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

type OrderSort = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

const SORT_OPTIONS: { key: OrderSort; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'amount_high', label: 'Amount: high to low' },
  { key: 'amount_low', label: 'Amount: low to high' },
];

function sortOrders(list: IOrderData[], sort: OrderSort): IOrderData[] {
  const next = [...list];
  next.sort((a, b) => {
    if (sort === 'amount_high') return (b.totalAmount ?? 0) - (a.totalAmount ?? 0);
    if (sort === 'amount_low') return (a.totalAmount ?? 0) - (b.totalAmount ?? 0);
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (sort === 'oldest') return aTime - bTime;
    return bTime - aTime;
  });
  return next;
}

function matchesServiceFilter(
  status: ReturnType<typeof mapServiceBookingStatus>,
  filter: BookingFilter,
) {
  if (filter === 'all') return true;
  if (filter === 'upcoming') return status === 'pending' || status === 'confirmed';
  if (filter === 'in_progress') return status === 'in_progress';
  if (filter === 'completed') return status === 'completed';
  if (filter === 'cancelled') return status === 'cancelled' || status === 'rejected';
  return true;
}

function dealerActionStatus(
  action: 'accept' | 'start' | 'complete' | 'reject',
): ServiceBookingStatus {
  if (action === 'accept') return 'scheduled';
  if (action === 'start') return 'in_progress';
  if (action === 'complete') return 'completed';
  return 'cancelled';
}

export function DealerOrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<DealerStackParamList>>();
  const [orders, setOrders] = useState<IOrderData[]>([]);
  const [serviceBookings, setServiceBookings] = useState<IServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);
  const [serviceFilter, setServiceFilter] = useState<BookingFilter>('all');
  const [orderView, setOrderView] = useState<'products' | 'services'>('products');
  const [orderSort, setOrderSort] = useState<OrderSort>('newest');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [draftFilter, setDraftFilter] = useState(0);
  const [draftSort, setDraftSort] = useState<OrderSort>('newest');
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const orderItemImages = useOrderItemImages(orders);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getDealerOrders({ limit: 100 });
      setOrders(data);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to load orders'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchServiceBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setServicesLoading(true);
      const data = await getDealerServiceBookings({ limit: 100 });
      setServiceBookings(data?.bookings ?? []);
    } catch {
      setServiceBookings([]);
    } finally {
      setServicesLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (orderView === 'products') {
        void fetchOrders();
      } else {
        void fetchServiceBookings();
      }
    }, [fetchOrders, fetchServiceBookings, orderView]),
  );

  const filtered = sortOrders(
    activeFilter === 0
      ? orders
      : orders.filter((o) => matchesOrderFilter(o.status, FILTERS[activeFilter])),
    orderSort,
  );

  const filteredServices = serviceBookings.filter((b) =>
    matchesServiceFilter(mapServiceBookingStatus(b.status), serviceFilter),
  );

  const hasActiveProductFilters = activeFilter !== 0 || orderSort !== 'newest';

  const openFilterSheet = () => {
    lightHaptic();
    setDraftFilter(activeFilter);
    setDraftSort(orderSort);
    setShowFilterSheet(true);
  };

  const applyFilterSheet = () => {
    lightHaptic();
    setActiveFilter(draftFilter);
    setOrderSort(draftSort);
    setShowFilterSheet(false);
  };

  const resetFilterSheet = () => {
    lightHaptic();
    setDraftFilter(0);
    setDraftSort('newest');
  };

  const openOrderDetail = (order: IOrderData) => {
    lightHaptic();
    navigation.navigate(DealerStackRoutes.DealerOrderDetail, { orderId: getOrderId(order) });
  };

  const handleStatusChange = (order: IOrderData) => {
    const next = getNextDealerOrderStatus(order.status);
    const label = getNextDealerOrderLabel(order.status);
    if (!next || !label) return;
    const orderId = getOrderId(order);
    Alert.alert(label, `Move order #${order.orderNumber} to "${getOrderStatusLabel(next)}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        onPress: async () => {
          try {
            lightHaptic();
            await updateDealerOrderStatus(orderId, next);
            await fetchOrders(true);
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to update order'));
          }
        },
      },
    ]);
  };

  const handleCancel = (order: IOrderData) => {
    if (!canCancelDealerOrder(order.status)) return;
    const orderId = getOrderId(order);
    Alert.alert('Cancel Order', `Cancel order #${order.orderNumber}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Order',
        style: 'destructive',
        onPress: async () => {
          try {
            lightHaptic();
            await updateDealerOrderStatus(orderId, 'CANCELLED_BY_DEALER');
            await fetchOrders(true);
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to cancel order'));
          }
        },
      },
    ]);
  };

  const handleServiceQuickAction = async (
    bookingId: string,
    action: 'accept' | 'start' | 'complete' | 'reject',
  ) => {
    lightHaptic();
    try {
      await updateServiceBookingStatus(bookingId, { status: dealerActionStatus(action) });
      await fetchServiceBookings(true);
      if (action === 'complete') successHaptic();
    } catch {
      // ignore
    }
  };

  const countByStatus = (filter: string) =>
    orders.filter((o) => matchesOrderFilter(o.status, filter)).length;

  const countByServiceFilter = (filter: BookingFilter) =>
    serviceBookings.filter((b) =>
      matchesServiceFilter(mapServiceBookingStatus(b.status), filter),
    ).length;

  const totalCount = orderView === 'products' ? orders.length : serviceBookings.length;

  const getHeaderIcon = (status: string) => {
    const label = getOrderStatusLabel(status);
    if (label === 'Pending') {
      return { icon: 'shopping-bag', bg: '#FEF3C7', color: '#F59E0B' };
    }
    if (label === 'Accepted') {
      return { icon: 'shopping-bag', bg: '#F2F2F2', color: '#FF1A1A' };
    }
    if (label === 'Packed') {
      return { icon: 'box', bg: '#F3E8FF', color: '#8B5CF6' };
    }
    return { icon: 'package', bg: '#F1F5F9', color: '#64748B' };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Orders</Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.72)' }]}>
              Manage and track all customer orders
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.notificationBtn}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.NotificationSettings);
              }}
            >
              <Feather name="bell" size={22} color={colors.headerForeground} />
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>3</Text>
              </View>
            </Pressable>
            <View style={[styles.totalBadge, { backgroundColor: '#E60012' }]}>
              <Text style={styles.totalBadgeText}>{totalCount} Total</Text>
            </View>
          </View>
        </View>

        <View style={[styles.typeToggle, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Pressable
            style={[styles.typeBtn, orderView === 'products' && styles.typeBtnActive]}
            onPress={() => {
              lightHaptic();
              setOrderView('products');
            }}
          >
            <Text style={[styles.typeText, orderView === 'products' && styles.typeTextActive]}>
              Products
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeBtn, orderView === 'services' && styles.typeBtnActive]}
            onPress={() => {
              lightHaptic();
              setOrderView('services');
            }}
          >
            <Text style={[styles.typeText, orderView === 'services' && styles.typeTextActive]}>
              Services
            </Text>
          </Pressable>
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {orderView === 'products'
              ? FILTERS.map((item, index) => {
                  const count = index === 0 ? orders.length : countByStatus(item);
                  const isSelected = activeFilter === index;
                  return (
                    <Pressable
                      key={item}
                      style={[
                        styles.filterChip,
                        isSelected
                          ? { backgroundColor: '#E60012' }
                          : { backgroundColor: colors.surfaceSecondary },
                      ]}
                      onPress={() => {
                        lightHaptic();
                        setActiveFilter(index);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          isSelected ? { color: '#ffffff' } : { color: colors.textPrimary },
                        ]}
                      >
                        {item}
                      </Text>
                      {count > 0 && (
                        <View
                          style={[
                            styles.filterCountBadge,
                            isSelected
                              ? { backgroundColor: 'rgba(255,255,255,0.3)' }
                              : { backgroundColor: colors.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterCountText,
                              isSelected ? { color: '#ffffff' } : { color: colors.textSecondary },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              : SERVICE_FILTERS.map((item) => {
                  const count = countByServiceFilter(item.key);
                  const isSelected = serviceFilter === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      style={[
                        styles.filterChip,
                        isSelected
                          ? { backgroundColor: '#E60012' }
                          : { backgroundColor: colors.surfaceSecondary },
                      ]}
                      onPress={() => {
                        lightHaptic();
                        setServiceFilter(item.key);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          isSelected ? { color: '#ffffff' } : { color: colors.textPrimary },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {count > 0 && (
                        <View
                          style={[
                            styles.filterCountBadge,
                            isSelected
                              ? { backgroundColor: 'rgba(255,255,255,0.3)' }
                              : { backgroundColor: colors.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterCountText,
                              isSelected ? { color: '#ffffff' } : { color: colors.textSecondary },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}

            {orderView === 'products' ? (
              <Pressable
                style={[
                  styles.sliderIconBtn,
                  hasActiveProductFilters && { backgroundColor: '#FEE2E2' },
                ]}
                onPress={openFilterSheet}
              >
                <Feather
                  name="sliders"
                  size={16}
                  color={hasActiveProductFilters ? '#E60012' : colors.textSecondary}
                />
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </ChromeHeader>

      {orderView === 'products' ? (
      <FlatList
        data={filtered}
        keyExtractor={(item) => getOrderId(item)}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} />
        }
        renderItem={({ item }) => {
          const statusColor = getOrderStatusColor(item.status);
          const nextStatus = getNextDealerOrderStatus(item.status);
          const nextLabel = getNextDealerOrderLabel(item.status);
          const canAdvance = nextStatus !== null && canCancelDealerOrder(item.status);
          const headerIconInfo = getHeaderIcon(item.status);
          const { date, time } = formatOrderDateParts(item.createdAt);
          const statusLabel = getOrderStatusLabel(item.status);

          return (
            <Pressable onPress={() => openOrderDetail(item)}>
            <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.headerIconContainer, { backgroundColor: headerIconInfo.bg }]}>
                    <Feather name={headerIconInfo.icon as any} size={16} color={headerIconInfo.color} />
                  </View>
                  <View>
                    <Text style={[styles.orderIdText, { color: colors.textPrimary }]}>#{item.orderNumber}</Text>
                    <Text style={[styles.orderDateText, { color: colors.textTertiary }]}>
                      {date} • {time}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <Text style={[styles.statusTextLabel, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.cardBody}>
                <View style={styles.customerCol}>
                  <View style={styles.infoRow}>
                    <Feather name="user" size={14} color={colors.textSecondary} />
                    <Text style={[styles.customerVal, { color: colors.textPrimary }]}>
                      {item.customer?.name || 'Customer'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Feather name="phone" size={14} color={colors.textSecondary} />
                    <Text style={[styles.customerVal, { color: colors.textSecondary }]}>
                      {item.customer?.phone || '—'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={14} color={colors.textSecondary} />
                    <Text style={[styles.customerVal, { color: colors.textSecondary }]} numberOfLines={1}>
                      {getOrderShippingAddress(item)}
                    </Text>
                  </View>
                </View>

                <View style={styles.productCol}>
                  <OrderItemThumbnail
                    uri={getOrderItemImageUri(orderItemImages, item)}
                    style={styles.productThumbnail}
                    iconSize={18}
                  />
                  <View style={styles.productMeta}>
                    <Text style={[styles.productTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {getOrderPrimaryItemName(item)}
                    </Text>
                    <Text style={[styles.productQty, { color: colors.textSecondary }]}>
                      × {getOrderItemQty(item)}
                    </Text>
                    <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardActionsRow}>
                {canAdvance && nextLabel ? (
                  statusLabel === 'Packed' ? (
                    <Pressable
                      style={[styles.fullWidthActionBtn, { backgroundColor: '#ECFDF5' }]}
                      onPress={() => handleStatusChange(item)}
                    >
                      <Feather name="check" size={15} color="#10B981" />
                      <Text style={[styles.fullWidthActionText, { color: '#10B981' }]}>{nextLabel}</Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        style={[styles.splitActionBtn, { backgroundColor: statusLabel === 'Pending' ? '#FFFBEB' : '#F2F2F2' }]}
                        onPress={() => handleStatusChange(item)}
                      >
                        <Feather name="arrow-right" size={15} color={statusColor} />
                        <Text style={[styles.splitActionText, { color: statusColor }]}>{nextLabel}</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.splitActionBtn, { backgroundColor: '#FEF2F2' }]}
                        onPress={() => handleCancel(item)}
                      >
                        <Feather name="x" size={15} color="#EF4444" />
                        <Text style={[styles.splitActionText, { color: '#EF4444' }]}>Cancel</Text>
                      </Pressable>
                    </>
                  )
                ) : (
                  <Pressable
                    style={[styles.fullWidthActionBtn, { backgroundColor: colors.muted }]}
                    onPress={() => openOrderDetail(item)}
                  >
                    <Feather name="eye" size={15} color={colors.textPrimary} />
                    <Text style={[styles.fullWidthActionText, { color: colors.textPrimary }]}>View Order Details</Text>
                  </Pressable>
                )}
              </View>
            </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <GarageOrdersListSkeleton />
          ) : (
            <View style={styles.empty}>
              <Feather name="clipboard" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders found</Text>
            </View>
          )
        }
      />
      ) : servicesLoading && serviceBookings.length === 0 ? (
        <View style={styles.skeletonWrap}>
          <GarageBookingsListSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchServiceBookings(true)} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No service bookings</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mapped = mapServiceBookingToCustomerBooking(item);
            const statusColor = getStatusColor(mapped.status);
            const dateLabel = item.bookingDate
              ? new Date(item.bookingDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';

            return (
              <Pressable
                style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  navigation.navigate(DealerStackRoutes.DealerBookingDetail, {
                    bookingId: item.id,
                    bookingType: 'service',
                  })
                }
              >
                <View style={styles.serviceCardTop}>
                  <View style={[styles.serviceBadge, { backgroundColor: `${statusColor}18` }]}>
                    <Text style={[styles.serviceBadgeText, { color: statusColor }]}>
                      {getStatusLabel(mapped.status)}
                    </Text>
                  </View>
                  <Text style={[styles.serviceBookingId, { color: colors.textTertiary }]}>{item.id}</Text>
                </View>

                <Text style={[styles.serviceName, { color: colors.textPrimary }]}>
                  {item.serviceName ?? item.serviceRequest}
                </Text>
                <Text style={[styles.serviceCustomer, { color: colors.textSecondary }]}>
                  {item.customerName ?? 'Customer'}
                </Text>
                <Text style={[styles.serviceMeta, { color: colors.textSecondary }]}>
                  {item.vehicleInfo?.brand} {item.vehicleInfo?.model} •{' '}
                  {item.vehicleInfo?.registrationNumber}
                </Text>
                <Text style={[styles.serviceMeta, { color: colors.textSecondary }]}>
                  {dateLabel} • {item.bookingTime}
                </Text>

                <View style={styles.serviceActions}>
                  {item.status === 'new' && (
                    <>
                      <Pressable
                        style={styles.rejectBtn}
                        onPress={() => handleServiceQuickAction(item.id, 'reject')}
                      >
                        <Text style={styles.rejectText}>Reject</Text>
                      </Pressable>
                      <Pressable
                        style={styles.acceptBtn}
                        onPress={() => handleServiceQuickAction(item.id, 'accept')}
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </Pressable>
                    </>
                  )}
                  {item.status === 'scheduled' && (
                    <Pressable
                      style={styles.acceptBtn}
                      onPress={() => handleServiceQuickAction(item.id, 'start')}
                    >
                      <Text style={styles.acceptText}>Start Service</Text>
                    </Pressable>
                  )}
                  {item.status === 'in_progress' && (
                    <Pressable
                      style={styles.acceptBtn}
                      onPress={() => handleServiceQuickAction(item.id, 'complete')}
                    >
                      <Text style={styles.acceptText}>Mark Completed</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <View style={[styles.bottomPerformanceBanner, { backgroundColor: '#F2F2F2', borderTopColor: colors.border }]}>
        <View style={styles.performanceLeft}>
          <View style={[styles.analyticsIconWrapper, { backgroundColor: '#F2F2F2' }]}>
            <Feather name="trending-up" size={18} color={colors.icon} />
          </View>
          <View>
            <Text style={[styles.performanceTitle, { color: colors.textPrimary }]}>Track your business performance</Text>
            <Text style={[styles.performanceSub, { color: colors.textSecondary }]}>View detailed order analytics and reports</Text>
          </View>
        </View>
        <Pressable style={styles.viewAnalyticsBtn} onPress={() => successHaptic()}>
          <Text style={styles.viewAnalyticsText}>View Analytics</Text>
          <Feather name="arrow-right" size={12} color="#fff" />
        </Pressable>
      </View>

      <BottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        presentation="sheet"
        maxHeightRatio={0.75}
        contentStyle={styles.filterSheetContent}
      >
        <View style={styles.filterSheetHandle} />
        <View style={styles.filterSheetHeader}>
          <Text style={[styles.filterSheetTitle, { color: colors.textPrimary }]}>Filter Orders</Text>
          <Pressable
            onPress={() => {
              lightHaptic();
              setShowFilterSheet(false);
            }}
            hitSlop={8}
          >
            <Feather name="x" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Status</Text>
        <View style={styles.filterOptionsWrap}>
          {FILTERS.map((item, index) => {
            const selected = draftFilter === index;
            const count = index === 0 ? orders.length : countByStatus(item);
            return (
              <Pressable
                key={item}
                style={[
                  styles.filterOptionChip,
                  {
                    backgroundColor: selected ? '#E60012' : colors.surfaceSecondary,
                    borderColor: selected ? '#E60012' : colors.border,
                  },
                ]}
                onPress={() => {
                  lightHaptic();
                  setDraftFilter(index);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    { color: selected ? '#ffffff' : colors.textPrimary },
                  ]}
                >
                  {item}
                  {count > 0 ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Sort by</Text>
        <View style={styles.sortOptionsWrap}>
          {SORT_OPTIONS.map((option) => {
            const selected = draftSort === option.key;
            return (
              <Pressable
                key={option.key}
                style={[
                  styles.sortOptionRow,
                  { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
                  selected && { borderColor: '#E60012', backgroundColor: '#FEF2F2' },
                ]}
                onPress={() => {
                  lightHaptic();
                  setDraftSort(option.key);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: selected ? '#E60012' : colors.textPrimary },
                  ]}
                >
                  {option.label}
                </Text>
                {selected ? <Feather name="check" size={16} color="#E60012" /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filterSheetActions}>
          <Pressable
            style={[styles.filterResetBtn, { borderColor: colors.border }]}
            onPress={resetFilterSheet}
          >
            <Text style={[styles.filterResetText, { color: colors.textPrimary }]}>Reset</Text>
          </Pressable>
          <Pressable style={styles.filterApplyBtn} onPress={applyFilterSheet}>
            <Text style={styles.filterApplyText}>Apply</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    height: 44,
    overflow: 'hidden',
    alignItems: 'center',
  },
  typeBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnActive: { backgroundColor: '#E60012' },
  typeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.72)' },
  typeTextActive: { color: '#ffffff' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
    padding: 4,
  },
  redBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadgeText: { color: '#ffffff', fontSize: 8, fontFamily: 'Inter_700Bold' },
  totalBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  totalBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  filtersWrapper: {
    paddingVertical: 8,
  },
  skeletonWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  filtersRow: { gap: 8, paddingRight: 16, alignItems: 'center' },
  serviceCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  serviceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  serviceBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  serviceBookingId: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  serviceName: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 4 },
  serviceCustomer: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  serviceMeta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  serviceActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rejectBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: '#EF4444', fontSize: 13, fontFamily: 'Inter_700Bold' },
  acceptBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E60012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: { color: '#ffffff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  filterCountBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  sliderIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 16 },
  orderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIdText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  orderDateText: { fontSize: 10, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextLabel: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginVertical: 12 },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  customerCol: {
    flex: 1.2,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerVal: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  productCol: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  productThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  productMeta: {
    flex: 1,
  },
  productTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  productQty: { fontSize: 10, marginTop: 1 },
  productPrice: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 2 },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  splitActionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  splitActionText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  fullWidthActionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fullWidthActionText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  bottomPerformanceBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  performanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyticsIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  performanceSub: { fontSize: 10, marginTop: 1 },
  viewAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewAnalyticsText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  filterSheetContent: { paddingHorizontal: 16, paddingTop: 8 },
  filterSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterSheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  filterSectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterOptionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterOptionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sortOptionsWrap: { gap: 8, marginBottom: 20 },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sortOptionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  filterSheetActions: { flexDirection: 'row', gap: 10 },
  filterResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  filterApplyBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E60012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
