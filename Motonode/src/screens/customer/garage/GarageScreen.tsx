import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { OrderCard } from '@components/cards/OrderCard';
import { GarageBookingsPanel } from '@components/garage/GarageBookingsPanel';
import { SegmentedTabs } from '@components/common/SegmentedTabs';
import { GarageOrdersListSkeleton, GarageVehiclesListSkeleton } from '@components/loaders';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useAuth, useBookings } from '@context/index';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import { useTabBarBottomPadding } from '@hooks/useTabBarBottomPadding';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import type { CustomerTabParamList } from '@navigation/CustomerTabsNavigator';
import { getUserOrders } from '@services/order.service';
import { getServices } from '@services/service.service';
import { getUserVehicles } from '@services/userVehicle.service';
import type { IOrderData } from '@app-types/order';
import type { IService } from '@app-types/service';
import type { UserVehicle } from '../../../types/userVehicle';
import { spacing } from '@theme/spacing';
import { extractAuthErrorMessage } from '@utils/authErrors';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getOrderId, getServiceId } from '@utils/displayMappers';
import { lightHaptic } from '@utils/haptics';

type GarageScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Garage>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

const GARAGE_TABS = [
  { label: 'Vehicles', key: 'vehicles' },
  { label: 'Bookings', key: 'bookings' },
  { label: 'Orders', key: 'orders' },
] as const;

const BOOKINGS_TAB_INDEX = 1;
const ORDERS_TAB_INDEX = 2;
const DEFAULT_VEHICLE_IMAGE =
  'https://images.unsplash.com/photo-1494976388531-d1058498cdd5?w=600&q=80';

