import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { OrderCard } from '@components/cards/OrderCard';
import { GarageBookingsPanel } from '@components/garage/GarageBookingsPanel';
import { GarageDocumentsPanel, GARAGE_DOCUMENTS_COUNT } from '@components/garage/GarageDocumentsPanel';
import { SegmentedTabs } from '@components/common/SegmentedTabs';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useAuth, useBookings } from '@context/index';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { GARAGE_VEHICLES, ORDERS, SERVICES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { useTabBarBottomPadding } from '@hooks/useTabBarBottomPadding';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import type { CustomerTabParamList } from '@navigation/CustomerTabsNavigator';
import { spacing } from '@theme/spacing';
import { lightHaptic, successHaptic } from '@utils/haptics';

type GarageScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Garage>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

const GARAGE_TABS = [
  { label: 'Vehicles', key: 'vehicles' },
  { label: 'Bookings', key: 'bookings' },
  { label: 'Orders', key: 'orders' },
  { label: 'Documents', key: 'documents' },
] as const;

const BOOKINGS_TAB_INDEX = 1;

export function GarageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GarageScreenNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const { getCustomerBookings } = useBookings();
  const { startBookingFromGarage } = useServiceBooking();
  const [activeTab, setActiveTab] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const tabBarPadding = useTabBarBottomPadding();

  useEffect(() => {
    const params = route.params as { initialTab?: string } | undefined;
    if (params?.initialTab === 'bookings') {
      setActiveTab(BOOKINGS_TAB_INDEX);
    }
  }, [route.params]);

  const triggerBooking = (vehicleId: string) => {
    lightHaptic();
    const serviceId = SERVICES[0]?.id ?? '';
    startBookingFromGarage(vehicleId, serviceId);
    navigation.navigate(CustomerStackRoutes.ServiceBookingDateTime, { serviceId });
  };

  const tabCounts = {
    vehicles: GARAGE_VEHICLES.length,
    bookings: getCustomerBookings(user?.id ?? 'u1').length,
    orders: ORDERS.length,
    documents: GARAGE_DOCUMENTS_COUNT,
  };

  const handleTabChange = (index: number) => {
    lightHaptic();
    setActiveTab(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1D4ED8' }]}>
      <LinearGradient
        colors={['#1D4ED8', '#2563EB']}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Garage</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => successHaptic()}
            >
              <Feather name="plus" size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

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
        >
        {activeTab === 0 && (
          <View style={styles.vehiclesListContainer}>
            {GARAGE_VEHICLES.map((v) => (
              <View key={v.id} style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                
                {/* Vehicle Image */}
                <Image source={{ uri: v.image }} style={styles.vehicleImg} resizeMode="cover" />

                {/* Info Section */}
                <View style={styles.vehicleInfo}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.vehicleName, { color: colors.textPrimary }]}>
                        {v.brand} {v.name}
                      </Text>
                      <Text style={styles.vehiclePlate}>{v.regNumber}</Text>
                    </View>
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeText}>{v.year}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Stats list */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statRowItem}>
                      <Feather name="activity" size={14} color="#2563EB" style={{ marginRight: 8 }} />
                      <Text style={[styles.statText, { color: colors.textPrimary }]}>
                        {v.kmsDriven.toLocaleString('en-IN')} km
                      </Text>
                    </View>
                    
                    <View style={styles.statRowItem}>
                      <Feather name="tool" size={14} color="#F59E0B" style={{ marginRight: 8 }} />
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        Service: {v.nextService}
                      </Text>
                    </View>

                    <View style={styles.statRowItem}>
                      <Feather name="shield" size={14} color="#10B981" style={{ marginRight: 8 }} />
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>{v.insurance}</Text>
                    </View>
                  </View>

                  {/* Bottom Action buttons */}
                  <View style={styles.actionsRow}>
                    <Pressable style={styles.bookServiceBtn} onPress={() => triggerBooking(v.id)}>
                      <Feather name="tool" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.bookServiceText}>Book Service</Text>
                    </Pressable>

                    <Pressable style={styles.docsBtn} onPress={() => lightHaptic()}>
                      <Feather name="file-text" size={14} color="#2563EB" style={{ marginRight: 6 }} />
                      <Text style={styles.docsText}>Documents</Text>
                    </Pressable>
                  </View>

                </View>

              </View>
            ))}

            {/* Dotted Add Vehicle button widget */}
            <Pressable style={[styles.addDottedBtn, { borderColor: '#CBD5E1' }]} onPress={() => successHaptic()}>
              <View style={styles.dottedBtnLeft}>
                <View style={styles.plusCircleBadge}>
                  <Feather name="plus" size={16} color="#2563EB" />
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
          </View>
        )}

        {activeTab === 2 && (
          <View style={styles.ordersContainer}>
            {ORDERS.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {ORDERS.length === 0 && (
              <View style={styles.empty}>
                <Feather name="package" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders yet</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 3 && <GarageDocumentsPanel />}
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
    color: '#ffffff',
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
  vehiclePlate: { fontSize: 12, color: '#2563EB', fontFamily: 'Inter_700Bold', marginTop: 2 },
  yearBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  yearBadgeText: { color: '#2563EB', fontSize: 11, fontFamily: 'Inter_700Bold' },
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
    gap: 12,
  },
  bookServiceBtn: {
    flex: 1.2,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookServiceText: { color: '#ffffff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  docsBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsText: { color: '#2563EB', fontSize: 12, fontFamily: 'Inter_700Bold' },
  addDottedBtn: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dottedTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  dottedSub: { fontSize: 10, marginTop: 2, flexWrap: 'wrap', flex: 1 },
  ordersContainer: { gap: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
