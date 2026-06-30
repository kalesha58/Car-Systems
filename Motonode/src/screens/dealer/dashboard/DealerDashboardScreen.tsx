import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';


import { DealerStackRoutes, DealerTabRoutes } from '@constants/routes';
import { ChromeHeader } from '@components/common';
import { useAuth, useBookings, useDealer } from '@context/index';
import {
  DEALER_TYPE_ILLUSTRATIONS,
  DEALER_TYPE_LIST,
  type DealerType,
} from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { useDealerOnboardingStatus } from '@hooks/useDealerOnboardingStatus';
import {
  getDealerInventoryVehicles,
  getDealerProducts,
  getDealerServices,
} from '@services/dealer.service';
import { getDealerOrderStats, getDealerOrders } from '@services/order.service';
import { getDealerTestDrives } from '@services/testDrive.service';
import type { IOrderData } from '@app-types/order';
import { themeLight } from '@theme/colors';
import { elevatedCardShadow } from '@utils/shadows';
import {
  formatCurrency,
  formatOrderDateParts,
  getOrderId,
  getOrderPrimaryItemName,
  getOrderStatusColor,
  getOrderStatusLabel,
  getProductStockStatus,
} from '@utils/displayMappers';
import { lightHaptic } from '@utils/haptics';

type DealerTabParamList = {
  [DealerTabRoutes.Dashboard]: undefined;
  [DealerTabRoutes.Inventory]: undefined;
  [DealerTabRoutes.Orders]: undefined;
  [DealerTabRoutes.Drive]: undefined;
  [DealerTabRoutes.Profile]: undefined;
};

type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
  [DealerStackRoutes.ServiceBookings]: undefined;
};

type DealerDashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DealerTabParamList, typeof DealerTabRoutes.Dashboard>,
  NativeStackNavigationProp<DealerStackParamList>
>;

const ORDER_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80',
};

