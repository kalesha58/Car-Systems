import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { ChromeHeader } from '@components/common';

import { ProductCard } from '@components/cards/ProductCard';
import { ServiceCard } from '@components/cards/ServiceCard';
import { VehicleCard } from '@components/cards/VehicleCard';
import { CartIconButton } from '@components/common/CartIconButton';
import { FilterSortRow } from '@components/marketplace/FilterSortRow';
import {
  countActiveFilters,
  DEFAULT_PRODUCT_FILTERS,
  DEFAULT_SERVICE_FILTERS,
  DEFAULT_VEHICLE_FILTERS,
  MarketplaceFilterSheet,
  type MarketplaceFilterTab,
  type ProductFilters,
  type ServiceFilters,
  type VehicleFilters,
} from '@components/marketplace/MarketplaceFilterSheet';
import { MarketplaceTabs } from '@components/marketplace/MarketplaceTabs';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { PRODUCTS, SERVICES, VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { useTabBarBottomPadding } from '@hooks/useTabBarBottomPadding';
import type { CustomerTabParamList } from '@navigation/CustomerTabsNavigator';
import { spacing } from '@theme/spacing';
import { filterProducts, filterServices, filterVehicles } from '@utils/marketplaceFilters';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.ServiceDetail]: { id: string };
  [CustomerStackRoutes.ServiceBookingDateTime]: { serviceId: string };
};

type MarketplaceScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Marketplace>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

