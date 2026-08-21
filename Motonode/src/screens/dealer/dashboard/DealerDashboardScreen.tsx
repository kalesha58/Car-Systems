import React, { useCallback, useState } from 'react';
import {
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
import { ChromeHeader, SubtlePatternBackground } from '@components/common';
import { DealerBannerCarousel, type DealerBannerAction } from '@components/dealer/DealerBannerCarousel';
import { DealerDashboardSkeleton } from '@components/loaders';
import { useAuth, useBookings, useDealer } from '@context/index';
import {
  DEALER_TYPE_ILLUSTRATIONS,
  type DealerType,
} from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { useDealerOnboardingStatus } from '@hooks/useDealerOnboardingStatus';
import {
  getDealerInventoryVehicles,
  getDealerProducts,
  getDealerServices,
} from '@services/dealer.service';
import { getDealerOrderStats } from '@services/order.service';
import { getDealerTestDrives } from '@services/testDrive.service';
import {
  formatCurrency,
  getProductStockStatus,
} from '@utils/displayMappers';
import { lightHaptic } from '@utils/haptics';
import { cardShadow, elevatedCardShadow } from '@utils/shadows';

type DealerTabParamList = {
  [DealerTabRoutes.Dashboard]: undefined;
  [DealerTabRoutes.Inventory]: undefined;
  [DealerTabRoutes.Orders]: undefined;
  [DealerTabRoutes.Drive]: undefined;
  [DealerTabRoutes.Profile]: undefined;
  [DealerTabRoutes.Bank]: undefined;
};

type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: { mode?: 'edit' | 'create' } | undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
  [DealerStackRoutes.ServiceBookings]: undefined;
  [DealerStackRoutes.DealerOrderDetail]: { orderId: string };
  [DealerStackRoutes.NotificationSettings]: undefined;
};

type DealerDashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DealerTabParamList, typeof DealerTabRoutes.Dashboard>,
  NativeStackNavigationProp<DealerStackParamList>