function formatRevenue(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function DealerDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DealerDashboardNavigationProp>();
  const { user } = useAuth();
  const { capabilities, dealerType } = useDealer();
  const { canAccessDealerApis } = useDealerOnboardingStatus();
  const { getPendingServiceCount, loadDealerBookings } = useBookings();
  const pendingServiceBookings = getPendingServiceCount();
  const [storeOpen, setStoreOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [testDriveCount, setTestDriveCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenueMtd, setRevenueMtd] = useState(0);
  const [recentOrders, setRecentOrders] = useState<IOrderData[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  const resolvedDealerType = (dealerType ?? 'Automobile Showroom') as DealerType;
  const dealerTypeMeta = DEALER_TYPE_LIST.find((d) => d.type === resolvedDealerType);
  const revenueIllustration =
    DEALER_TYPE_ILLUSTRATIONS[resolvedDealerType] ??
    DEALER_TYPE_ILLUSTRATIONS['Automobile Showroom'];
  const illustrationTint = dealerTypeMeta?.color ?? '#E60012';

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fetchDashboardData = useCallback(async () => {
    if (!canAccessDealerApis) {
      setProductCount(0);
      setVehicleCount(0);
      setServiceCount(0);
      setTestDriveCount(0);
      setOrderCount(0);
      setRevenueMtd(0);
      setRecentOrders([]);
      setLowStockCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [productsRes, vehiclesRes, servicesRes, orderStats, orders, testDrivesRes] =
        await Promise.all([
          capabilities.hasProducts ? getDealerProducts({ limit: 1000 }) : Promise.resolve(null),
          capabilities.hasVehicles ? getDealerInventoryVehicles({ limit: 1000 }) : Promise.resolve(null),
          capabilities.hasServices ? getDealerServices({ limit: 1000 }) : Promise.resolve(null),
          getDealerOrderStats(),
          getDealerOrders({ limit: 5 }),
          capabilities.hasDrive ? getDealerTestDrives({ limit: 100 }) : Promise.resolve(null),
        ]);

      const products = productsRes?.Response?.products ?? [];
      const vehicles = vehiclesRes?.Response?.vehicles ?? [];
      const services = servicesRes?.Response?.services ?? [];
      const testDrives = testDrivesRes?.Response?.testDrives ?? [];

      setProductCount(products.length);
      setVehicleCount(vehicles.length);
      setServiceCount(services.length);
      setTestDriveCount(testDrives.length);
      setOrderCount(orderStats.total ?? orders.length);
      setRevenueMtd(orderStats.totalRevenue ?? 0);
      setRecentOrders(orders);
      setLowStockCount(
        products.filter((p) => {
          const status = getProductStockStatus(p.stock);
          return status === 'low_stock' || status === 'out_of_stock';
        }).length,
      );
    } catch {
      setProductCount(0);
      setVehicleCount(0);
      setServiceCount(0);
      setTestDriveCount(0);
      setOrderCount(0);
      setRevenueMtd(0);
      setRecentOrders([]);
      setLowStockCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    canAccessDealerApis,
    capabilities.hasProducts,
    capabilities.hasVehicles,
    capabilities.hasServices,
    capabilities.hasDrive,
  ]);

  useFocusEffect(
    useCallback(() => {
      void fetchDashboardData();
      if (canAccessDealerApis) {
        void loadDealerBookings();
      }
    }, [fetchDashboardData, loadDealerBookings, canAccessDealerApis]),
  );

  const stats = [
    { label: 'Products', value: String(productCount), icon: 'box', color: '#8B5CF6', bg: '#F3E8FF', trend: '0%' },
    { label: 'Vehicles', value: String(vehicleCount), icon: 'truck', color: themeLight.textSecondary, bg: '#F2F2F2', trend: '0%' },
    { label: 'Services', value: String(serviceCount), icon: 'tool', color: '#10B981', bg: '#ECFDF5', trend: '0%' },
    { label: 'Test Drives', value: String(testDriveCount), icon: 'calendar', color: '#F59E0B', bg: '#FFFBEB', trend: '0%' },
    { label: 'Orders', value: String(orderCount), icon: 'shopping-bag', color: '#EF4444', bg: '#FEF2F2', trend: '0%' },
    { label: 'Revenue (MTD)', value: formatRevenue(revenueMtd), icon: 'dollar-sign', color: '#F59E0B', bg: '#FFFBEB', trend: '0%' },
  ];

  const quickActions = [
    { label: 'Add Product', icon: 'plus', color: '#8B5CF6', bg: '#F3E8FF', route: DealerStackRoutes.ProductForm },
    { label: 'Add Service', icon: 'tool', color: '#10B981', bg: '#ECFDF5', route: DealerStackRoutes.ServiceForm },
    { label: 'Service Bookings', icon: 'calendar', color: themeLight.textSecondary, bg: '#F2F2F2', route: DealerStackRoutes.ServiceBookings, badge: pendingServiceBookings },
    { label: 'New Order', icon: 'shopping-bag', color: '#F59E0B', bg: '#FFFBEB', route: DealerTabRoutes.Orders },
    { label: 'Test Drive', icon: 'wind', color: '#6366F1', bg: '#EEF2FF', route: DealerTabRoutes.Drive },
  ];

  const handleQuickAction = (route: string) => {
    lightHaptic();
    if (!route) return;
    if (route === DealerTabRoutes.Drive) {
      navigation.navigate(DealerTabRoutes.Drive);
      return;
    }
    if (route === DealerTabRoutes.Orders) {
      navigation.navigate(DealerTabRoutes.Orders);
      return;
    }
    if (route === DealerStackRoutes.ProductForm) {
      navigation.navigate(DealerStackRoutes.ProductForm, {});
      return;
    }
    if (route === DealerStackRoutes.ServiceForm) {
      navigation.navigate(DealerStackRoutes.ServiceForm, {});
      return;
    }
    if (route === DealerStackRoutes.ServiceBookings) {
      navigation.navigate(DealerStackRoutes.ServiceBookings);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: 'rgba(255,255,255,0.72)' }]}>
              {dealerType ?? 'Automobile Showroom'}
            </Text>
            <Text style={[styles.storeName, { color: colors.headerForeground }]}>
              {user?.name ?? 'Speed Auto Parts'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.notificationBtn} onPress={() => lightHaptic()}>
              <Feather name="bell" size={20} color={colors.headerForeground} />
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>3</Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.openStatusBtn, { borderColor: 'rgba(255,255,255,0.28)' }]}
              onPress={() => {
                lightHaptic();
                setStoreOpen(!storeOpen);
              }}
            >
              <View style={[styles.statusDot, { backgroundColor: storeOpen ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusText, { color: storeOpen ? '#10B981' : '#EF4444' }]}>
                {storeOpen ? 'Open' : 'Closed'}
              </Text>
              <Feather name="chevron-down" size={12} color="rgba(255,255,255,0.72)" />
            </Pressable>
          </View>
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Today's Revenue Widget Card */}
        <View
          style={[
            styles.revenueCard,
            elevatedCardShadow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.revenueLeft}>
            <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Today's Revenue</Text>
            <Text style={[styles.revenueValue, { color: colors.textPrimary }]}>
              {formatRevenue(revenueMtd)}
            </Text>

            <View style={styles.revenueTrendRow}>
              <View style={styles.trendPill}>
                <Feather name="trending-up" size={10} color="#10B981" style={{ marginRight: 3 }} />
                <Text style={styles.trendPillText}>+8.4% today</Text>
              </View>
              <Text style={[styles.vsYesterdayText, { color: colors.textSecondary }]}>vs yesterday</Text>
            </View>
          </View>

          <View style={[styles.revenueIllustrationWrap, { backgroundColor: `${illustrationTint}14` }]}>
            <Image
              source={{ uri: revenueIllustration }}
              style={styles.revenueIllustration}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* 6 Statistics grid (2 columns, 3 rows) */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCell, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statCellHeader}>
                <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                  <Feather name={s.icon as any} size={14} color={s.color} />
                </View>
                <View style={styles.statTrendPill}>
                  <Feather name="trending-up" size={10} color="#10B981" style={{ marginRight: 2 }} />
                  <Text style={styles.statTrendText}>{s.trend}</Text>
                </View>
              </View>
              <Text style={[styles.statValueText, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions horizontal scroll list */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <Pressable>
            <Text style={styles.viewAllLink}>View All</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScrollRow}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              style={styles.actionBtnCell}
              onPress={() => handleQuickAction(action.route)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                <Feather name={action.icon as any} size={16} color={action.color} />
                {'badge' in action && (action.badge ?? 0) > 0 && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{action.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.actionLabelText, { color: colors.textPrimary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Recent Orders segment */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Orders</Text>
          <Pressable onPress={() => navigation.navigate(DealerTabRoutes.Orders)}>
            <Text style={styles.viewAllLink}>View All</Text>
          </Pressable>
        </View>

        <View style={[styles.ordersContainerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator color="#E60012" />
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>No recent orders</Text>
            </View>
          ) : (
            recentOrders.map((order, i) => {
              const stColor = getOrderStatusColor(order.status);
              const { time } = formatOrderDateParts(order.createdAt);
              const customerName = order.customer?.name || 'Customer';
              return (
                <Pressable
                  key={getOrderId(order)}
                  style={[
                    styles.orderRowItem,
                    i < recentOrders.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    navigation.navigate(DealerTabRoutes.Orders);
                  }}
                >
                  <Image
                    source={{ uri: ORDER_IMAGES.default }}
                    style={styles.orderProductThumb}
                  />

                  <View style={styles.orderMidCol}>
                    <Text style={[styles.orderCustomerName, { color: colors.textPrimary }]}>{customerName}</Text>
                    <Text style={[styles.orderItemName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {getOrderPrimaryItemName(order)}
                    </Text>
                    <Text style={[styles.orderCodeText, { color: colors.textTertiary }]}>#{order.orderNumber}</Text>
                  </View>

                  <View style={styles.orderRightCol}>
                    <Text style={[styles.orderPriceTag, { color: colors.textPrimary }]}>
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: stColor + '15' }]}>
                      <Text style={[styles.statusBadgeText, { color: stColor }]}>
                        {getOrderStatusLabel(order.status)}
                      </Text>
                    </View>
                    <Text style={[styles.orderTimeText, { color: colors.textTertiary }]}>{time}</Text>
                  </View>

                  <Feather name="chevron-right" size={16} color={colors.textTertiary} style={{ marginLeft: 4 }} />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Low Stock Alert soft banner */}
        <View style={styles.lowStockAlertCard}>
          <View style={styles.alertLeft}>
            <View style={styles.alertIconBox}>
              <Feather name="alert-triangle" size={16} color="#D97706" />
            </View>
            <View>
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
              <Text style={styles.alertSubtitle}>
                {lowStockCount > 0
                  ? `${lowStockCount} products are running low`
                  : 'Inventory levels look healthy'}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.alertBtn}
            onPress={() => {
              lightHaptic();
              navigation.navigate(DealerTabRoutes.Inventory);
            }}
          >
            <Text style={styles.alertBtnText}>View Items</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  storeName: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 1 },
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
  openStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  
  content: { padding: 16, gap: 16 },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  revenueLeft: {
    gap: 4,
    flex: 1,
    paddingRight: 12,
  },
  revenueLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  revenueValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  revenueTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendPillText: { color: '#10B981', fontSize: 9, fontFamily: 'Inter_700Bold' },
  vsYesterdayText: { fontSize: 10 },
  revenueIllustrationWrap: {
    width: 96,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueIllustration: {
    width: '100%',
    height: '100%',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCell: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  statCellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statTrendText: { color: '#10B981', fontSize: 9, fontFamily: 'Inter_700Bold' },
  statValueText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statLabelText: { fontSize: 10, fontFamily: 'Inter_500Medium' },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  viewAllLink: { color: themeLight.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold' },

  actionsScrollRow: {
    gap: 12,
    paddingRight: 16,
  },
  actionBtnCell: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  actionLabelText: { fontSize: 10, fontFamily: 'Inter_700Bold', textAlign: 'center' },

  ordersContainerCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  orderRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  orderProductThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  orderMidCol: {
    flex: 1.2,
    gap: 2,
  },
  orderCustomerName: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  orderItemName: { fontSize: 10 },
  orderCodeText: { fontSize: 9 },
  orderRightCol: {
    alignItems: 'flex-end',
    gap: 3,
    flex: 0.8,
  },
  orderPriceTag: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  orderTimeText: { fontSize: 9 },

  lowStockAlertCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#B45309' },
  alertSubtitle: { fontSize: 10, color: '#B45309', marginTop: 1 },
  alertBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertBtnText: { color: '#ffffff', fontSize: 10, fontFamily: 'Inter_700Bold' },
});
