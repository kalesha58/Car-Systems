import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { StatCard } from '@components/cards/StatCard';
import { DealerStackRoutes, DealerTabRoutes } from '@constants/routes';
import { useAuth, useDealer } from '@context/index';
import { useColors } from '@hooks/useColors';
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
};

type DealerDashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DealerTabParamList, typeof DealerTabRoutes.Dashboard>,
  NativeStackNavigationProp<DealerStackParamList>
>;

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  packed: '#8B5CF6',
  ready: '#0891B2',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

function getQuickActions(caps: {
  hasProducts: boolean;
  hasVehicles: boolean;
  hasServices: boolean;
  hasDrive: boolean;
}) {
  const actions: { icon: string; label: string; color: string; route: string }[] = [];
  if (caps.hasProducts) {
    actions.push({
      icon: 'plus-circle',
      label: 'Add Product',
      color: '#2563EB',
      route: DealerStackRoutes.ProductForm,
    });
  }
  if (caps.hasVehicles) {
    actions.push({
      icon: 'truck',
      label: 'Add Vehicle',
      color: '#7C3AED',
      route: DealerStackRoutes.VehicleForm,
    });
  }
  if (caps.hasServices) {
    actions.push({
      icon: 'tool',
      label: 'Add Service',
      color: '#059669',
      route: DealerStackRoutes.ServiceForm,
    });
  }
  if (caps.hasDrive) {
    actions.push({
      icon: 'truck',
      label: 'Test Drives',
      color: '#10B981',
      route: DealerTabRoutes.Drive,
    });
  }
  actions.push({ icon: 'bar-chart-2', label: 'Analytics', color: '#F59E0B', route: '' });
  return actions.slice(0, 4);
}

function getDashboardStats(
  caps: {
    hasProducts: boolean;
    hasVehicles: boolean;
    hasServices: boolean;
    hasDrive: boolean;
  },
  orderCount: number,
  productCount: number,
  vehicleCount: number,
  serviceCount: number,
  driveCount: number,
) {
  const stats = [
    { label: 'Orders', value: String(orderCount), icon: 'package', color: '#2563EB', trend: 12 },
    { label: 'Revenue', value: '₹2.4L', icon: 'trending-up', color: '#10B981', trend: 8 },
  ];
  if (caps.hasProducts) {
    stats.push({
      label: 'Products',
      value: String(productCount),
      icon: 'box',
      color: '#7C3AED',
      trend: 0,
    });
  }
  if (caps.hasVehicles) {
    stats.push({
      label: 'Vehicles',
      value: String(vehicleCount),
      icon: 'truck',
      color: '#0891B2',
      trend: 0,
    });
  }
  if (caps.hasServices) {
    stats.push({
      label: 'Services',
      value: String(serviceCount),
      icon: 'tool',
      color: '#059669',
      trend: 0,
    });
  }
  if (caps.hasDrive) {
    stats.push({
      label: 'Test Drives',
      value: String(driveCount),
      icon: 'calendar',
      color: '#F59E0B',
      trend: 5,
    });
  }
  return stats;
}

export function DealerDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DealerDashboardNavigationProp>();
  const { user, switchRole } = useAuth();
  const { capabilities, orders, products, vehicles, services, driveBookings, dealerType } =
    useDealer();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const recentOrders = orders.slice(0, 5);
  const todayRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const stats = getDashboardStats(
    capabilities,
    orders.filter((o) => o.status === 'pending' || o.status === 'accepted').length,
    products.length,
    vehicles.length,
    services.length,
    driveBookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length,
  );
  const quickActions = getQuickActions(capabilities);

  const handleQuickAction = (route: string) => {
    if (!route) return;
    lightHaptic();
    if (route === DealerTabRoutes.Drive) {
      navigation.navigate(DealerTabRoutes.Drive);
      return;
    }
    if (route === DealerStackRoutes.ProductForm) {
      navigation.navigate(DealerStackRoutes.ProductForm, {});
      return;
    }
    if (route === DealerStackRoutes.VehicleForm) {
      navigation.navigate(DealerStackRoutes.VehicleForm, {});
      return;
    }
    if (route === DealerStackRoutes.ServiceForm) {
      navigation.navigate(DealerStackRoutes.ServiceForm, {});
      return;
    }
    navigation.navigate(route as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{dealerType ?? 'Dealer Dashboard'}</Text>
            <Text style={styles.storeName}>{user?.name ?? 'Speed Auto Parts'}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
              <Feather name="bell" size={22} color="#fff" />
            </Pressable>
            <Pressable style={[styles.storeStatus, { backgroundColor: '#10B981' + '30' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.statusText, { color: '#10B981' }]}>Open</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.revenueBanner}>
          <View>
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
            <Text style={styles.revenueValue}>
              ₹{todayRevenue > 0 ? todayRevenue.toLocaleString('en-IN') : '24,800'}
            </Text>
          </View>
          <View style={styles.trendBadge}>
            <Feather name="trending-up" size={14} color="#10B981" />
            <Text style={[styles.trendText, { color: '#10B981' }]}>+8.4% today</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {stats.map((s, i) =>
            i % 2 === 0 ? (
              <View key={s.label} style={styles.statsRow}>
                <StatCard
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                  trend={s.trend}
                  color={s.color}
                />
                {stats[i + 1] && (
                  <StatCard
                    label={stats[i + 1].label}
                    value={stats[i + 1].value}
                    icon={stats[i + 1].icon}
                    trend={stats[i + 1].trend}
                    color={stats[i + 1].color}
                  />
                )}
              </View>
            ) : null,
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Orders</Text>
        <View style={[styles.ordersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No orders yet</Text>
            </View>
          ) : (
            recentOrders.map((order, i) => (
              <Pressable
                key={order.id}
                style={[
                  styles.orderRow,
                  i < recentOrders.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  },
                ]}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate(DealerTabRoutes.Orders);
                }}
              >
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderCustomer, { color: colors.textPrimary }]}>
                    {order.customer}
                  </Text>
                  <Text
                    style={[styles.orderItem, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {order.item}
                  </Text>
                  <Text style={[styles.orderTime, { color: colors.textTertiary }]}>{order.time}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>
                    ₹{order.total.toLocaleString('en-IN')}
                  </Text>
                  <View
                    style={[
                      styles.orderStatus,
                      { backgroundColor: (STATUS_COLORS[order.status] || colors.primary) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        { color: STATUS_COLORS[order.status] || colors.primary },
                      ]}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.quickAction,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => handleQuickAction(action.route)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Feather
                  name={action.icon as React.ComponentProps<typeof Feather>['name']}
                  size={22}
                  color={action.color}
                />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.switchBtn, { borderColor: colors.border }]}
          onPress={() => {
            lightHaptic();
            switchRole();
          }}
        >
          <Feather name="refresh-cw" size={16} color={colors.textSecondary} />
          <Text style={[styles.switchBtnText, { color: colors.textSecondary }]}>
            Switch to Customer View
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  storeName: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  storeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  revenueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  revenueLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  revenueValue: { color: '#fff', fontSize: 28, fontFamily: 'Inter_700Bold', marginTop: 4 },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981' + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 16 },
  statsGrid: { gap: 12, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  ordersCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  emptyOrders: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  orderInfo: { flex: 1 },
  orderCustomer: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  orderItem: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  orderTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  orderTotal: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  orderStatusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  quickAction: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  switchBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