export function GarageScreen() {
  const colors = useColors();
  const navigation = useNavigation<GarageScreenNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const { getCustomerBookings } = useBookings();
  const { startBookingFromGarage } = useServiceBooking();
  const [activeTab, setActiveTab] = useState(0);
  const tabBarPadding = useTabBarBottomPadding();

  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [orders, setOrders] = useState<IOrderData[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    const params = route.params as { initialTab?: string } | undefined;
    if (params?.initialTab === 'bookings') {
      setActiveTab(BOOKINGS_TAB_INDEX);
    }
  }, [route.params]);

  const loadVehicles = useCallback(async (opts?: { showLoader?: boolean }) => {
    const showLoader = opts?.showLoader ?? false;

    if (user?.isGuest) {
      setVehicles([]);
      setVehicleError('Sign in to view your garage vehicles.');
      setLoadingVehicles(false);
      setRefreshing(false);
      return;
    }

    if (showLoader) setLoadingVehicles(true);
    setVehicleError(null);

    try {
      const response = await getUserVehicles();
      if (response.success !== false && Array.isArray(response.Response)) {
        setVehicles(response.Response);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      setVehicleError(extractAuthErrorMessage(err));
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
      setRefreshing(false);
    }
  }, [user?.isGuest]);

  const loadServices = useCallback(async () => {
    try {
      const response = await getServices({ limit: 20 });
      if (response.success && response.Response?.services) {
        setServices(response.Response.services);
      } else {
        setServices([]);
      }
    } catch {
      setServices([]);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (user?.isGuest) {
      setOrders([]);
      setOrdersError('Sign in to view your orders.');
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await getUserOrders();
      setOrders(data);
    } catch (err) {
      setOrdersError(getApiErrorMessage(err, 'Failed to load orders'));
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.isGuest]);

  useFocusEffect(
    useCallback(() => {
      void loadVehicles({ showLoader: vehicles.length === 0 });
      void loadServices();
    }, [loadVehicles, loadServices, vehicles.length]),
  );

  useEffect(() => {
    if (activeTab === ORDERS_TAB_INDEX) {
      void loadOrders();
    }
  }, [activeTab, loadOrders]);

  const handleAddVehicle = () => {
    lightHaptic();
    if (user?.isGuest) {
      Alert.alert('Sign in required', 'Please sign in to add a vehicle to your garage.');
      return;
    }
    navigation.navigate(CustomerStackRoutes.AddVehicle);
  };

  const handleRefresh = () => {
    lightHaptic();
    setRefreshing(true);
    void loadVehicles();
  };

  const triggerBooking = (vehicleId: string) => {
    lightHaptic();
    const serviceId = getServiceId(services[0]) || '';
    if (!serviceId) {
      Alert.alert('No Services', 'No services are available to book right now.');
      return;
    }
    startBookingFromGarage(vehicleId, serviceId);
    navigation.navigate(CustomerStackRoutes.ServiceBookingDateTime, { serviceId });
  };

  const tabCounts = {
    vehicles: vehicles.length,
    bookings: getCustomerBookings(user?.id ?? 'u1').length,
    orders: orders.length,
  };

  const openVehicleDetail = (vehicleId: string, focusSection?: 'documents') => {
    lightHaptic();
    navigation.navigate(CustomerStackRoutes.GarageVehicleDetail, { vehicleId, focusSection });
  };

  const handleTabChange = (index: number) => {
    lightHaptic();
    setActiveTab(index);
  };

  const renderVehicleCard = (v: UserVehicle) => {
    const image = v.images?.[0] ?? DEFAULT_VEHICLE_IMAGE;
    const docCount = [v.documents?.rc, v.documents?.insurance, v.documents?.pollution, v.documents?.dl].filter(
      Boolean,
    ).length;

    return (
      <View
        key={v.id}
        style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Pressable onPress={() => openVehicleDetail(v.id)}>
          <Image source={{ uri: image }} style={styles.vehicleImg} resizeMode="cover" />
        </Pressable>

        <View style={styles.vehicleInfo}>
          <Pressable onPress={() => openVehicleDetail(v.id)}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.vehicleName, { color: colors.textPrimary }]}>
                  {v.brand} {v.model}
                </Text>
                <Text style={[styles.vehiclePlate, { color: colors.textSecondary }]}>
                  {v.numberPlate}
                </Text>
              </View>
              {v.year ? (
                <View style={[styles.yearBadge, { backgroundColor: colors.primarySubtle }]}>
                  <Text style={[styles.yearBadgeText, { color: colors.textSecondary }]}>{v.year}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statsGrid}>
            {v.color ? (
              <View style={styles.statRowItem}>
                <Feather name="droplet" size={14} color={colors.icon} style={{ marginRight: 8 }} />
                <Text style={[styles.statText, { color: colors.textPrimary }]}>{v.color}</Text>
              </View>
            ) : null}

            <View style={styles.statRowItem}>
              <Feather name="file-text" size={14} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {docCount}/4 documents uploaded
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.bookServiceBtn, { backgroundColor: colors.primary }]}
              onPress={() => triggerBooking(v.id)}
            >
              <Feather name="tool" size={14} color={colors.primaryForeground} style={{ marginRight: 6 }} />
              <Text style={[styles.bookServiceText, { color: colors.primaryForeground }]}>Book Service</Text>
            </Pressable>

            <Pressable
              style={[styles.docsBtn, { borderColor: colors.border }]}
              onPress={() => openVehicleDetail(v.id)}
            >
              <Feather name="info" size={14} color={colors.icon} style={{ marginRight: 6 }} />
              <Text style={[styles.docsText, { color: colors.textSecondary }]}>Details</Text>
            </Pressable>

            <Pressable
              style={[styles.docsBtn, { borderColor: colors.border }]}
              onPress={() => openVehicleDetail(v.id, 'documents')}
            >
              <Feather name="file-text" size={14} color={colors.icon} style={{ marginRight: 6 }} />
              <Text style={[styles.docsText, { color: colors.textSecondary }]}>Documents</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>My Garage</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={handleAddVehicle}>
              <Feather name="plus" size={20} color={colors.headerForeground} />
            </Pressable>
          </View>
        </View>
      </ChromeHeader>

      <View style={[styles.contentSheet, { backgroundColor: colors.card }]}>
        <View style={styles.tabsWrapper}>
          <SegmentedTabs
            tabs={GARAGE_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={tabCounts}
          />
        </View>

        {activeTab === BOOKINGS_TAB_INDEX ? (
          <GarageBookingsPanel bottomPadding={tabBarPadding} />
        ) : (
        <ScrollView
          style={styles.listFlex}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            activeTab === 0 ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.link}
                colors={[colors.link]}
              />
            ) : undefined
          }
        >
        {activeTab === 0 && (
          <View style={styles.vehiclesListContainer}>
            {loadingVehicles && vehicles.length === 0 ? (
              <GarageVehiclesListSkeleton />
            ) : (
              <>
                {vehicles.map(renderVehicleCard)}

                {vehicles.length === 0 && !loadingVehicles && (
                  <View style={styles.empty}>
                    <Feather name="truck" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {vehicleError ?? 'No vehicles in your garage yet'}
                    </Text>
                  </View>
                )}

                <Pressable
                  style={[styles.addDottedBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={handleAddVehicle}
                >
                  <View style={styles.dottedBtnLeft}>
                    <View style={[styles.plusCircleBadge, { backgroundColor: colors.primarySubtle }]}>
                      <Feather name="plus" size={16} color={colors.link} />
                    </View>
                    <View>
                      <Text style={[styles.dottedTitle, { color: colors.textPrimary }]}>Add New Vehicle</Text>
                      <Text style={[styles.dottedSub, { color: colors.textSecondary }]}>
                        Add your vehicle to get personalized service reminders
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                </Pressable>
              </>
            )}
          </View>
        )}

        {activeTab === ORDERS_TAB_INDEX && (
          <View style={styles.ordersContainer}>
            <View style={styles.ordersHeader}>
              <Text style={[styles.ordersTitle, { color: colors.textPrimary }]}>My Orders</Text>
              <Text style={[styles.ordersSubtitle, { color: colors.textSecondary }]}>
                Track and manage your purchases
              </Text>
            </View>
            {loadingOrders && orders.length === 0 ? (
              <GarageOrdersListSkeleton />
            ) : (
              <>
                {orders.map((order) => (
                  <OrderCard
                    key={getOrderId(order)}
                    order={order}
                    onPress={() =>
                      navigation.navigate(CustomerStackRoutes.OrderTracking, {
                        id: getOrderId(order),
                      })
                    }
                  />
                ))}
                {orders.length === 0 && !loadingOrders && (
                  <View style={styles.empty}>
                    <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySubtle }]}>
                      <Feather name="package" size={28} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                      No orders yet
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {ordersError ?? 'Your product orders will show up here once you place one.'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
        </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: 28,
  },
  headerRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  headerActions: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  contentSheet: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tabsWrapper: { marginBottom: spacing.sm },
  listFlex: { flex: 1 },
  content: { paddingTop: 4 },
  vehiclesListContainer: {
    gap: 16,
  },
  vehicleCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  vehicleImg: {
    width: '100%',
    height: 160,
  },
  vehicleInfo: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  vehiclePlate: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 2 },
  yearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  yearBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginVertical: 12 },
  statsGrid: {
    gap: 8,
    marginBottom: 14,
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bookServiceBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookServiceText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  docsBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  addDottedBtn: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dottedBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  plusCircleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dottedTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  dottedSub: { fontSize: 10, marginTop: 2, flexWrap: 'wrap', flex: 1 },
  ordersContainer: { gap: 12 },
  ordersHeader: { marginBottom: 4, gap: 2 },
  ordersTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  ordersSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },
});