>;

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
  const [lowStockCount, setLowStockCount] = useState(0);

  const resolvedDealerType = (dealerType ?? 'Automobile Showroom') as DealerType;
  const revenueIllustration =
    DEALER_TYPE_ILLUSTRATIONS[resolvedDealerType] ??
    DEALER_TYPE_ILLUSTRATIONS['Automobile Showroom'];

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fetchDashboardData = useCallback(async () => {
    if (!canAccessDealerApis) {
      setProductCount(0);
      setVehicleCount(0);
      setServiceCount(0);
      setTestDriveCount(0);
      setOrderCount(0);
      setRevenueMtd(0);
      setLowStockCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [productsRes, vehiclesRes, servicesRes, orderStats, testDrivesRes] =
        await Promise.all([
          capabilities.hasProducts ? getDealerProducts({ limit: 1000 }) : Promise.resolve(null),
          capabilities.hasVehicles ? getDealerInventoryVehicles({ limit: 1000 }) : Promise.resolve(null),
          capabilities.hasServices ? getDealerServices({ limit: 1000 }) : Promise.resolve(null),
          getDealerOrderStats(),
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
      setOrderCount(orderStats.total ?? 0);
      setRevenueMtd(orderStats.totalRevenue ?? 0);
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
    { label: 'Products', value: String(productCount), icon: 'box' },
    { label: 'Vehicles', value: String(vehicleCount), icon: 'truck' },
    { label: 'Services', value: String(serviceCount), icon: 'tool' },
    { label: 'Test Drives', value: String(testDriveCount), icon: 'navigation' },
    { label: 'Orders', value: String(orderCount), icon: 'shopping-bag' },
    { label: 'Revenue', value: formatRevenue(revenueMtd), icon: 'trending-up' },
  ];

  const insightChips = [
    { label: 'Live Orders', value: String(orderCount), icon: 'shopping-bag' },
    { label: 'Pending Services', value: String(pendingServiceBookings), icon: 'clock' },
    { label: 'Low Stock', value: String(lowStockCount), icon: 'alert-circle' },
    { label: 'Store Status', value: storeOpen ? 'Open' : 'Closed', icon: 'zap' },
  ];

  const quickActions = [
    capabilities.hasProducts && {
      label: 'Add Product',
      icon: 'plus-circle',
      route: DealerStackRoutes.ProductForm,
    },
    capabilities.hasVehicles && {
      label: 'Add Vehicle',
      icon: 'truck',
      route: DealerStackRoutes.VehicleForm,
    },
    capabilities.hasServices && {
      label: 'Add Service',
      icon: 'tool',
      route: DealerStackRoutes.ServiceForm,
    },
    capabilities.hasServices && {
      label: 'Bookings',
      icon: 'calendar',
      route: DealerStackRoutes.ServiceBookings,
      badge: pendingServiceBookings,
    },
    { label: 'Orders', icon: 'package', route: DealerTabRoutes.Orders },
    capabilities.hasDrive && {
      label: 'Test Drive',
      icon: 'navigation',
      route: DealerTabRoutes.Drive,
    },
    { label: 'Bank', icon: 'credit-card', route: DealerTabRoutes.Bank },
  ].filter(Boolean) as Array<{
    label: string;
    icon: string;
    route: string;
    badge?: number;
  }>;

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
    if (route === DealerStackRoutes.VehicleForm) {
      navigation.navigate(DealerStackRoutes.VehicleForm, {});
      return;
    }
    if (route === DealerStackRoutes.ServiceForm) {
      navigation.navigate(DealerStackRoutes.ServiceForm, {});
      return;
    }
    if (route === DealerStackRoutes.ServiceBookings) {
      navigation.navigate(DealerStackRoutes.ServiceBookings);
      return;
    }
    if (route === DealerTabRoutes.Bank) {
      navigation.navigate(DealerTabRoutes.Bank);
    }
  };

  const handleBannerAction = (action: DealerBannerAction) => {
    switch (action) {
      case 'orders':
        navigation.navigate(DealerTabRoutes.Orders);
        break;
      case 'inventory':
        navigation.navigate(DealerTabRoutes.Inventory);
        break;
      case 'add_product':
        navigation.navigate(DealerStackRoutes.ProductForm, {});
        break;
      case 'service_bookings':
        navigation.navigate(DealerStackRoutes.ServiceBookings);
        break;
      case 'bank':
        navigation.navigate(DealerTabRoutes.Bank);
        break;
      case 'drive':
        navigation.navigate(DealerTabRoutes.Drive);
        break;
      default:
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SubtlePatternBackground />
      <ChromeHeader style={styles.header} contentPad={14}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.storeAvatar}>
              <Text style={styles.storeAvatarText}>{(user?.name?.[0] ?? 'M').toUpperCase()}</Text>
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.greeting}>{dealerType ?? 'Automobile Showroom'}</Text>
              <Text style={[styles.storeName, { color: colors.headerForeground }]}>
                {user?.name ?? 'Your Store'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.NotificationSettings);
              }}
            >
              <Feather name="bell" size={19} color={colors.headerForeground} />
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
              <View style={[styles.statusDot, { backgroundColor: storeOpen ? colors.success : colors.primary }]} />
              <Text style={[styles.statusText, { color: storeOpen ? colors.success : colors.primary }]}>
                {storeOpen ? 'Open' : 'Closed'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ChromeHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {loading ? (
          <DealerDashboardSkeleton />
        ) : (
          <>
            <DealerBannerCarousel onAction={handleBannerAction} />

            <View
              style={[
                styles.heroCard,
                elevatedCardShadow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
          <View style={styles.heroTopRow}>
            <View style={styles.heroLeft}>
              <Text style={[styles.heroEyebrow, { color: colors.primary }]}>Monthly revenue</Text>
              <Text style={[styles.heroRevenue, { color: colors.textPrimary }]}>{formatRevenue(revenueMtd)}</Text>
              <View style={[styles.heroTrendPill, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="trending-up" size={12} color={colors.primary} />
                <Text style={[styles.heroTrendText, { color: colors.primary }]}>Store performance is trending up</Text>
              </View>
            </View>
            <View style={[styles.heroIllustrationWrap, { backgroundColor: colors.primarySubtle, borderColor: colors.border }]}>
              <Image source={{ uri: revenueIllustration }} style={styles.heroIllustration} resizeMode="cover" />
            </View>
          </View>
          <View style={[styles.heroStatsRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{orderCount}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Orders</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{productCount}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Products</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{pendingServiceBookings}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Pending</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.insightRow}
          nestedScrollEnabled
        >
          {insightChips.map((chip) => (
            <View
              key={chip.label}
              style={[styles.insightChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.insightIcon, { backgroundColor: colors.primarySubtle }]}>
                <Feather name={chip.icon as 'clock'} size={14} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.insightValue, { color: colors.textPrimary }]}>{chip.value}</Text>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>{chip.label}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.panelCard, elevatedCardShadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
            <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>Tap to manage</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScrollRow}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={styles.actionBtnCell}
                onPress={() => handleQuickAction(action.route)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: colors.primarySubtle }]}>
                  <Feather name={action.icon as 'plus'} size={20} color={colors.primary} />
                  {'badge' in action && (action.badge ?? 0) > 0 ? (
                    <View style={[styles.actionBadge, { borderColor: colors.card }]}>
                      <Text style={styles.actionBadgeText}>{action.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.actionLabelText, { color: colors.textPrimary }]} numberOfLines={2}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Store Snapshot</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                elevatedCardShadow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.statIconBox, { backgroundColor: colors.primarySubtle }]}>
                <Feather name={s.icon as 'box'} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.statCardValue, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View
          style={[
            styles.lowStockAlertCard,
            cardShadow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {lowStockCount > 0 ? (
            <View style={[styles.alertAccent, { backgroundColor: colors.primary }]} />
          ) : null}
          <View style={styles.alertLeft}>
            <View
              style={[
                styles.alertIconBox,
                { backgroundColor: colors.muted },
              ]}
            >
              <Feather
                name={lowStockCount > 0 ? 'alert-triangle' : 'check-circle'}
                size={18}
                color={lowStockCount > 0 ? colors.primary : colors.success}
              />
            </View>
            <View style={styles.alertTextBlock}>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                {lowStockCount > 0 ? 'Restock recommended' : 'Inventory looks healthy'}
              </Text>
              <Text style={[styles.alertSubtitle, { color: colors.textSecondary }]}>
                {lowStockCount > 0
                  ? `${lowStockCount} products need attention`
                  : 'All products are above low-stock threshold'}
              </Text>
            </View>
          </View>
          <Pressable
            style={[
              styles.alertBtn,
              lowStockCount > 0
                ? { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1 }
                : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => {
              lightHaptic();
              navigation.navigate(DealerTabRoutes.Inventory);
            }}
          >
            <Text
              style={[
                styles.alertBtnText,
                { color: lowStockCount > 0 ? colors.primary : colors.textPrimary },
              ]}
            >
              Open Inventory
            </Text>
          </Pressable>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  storeAvatarText: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerTextBlock: { flex: 1 },
  greeting: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.75)' },
  storeName: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  redBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  redBadgeText: { color: '#ffffff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  openStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  content: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },

  heroCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroLeft: { flex: 1, gap: 6 },
  heroEyebrow: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  heroRevenue: { fontSize: 30, fontFamily: 'Inter_700Bold' },
  heroIllustrationWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroIllustration: { width: '100%', height: '100%' },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatDivider: { width: 1, height: 28 },
  heroStatValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  heroStatLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
  heroTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTrendText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  insightRow: { gap: 10, paddingRight: 4 },
  insightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 132,
    borderWidth: 1,
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  insightLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 1 },

  panelCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionHint: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  actionsScrollRow: { gap: 14, paddingRight: 8 },
  actionBtnCell: { alignItems: 'center', width: 76, gap: 8 },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E60012',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  actionBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  actionLabelText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center', lineHeight: 14 },

  statsScrollRow: { gap: 10, paddingRight: 8, paddingBottom: 2 },
  statCard: {
    width: 110,
    borderRadius: 16,
    padding: 12,
    minHeight: 100,
    borderWidth: 1,
    gap: 8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statCardLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  lowStockAlertCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  alertAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextBlock: { flex: 1 },
  alertTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  alertSubtitle: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2, lineHeight: 16 },
  alertBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  alertBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});
