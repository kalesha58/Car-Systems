import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';


import { DealerStackRoutes, DealerTabRoutes } from '@constants/routes';
import { useAuth, useBookings, useDealer } from '@context/index';
import {
  DEALER_TYPE_ILLUSTRATIONS,
  DEALER_TYPE_LIST,
  type DealerType,
} from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { elevatedCardShadow } from '@utils/shadows';
import { lightHaptic, successHaptic } from '@utils/haptics';

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

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  completed: '#3B82F6',
  rejected: '#EF4444',
};

const ORDER_IMAGES: Record<string, string> = {
  'Arjun Sharma': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80',
  'Priya Nair': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80',
  'Rohit Verma': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80',
};

const MOCK_RECENT_ORDERS = [
  {
    id: 'o1',
    customer: 'Arjun Sharma',
    item: 'Castrol GTX 20W-50 5L',
    orderNumber: '#ORD-1025',
    total: 2300,
    status: 'pending',
    time: '10:32 AM',
  },
  {
    id: 'o2',
    customer: 'Priya Nair',
    item: 'Amaron PRO 35Ah Battery',
    orderNumber: '#ORD-1024',
    total: 1800,
    status: 'confirmed',
    time: 'Yesterday',
  },
  {
    id: 'o3',
    customer: 'Rohit Verma',
    item: 'MRF Zapper ES 90/90-17',
    orderNumber: '#ORD-1023',
    total: 950,
    status: 'completed',
    time: '28 Jun 2026',
  },
];

export function DealerDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DealerDashboardNavigationProp>();
  const { user, switchRole } = useAuth();
  const { capabilities, orders, products, vehicles, services, driveBookings, dealerType } =
    useDealer();
  const { getPendingServiceCount } = useBookings();
  const pendingServiceBookings = getPendingServiceCount('d1');
  const [storeOpen, setStoreOpen] = useState(true);

  const resolvedDealerType = (dealerType ?? 'Automobile Showroom') as DealerType;
  const dealerTypeMeta = DEALER_TYPE_LIST.find((d) => d.type === resolvedDealerType);
  const revenueIllustration =
    DEALER_TYPE_ILLUSTRATIONS[resolvedDealerType] ??
    DEALER_TYPE_ILLUSTRATIONS['Automobile Showroom'];
  const illustrationTint = dealerTypeMeta?.color ?? '#2563EB';

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const displayOrders = MOCK_RECENT_ORDERS;

  const stats = [
    { label: 'Products', value: String(products.length || 10), icon: 'box', color: '#8B5CF6', bg: '#F3E8FF', trend: '0%' },
    { label: 'Vehicles', value: String(vehicles.length || 6), icon: 'truck', color: '#2563EB', bg: '#EFF6FF', trend: '0%' },
    { label: 'Services', value: String(services.length || 8), icon: 'tool', color: '#10B981', bg: '#ECFDF5', trend: '0%' },
    { label: 'Test Drives', value: String(driveBookings.length || 6), icon: 'calendar', color: '#F59E0B', bg: '#FFFBEB', trend: '5%' },
    { label: 'Orders', value: String(orders.length || 4), icon: 'shopping-bag', color: '#EF4444', bg: '#FEF2F2', trend: '12%' },
    { label: 'Revenue (MTD)', value: '₹2.4L', icon: 'dollar-sign', color: '#F59E0B', bg: '#FFFBEB', trend: '8%' },
  ];

  const quickActions = [
    { label: 'Add Product', icon: 'plus', color: '#8B5CF6', bg: '#F3E8FF', route: DealerStackRoutes.ProductForm },
    { label: 'Add Service', icon: 'tool', color: '#10B981', bg: '#ECFDF5', route: DealerStackRoutes.ServiceForm },
    { label: 'Service Bookings', icon: 'calendar', color: '#2563EB', bg: '#EFF6FF', route: DealerStackRoutes.ServiceBookings, badge: pendingServiceBookings },
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
      
      {/* Header bar */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {dealerType ?? 'Automobile Showroom'}
            </Text>
            <Text style={[styles.storeName, { color: colors.textPrimary }]}>
              {user?.name ?? 'Speed Auto Parts'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.notificationBtn} onPress={() => lightHaptic()}>
              <Feather name="bell" size={20} color={colors.textPrimary} />
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>3</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.openStatusBtn}
              onPress={() => {
                lightHaptic();
                setStoreOpen(!storeOpen);
              }}
            >
              <View style={[styles.statusDot, { backgroundColor: storeOpen ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusText, { color: storeOpen ? '#10B981' : '#EF4444' }]}>
                {storeOpen ? 'Open' : 'Closed'}
              </Text>
              <Feather name="chevron-down" size={12} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

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
            <Text style={[styles.revenueValue, { color: colors.textPrimary }]}>₹6,800</Text>

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
          {displayOrders.map((order, i) => {
            const stColor = STATUS_COLORS[order.status] || '#2563EB';
            return (
              <Pressable
                key={order.id}
                style={[
                  styles.orderRowItem,
                  i < displayOrders.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }
                ]}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate(DealerTabRoutes.Orders);
                }}
              >
                <Image
                  source={{ uri: ORDER_IMAGES[order.customer] || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80' }}
                  style={styles.orderProductThumb}
                />

                <View style={styles.orderMidCol}>
                  <Text style={[styles.orderCustomerName, { color: colors.textPrimary }]}>{order.customer}</Text>
                  <Text style={[styles.orderItemName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {order.item}
                  </Text>
                  <Text style={[styles.orderCodeText, { color: colors.textTertiary }]}>{order.orderNumber}</Text>
                </View>

                <View style={styles.orderRightCol}>
                  <Text style={[styles.orderPriceTag, { color: colors.textPrimary }]}>
                    ₹{order.total.toLocaleString('en-IN')}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: stColor + '15' }]}>
                    <Text style={[styles.statusBadgeText, { color: stColor }]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.orderTimeText, { color: colors.textTertiary }]}>{order.time}</Text>
                </View>

                <Feather name="chevron-right" size={16} color={colors.textTertiary} style={{ marginLeft: 4 }} />
              </Pressable>
            );
          })}
        </View>

        {/* Low Stock Alert soft banner */}
        <View style={styles.lowStockAlertCard}>
          <View style={styles.alertLeft}>
            <View style={styles.alertIconBox}>
              <Feather name="alert-triangle" size={16} color="#D97706" />
            </View>
            <View>
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
              <Text style={styles.alertSubtitle}>3 products are running low</Text>
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    borderColor: '#E2E8F0',
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
  viewAllLink: { color: '#2563EB', fontSize: 11, fontFamily: 'Inter_700Bold' },

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
