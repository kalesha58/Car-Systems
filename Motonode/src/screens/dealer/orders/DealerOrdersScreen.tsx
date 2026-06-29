import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { DealerOrder } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

const FILTERS = ['All', 'Pending', 'Accepted', 'Packed', 'Ready', 'Delivered', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  packed: '#8B5CF6',
  ready: '#10B981',
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

// Mock product images for dealer orders
const ORDER_IMAGES: Record<string, string> = {
  'ORD-1001': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80', // Engine Oil
  'ORD-1002': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80', // Service
  'ORD-1003': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80', // Battery
};

export function DealerOrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<DealerStackParamList>>();
  const { orders, updateOrderStatus } = useDealer();
  const [activeFilter, setActiveFilter] = useState(0);
  const [orderView, setOrderView] = useState<'products' | 'services'>('products');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

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

  const getHeaderIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: 'shopping-bag', bg: '#FEF3C7', color: '#F59E0B' };
      case 'accepted':
        return { icon: 'shopping-bag', bg: '#EFF6FF', color: '#3B82F6' };
      case 'packed':
        return { icon: 'box', bg: '#F3E8FF', color: '#8B5CF6' };
      default:
        return { icon: 'package', bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Redesigned Mockup Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Orders</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Manage and track all customer orders
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.notificationBtn}>
              <Feather name="bell" size={22} color={colors.textPrimary} />
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>3</Text>
              </View>
            </Pressable>
            <View style={[styles.totalBadge, { backgroundColor: '#2563EB' }]}>
              <Text style={styles.totalBadgeText}>{orders.length} Total</Text>
            </View>
          </View>
        </View>

        <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
          <Pressable
            style={[styles.typeBtn, orderView === 'products' && styles.typeBtnActive]}
            onPress={() => setOrderView('products')}
          >
            <Text style={[styles.typeText, orderView === 'products' && styles.typeTextActive]}>
              Products
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeBtn, orderView === 'services' && styles.typeBtnActive]}
            onPress={() => {
              lightHaptic();
              navigation.navigate(DealerStackRoutes.ServiceBookings);
            }}
          >
            <Text style={[styles.typeText, orderView === 'services' && styles.typeTextActive]}>
              Services
            </Text>
          </Pressable>
        </View>

        {/* Dynamic Filters Row */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTERS.map((item, index) => {
              const count = index === 0 ? orders.length : countByStatus(item.toLowerCase());
              const isSelected = activeFilter === index;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.filterChip,
                    isSelected ? { backgroundColor: '#2563EB' } : { backgroundColor: '#F1F5F9' },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setActiveFilter(index);
                  }}
                >
                  <Text style={[styles.filterText, isSelected ? { color: '#ffffff' } : { color: colors.textPrimary }]}>
                    {item}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.filterCountBadge, isSelected ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: '#E2E8F0' }]}>
                      <Text style={[styles.filterCountText, isSelected ? { color: '#ffffff' } : { color: colors.textSecondary }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
            
            {/* Filter Slider icon */}
            <Pressable style={styles.sliderIconBtn}>
              <Feather name="sliders" size={16} color={colors.textSecondary} />
            </Pressable>
          </ScrollView>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] || '#2563EB';
          const canAdvance = NEXT_STATUS[item.status] !== null && item.status !== 'cancelled';
          const headerIconInfo = getHeaderIcon(item.status);
          
          return (
            <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              
              {/* Card Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.headerIconContainer, { backgroundColor: headerIconInfo.bg }]}>
                    <Feather name={headerIconInfo.icon as any} size={16} color={headerIconInfo.color} />
                  </View>
                  <View>
                    <Text style={[styles.orderIdText, { color: colors.textPrimary }]}>#{item.id}</Text>
                    <Text style={[styles.orderDateText, { color: colors.textTertiary }]}>
                      {item.date} • {item.time}
                    </Text>
                  </View>
                </View>
                
                {/* Status Badges */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  {item.status === 'pending' && <Feather name="clock" size={12} color={statusColor} style={{ marginRight: 4 }} />}
                  {item.status === 'accepted' && <Feather name="check" size={12} color={statusColor} style={{ marginRight: 4 }} />}
                  {item.status === 'packed' && <Feather name="package" size={12} color={statusColor} style={{ marginRight: 4 }} />}
                  <Text style={[styles.statusTextLabel, { color: statusColor }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Card Body Grid (Left Customer info, Right Product Preview) */}
              <View style={styles.cardBody}>
                
                {/* Left Customer Info column */}
                <View style={styles.customerCol}>
                  <View style={styles.infoRow}>
                    <Feather name="user" size={14} color={colors.textSecondary} />
                    <Text style={[styles.customerVal, { color: colors.textPrimary }]}>{item.customer}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Feather name="phone" size={14} color={colors.textSecondary} />
                    <Text style={[styles.customerVal, { color: colors.textSecondary }]}>{item.phone}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={14} color={colors.textSecondary} />
                    <Text style={[styles.customerVal, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </View>

                {/* Right Product Preview column */}
                <View style={styles.productCol}>
                  <Image
                    source={{ uri: ORDER_IMAGES[item.id] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80' }}
                    style={styles.productThumbnail}
                  />
                  <View style={styles.productMeta}>
                    <Text style={[styles.productTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.item}
                    </Text>
                    <Text style={[styles.productQty, { color: colors.textSecondary }]}>× {item.qty}</Text>
                    <Text style={[styles.productPrice, { color: '#2563EB' }]}>
                      ₹{item.total.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardActionsRow}>
                {canAdvance ? (
                  item.status === 'packed' ? (
                    // Spans full width for packed
                    <Pressable
                      style={[styles.fullWidthActionBtn, { backgroundColor: '#ECFDF5' }]}
                      onPress={() => handleStatusChange(item)}
                    >
                      <Feather name="check" size={15} color="#10B981" />
                      <Text style={[styles.fullWidthActionText, { color: '#10B981' }]}>{NEXT_LABEL[item.status]}</Text>
                    </Pressable>
                  ) : (
                    // Split buttons for pending & accepted
                    <>
                      <Pressable
                        style={[styles.splitActionBtn, { backgroundColor: item.status === 'pending' ? '#FFFBEB' : '#EFF6FF' }]}
                        onPress={() => handleStatusChange(item)}
                      >
                        <Feather name="arrow-right" size={15} color={statusColor} />
                        <Text style={[styles.splitActionText, { color: statusColor }]}>{NEXT_LABEL[item.status]}</Text>
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
                  // General View details for finished/delivered
                  <Pressable style={[styles.fullWidthActionBtn, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={[styles.fullWidthActionText, { color: colors.textPrimary }]}>View Order Details</Text>
                  </Pressable>
                )}
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

      {/* Redesigned Bottom Business Performance Banner */}
      <View style={[styles.bottomPerformanceBanner, { backgroundColor: '#EFF6FF', borderTopColor: colors.border }]}>
        <View style={styles.performanceLeft}>
          <View style={[styles.analyticsIconWrapper, { backgroundColor: '#DBEAFE' }]}>
            <Feather name="trending-up" size={18} color="#2563EB" />
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  typeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginTop: 12 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#2563EB' },
  typeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
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
  filtersRow: { gap: 8, paddingRight: 16, alignItems: 'center' },
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
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewAnalyticsText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
});