export function MarketplaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MarketplaceScreenNavigationProp>();
  const { startBooking } = useServiceBooking();
  const [activeTab, setActiveTab] = useState(0);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [productFilters, setProductFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  const [vehicleFilters, setVehicleFilters] = useState<VehicleFilters>(DEFAULT_VEHICLE_FILTERS);
  const [serviceFilters, setServiceFilters] = useState<ServiceFilters>(DEFAULT_SERVICE_FILTERS);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const tabBarPadding = useTabBarBottomPadding();

  const filterTab: MarketplaceFilterTab | null =
    activeTab === 0 ? 'products' : activeTab === 1 ? 'vehicles' : activeTab === 2 ? 'services' : null;

  const activeFilterCount = filterTab
    ? countActiveFilters(filterTab, productFilters, vehicleFilters, serviceFilters)
    : 0;

  const filteredProducts = useMemo(
    () => filterProducts(PRODUCTS, productFilters),
    [productFilters],
  );
  const filteredVehicles = useMemo(
    () => filterVehicles(VEHICLES, vehicleFilters),
    [vehicleFilters],
  );
  const filteredServices = useMemo(
    () => filterServices(SERVICES, serviceFilters),
    [serviceFilters],
  );

  const openFilterSheet = () => {
    if (filterTab) setShowFilterSheet(true);
  };

  const handleApplyFilters = (
    tab: MarketplaceFilterTab,
    filters: ProductFilters | VehicleFilters | ServiceFilters,
  ) => {
    if (tab === 'products') setProductFilters(filters as ProductFilters);
    if (tab === 'vehicles') setVehicleFilters(filters as VehicleFilters);
    if (tab === 'services') setServiceFilters(filters as ServiceFilters);
  };

  const tabCounts = {
    products: filteredProducts.length,
    vehicles: filteredVehicles.length,
    services: filteredServices.length,
    drive: 1,
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1D4ED8' }]}>
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={openFilterSheet}
              style={[styles.iconBtn, !filterTab && styles.iconBtnDisabled]}
              disabled={!filterTab}
            >
              <Feather name="sliders" size={20} color="#ffffff" />
              {activeFilterCount > 0 && (
                <View style={styles.headerFilterDot}>
                  <Text style={styles.headerFilterDotText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate(CustomerStackRoutes.Search)}
              style={styles.iconBtn}
            >
              <Feather name="search" size={20} color="#ffffff" />
            </Pressable>
            <CartIconButton onPress={() => navigation.navigate(CustomerStackRoutes.Cart)} />
          </View>
        </View>
      </ChromeHeader>

      <View style={[styles.contentSheet, { backgroundColor: colors.card }]}>
        <View style={styles.tabsWrapper}>
          <MarketplaceTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={tabCounts}
          />
        </View>

        {filterTab && (
          <View style={styles.filterWrapper}>
            <FilterSortRow
              tab={filterTab}
              filterActive={activeFilterCount > 0}
              activeFilterCount={activeFilterCount}
              onFilterPress={openFilterSheet}
            />
          </View>
        )}

        {activeTab === 0 && (
          <FlatList
            style={styles.listFlex}
          data={filteredProducts}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={[styles.gridContent, { paddingBottom: tabBarPadding }]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              variant="grid"
              showAddToCart
              style={styles.gridItem}
              onPress={() =>
                navigation.navigate(CustomerStackRoutes.ProductDetail, { id: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No products found
              </Text>
            </View>
          }
        />
        )}

        {activeTab === 1 && (
          <FlatList
            style={styles.listFlex}
          data={filteredVehicles}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarPadding }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              style={styles.vehicleItem}
              onNavigate={() =>
                navigation.navigate(CustomerStackRoutes.VehicleDetail, { id: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="truck" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No vehicles found
              </Text>
            </View>
          }
        />
        )}

        {activeTab === 2 && (
          <ScrollView
            style={styles.listFlex}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredServices.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="tool" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No services match your filters
              </Text>
            </View>
          ) : (
            filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onNavigate={() =>
                  navigation.navigate(CustomerStackRoutes.ServiceDetail, { id: service.id })
                }
                onBookPress={() => {
                  startBooking(service.id);
                  navigation.navigate(CustomerStackRoutes.ServiceBookingDateTime, {
                    serviceId: service.id,
                  });
                }}
              />
            ))
          )}
        </ScrollView>
        )}

        {activeTab === 3 && (
          <ScrollView
            style={styles.listFlex}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bookingCardContainer}>
            <Text style={[styles.bookingTitle, { color: colors.textPrimary }]}>Your Booked Test Drives</Text>
            
            {/* Booked Drive Card */}
            <Pressable
              style={[styles.driveCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate(CustomerStackRoutes.DriveDetail as any, { id: 'v3' })}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80' }}
                style={styles.driveCardImg}
              />
              <View style={styles.driveCardInfo}>
                <View style={styles.badgeRow}>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                  </View>
                  <Text style={[styles.driveDate, { color: colors.textSecondary }]}>18 May, 11:00 AM</Text>
                </View>
                <Text style={[styles.driveName, { color: colors.textPrimary }]}>Tata Nexon EV</Text>
                <Text style={[styles.driveSubtitle, { color: colors.textSecondary }]}>Dealer: Motonode Koramangala</Text>
                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsText}>View Booking Details</Text>
                  <Feather name="arrow-right" size={12} color="#2563EB" />
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
        )}
      </View>

      <MarketplaceFilterSheet
        visible={showFilterSheet}
        tab={filterTab ?? 'products'}
        productFilters={productFilters}
        vehicleFilters={vehicleFilters}
        serviceFilters={serviceFilters}
        onClose={() => setShowFilterSheet(false)}
        onApply={handleApplyFilters}
      />
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
    gap: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnDisabled: { opacity: 0.45 },
  headerFilterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerFilterDotText: {
    color: '#2563EB',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  contentSheet: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tabsWrapper: { marginBottom: spacing.sm },
  filterWrapper: { marginHorizontal: -spacing.md },
  listFlex: { flex: 1 },
  gridContent: { paddingTop: 4, paddingBottom: spacing.md },
  columnWrapper: { gap: 12, marginBottom: 12 },
  gridItem: { flex: 1, maxWidth: '48%' },
  listContent: { paddingTop: 4, paddingBottom: spacing.md },
  vehicleItem: { width: '100%', marginBottom: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  bookingCardContainer: { paddingVertical: 8 },
  bookingTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  driveCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center' },
  driveCardImg: { width: 100, height: 70, borderRadius: 8, marginRight: 12 },
  driveCardInfo: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  confirmedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  confirmedBadgeText: { color: '#065F46', fontSize: 8, fontFamily: 'Inter_700Bold' },
  driveDate: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  driveName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  driveSubtitle: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  viewDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  viewDetailsText: { color: '#2563EB', fontSize: 10, fontFamily: 'Inter_700Bold' },
});
