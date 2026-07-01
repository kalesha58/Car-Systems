import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import Feather from 'react-native-vector-icons/Feather';

import { BannerCarousel, SectionHeader, PromoBanner, ChromeHeader, SubtlePatternBackground } from '@components/common';
import { ProductCard } from '@components/cards/ProductCard';
import { VehicleCard } from '@components/cards/VehicleCard';
import { ServiceCard } from '@components/cards/ServiceCard';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useDealerVehiclesCatalog, useProducts, useServicesCatalog } from '@hooks/useCatalogData';
import { useColors } from '@hooks/useColors';
import { useTabBarBottomPadding } from '@hooks/useTabBarBottomPadding';
import { useDeliveryAddress } from '@hooks/useDeliveryAddress';
import { getProductId, getVehicleId, getServiceId } from '@utils/displayMappers';
import type { CustomerTabParamList as NavigationParamList } from '@navigation/CustomerTabsNavigator';
import { spacing } from '@theme/spacing';
import { HorizontalProductsSkeleton, HorizontalVehiclesSkeleton, HorizontalServicesSkeleton } from '@components/loaders';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.ServiceDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.SavedAddresses]: { selectMode?: boolean } | undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<NavigationParamList, typeof CustomerTabRoutes.Home>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

export function HomeScreen() {
  const colors = useColors();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const tabBarPadding = useTabBarBottomPadding();
  const { displayLabel: deliveryLabel } = useDeliveryAddress();
  const { products, loading: productsLoading } = useProducts(20);
  const { vehicles, loading: vehiclesLoading } = useDealerVehiclesCatalog(10);
  const { services, loading: servicesLoading } = useServicesCatalog(10);

  const homeProducts = useMemo(() => {
    const categoriesSeen = new Set<string>();
    return products.reduce<typeof products>((acc, product) => {
      const category = product.category ?? 'Other';
      if (!categoriesSeen.has(category)) {
        categoriesSeen.add(category);
        acc.push(product);
      }
      return acc;
    }, []);
  }, [products]);

  const homeVehicles = useMemo(() => vehicles.slice(0, 2), [vehicles]);

  const categories = [
    { icon: 'settings', label: 'Spare Parts' },
    { icon: 'tool', label: 'Accessories' },
    { icon: 'shield', label: 'Riding Gear' },
    { icon: 'disc', label: 'Tyres' },
    { icon: 'grid', label: 'All Categories' },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SubtlePatternBackground />
      {/* Location header — solid black chrome from theme */}
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerTop}>
          <Pressable
            style={styles.locationBtn}
            onPress={() =>
              navigation.navigate(CustomerStackRoutes.SavedAddresses, { selectMode: true })
            }
          >
            <View style={styles.locationIconWrapper}>
              <View style={styles.whiteLocationDot}>
                <Feather name="map-pin" size={12} color={colors.link} />
              </View>
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationLabelSwiggy}>Deliver to</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationNameSwiggy} numberOfLines={1}>
                  {deliveryLabel}
                </Text>
                <Feather name="chevron-down" size={14} color="#ffffff" style={{ marginTop: 2 }} />
              </View>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconBtnSwiggy}
              onPress={() => navigation.navigate(CustomerStackRoutes.Notifications)}
            >
              <Feather name="bell" size={22} color="#ffffff" />
              <View style={styles.whiteDotBadge} />
            </Pressable>
            <Pressable
              style={styles.iconBtnSwiggy}
              onPress={() => navigation.navigate(CustomerStackRoutes.Cart)}
            >
              <Feather name="shopping-cart" size={22} color="#ffffff" />
            </Pressable>
          </View>
        </View>
        <Pressable
          style={styles.searchBarSwiggy}
          onPress={() => navigation.navigate(CustomerStackRoutes.Search)}
        >
          <Feather name="search" size={18} color="#94A3B8" />
          <Text style={styles.searchPlaceholderSwiggy}>
            Search products, vehicles, services...
          </Text>
          <Feather name="camera" size={18} color="#94A3B8" />
        </Pressable>
      </ChromeHeader>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]}
      >
        <BannerCarousel
          onAiPress={() => navigation.navigate(CustomerStackRoutes.AiAssistant)}
          onPromoPress={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />

        <SectionHeader
          title="Categories"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        
        {/* Redesigned 5-Column Category Row */}
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <Pressable
              key={category.label}
              style={styles.categoryCard}
              onPress={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
            >
              <View
                style={[
                  styles.categoryIconBox,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Feather
                  name={category.icon}
                  size={20}
                  color={colors.textPrimary}
                />
              </View>
              <Text style={[styles.categoryLabelText, { color: colors.textPrimary }]}>
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader
          title="Featured Products"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        {productsLoading ? (
          <HorizontalProductsSkeleton />
        ) : (
          <FlatList
            data={homeProducts}
            keyExtractor={(i) => getProductId(i)}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                variant="compact"
                showAddToCart
                style={styles.productCard}
                onPress={() =>
                  navigation.navigate(CustomerStackRoutes.ProductDetail, {
                    id: getProductId(item),
                  })
                }
              />
            )}
          />
        )}

        <SectionHeader
          title="Browse Vehicles"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        {vehiclesLoading ? (
          <HorizontalVehiclesSkeleton />
        ) : (
          <FlatList
            data={homeVehicles}
            keyExtractor={(i) => getVehicleId(i)}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <VehicleCard
                vehicle={item}
                style={styles.vehicleCard}
                onNavigate={() =>
                  navigation.navigate(CustomerStackRoutes.VehicleDetail, {
                    id: getVehicleId(item),
                  })
                }
              />
            )}
          />
        )}

        <SectionHeader
          title="New Services"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        {servicesLoading ? (
          <HorizontalServicesSkeleton />
        ) : (
          <FlatList
            data={services}
            keyExtractor={(i) => getServiceId(i)}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <View style={styles.serviceCard}>
                <ServiceCard
                  service={item}
                  onNavigate={() =>
                    navigation.navigate(CustomerStackRoutes.ServiceDetail, {
                      id: getServiceId(item),
                    })
                  }
                />
              </View>
            )}
          />
        )}

        <PromoBanner onPress={() => navigation.navigate(CustomerTabRoutes.Marketplace)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  locationTextWrap: { flex: 1, minWidth: 0 },
  locationIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  locationGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  },
  blueDotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  whiteLocationDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabelSwiggy: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  locationNameSwiggy: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    flexShrink: 1,
  },
  iconBtnSwiggy: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  whiteDotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  searchBarSwiggy: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  searchPlaceholderSwiggy: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
  },
  searchPlaceholder: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  content: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: spacing.md, paddingTop: 20 },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: 4,
  },
  categoryCard: {
    alignItems: 'center',
    width: '18%',
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  categoryLabelText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 12,
  },
  sectionLoader: { marginBottom: spacing.lg, alignSelf: 'center' },
  horizontalList: { paddingRight: spacing.md, gap: 12, marginBottom: spacing.lg },
  productCard: { marginBottom: 0 },
  vehicleCard: { marginBottom: 0 },
  serviceCard: { marginBottom: 0 },
});
