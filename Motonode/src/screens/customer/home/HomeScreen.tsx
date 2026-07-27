import React, { useMemo } from 'react';
import {
  FlatList,
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
import Feather from 'react-native-vector-icons/Feather';

import { BannerCarousel, SectionHeader, PromoBanner, ChromeHeader, SubtlePatternBackground } from '@components/common';
import { ContentContainer } from '@components/layout/ContentContainer';
import { ProductCard } from '@components/cards/ProductCard';
import { VehicleCard } from '@components/cards/VehicleCard';
import { ServiceCard } from '@components/cards/ServiceCard';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useDealerVehiclesCatalog, useProducts, useServicesCatalog } from '@hooks/useCatalogData';
import { useBreakpoint } from '@hooks/useBreakpoint';
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
  const { featuredColumns, serviceColumns, contentPadding, isDesktop } = useBreakpoint();

  const tabBarPadding = useTabBarBottomPadding();
  const { displayLabel: deliveryLabel } = useDeliveryAddress();
  const { products, loading: productsLoading } = useProducts(20);
  const { vehicles, loading: vehiclesLoading } = useDealerVehiclesCatalog(10);
  const { services, loading: servicesLoading } = useServicesCatalog(10);

  const isWeb = Platform.OS === 'web';
  /** Deliver-to + search chrome: always on native; on web only below desktop (top nav replaces it). */
  const showHomeChrome = !isWeb || !isDesktop;
  const useFeaturedGrid = isWeb && featuredColumns > 0;
  const useServiceGrid = isWeb && serviceColumns > 0;

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
      {/* Deliver-to header: native always; web phone/tablet only (desktop uses top nav). */}
      {showHomeChrome ? (
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
      ) : null}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: tabBarPadding,
            paddingTop: isWeb && isDesktop ? spacing.md : 20,
          },
        ]}
      >
        <ContentContainer padded={false} style={{ paddingHorizontal: contentPadding }}>
        <BannerCarousel
          onAiPress={() => navigation.navigate(CustomerStackRoutes.AiAssistant)}
          onPromoPress={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
          onTestDrivePress={() =>
            navigation.navigate(CustomerTabRoutes.Marketplace, { initialTab: 3 })
          }
        />

        <SectionHeader
          title="Categories"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        
        <View style={[styles.categoriesContainer, isDesktop && styles.categoriesWeb]}>
          {categories.map((category) => (
            <Pressable
              key={category.label}
              style={[
                styles.categoryCard,
                isDesktop && styles.categoryCardWeb,
                isDesktop && { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
            >
              <View
                style={[
                  styles.categoryIconBox,
                  isDesktop && styles.categoryIconBoxWeb,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Feather
                  name={category.icon}
                  size={isDesktop ? 24 : 20}
                  color={isDesktop ? colors.primary : colors.textPrimary}
                />
              </View>
              <Text
                style={[
                  styles.categoryLabelText,
                  isDesktop && styles.categoryLabelWeb,
                  { color: colors.textPrimary },
                ]}
              >
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
            key={`products-${useFeaturedGrid ? featuredColumns : 'h'}`}
            data={homeProducts}
            keyExtractor={(i) => getProductId(i)}
            horizontal={!useFeaturedGrid}
            numColumns={useFeaturedGrid ? featuredColumns : 1}
            nestedScrollEnabled
            scrollEnabled={!useFeaturedGrid}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              useFeaturedGrid ? styles.featuredGrid : styles.horizontalList
            }
            columnWrapperStyle={useFeaturedGrid ? styles.featuredRow : undefined}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                variant={useFeaturedGrid ? 'grid' : 'compact'}
                showAddToCart
                style={useFeaturedGrid ? styles.featuredGridItem : styles.productCard}
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
            key={`vehicles-${useFeaturedGrid ? featuredColumns : 'h'}`}
            data={homeVehicles}
            keyExtractor={(i) => getVehicleId(i)}
            horizontal={!useFeaturedGrid}
            numColumns={useFeaturedGrid ? Math.min(featuredColumns, 4) : 1}
            nestedScrollEnabled
            scrollEnabled={!useFeaturedGrid}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              useFeaturedGrid ? styles.featuredGrid : styles.horizontalList
            }
            columnWrapperStyle={useFeaturedGrid ? styles.featuredRow : undefined}
            renderItem={({ item }) => (
              <VehicleCard
                vehicle={item}
                style={useFeaturedGrid ? styles.featuredGridItem : styles.vehicleCard}
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
            key={`services-${useServiceGrid ? serviceColumns : 'h'}`}
            data={services}
            keyExtractor={(i) => getServiceId(i)}
            horizontal={!useServiceGrid}
            numColumns={useServiceGrid ? serviceColumns : 1}
            nestedScrollEnabled
            scrollEnabled={!useServiceGrid}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              useServiceGrid ? styles.featuredGrid : styles.horizontalList
            }
            columnWrapperStyle={useServiceGrid ? styles.featuredRow : undefined}
            renderItem={({ item }) => (
              <View style={useServiceGrid ? styles.featuredGridItem : undefined}>
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
        </ContentContainer>
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
  scrollContent: {},
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: 4,
  },
  categoriesWeb: {
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    alignItems: 'center',
    width: '18%',
  },
  categoryCardWeb: {
    flex: 1,
    width: undefined,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
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
  categoryIconBoxWeb: {
    width: 48,
    height: 48,
    borderWidth: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 8,
  },
  categoryLabelText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 12,
  },
  categoryLabelWeb: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  sectionLoader: { marginBottom: spacing.lg, alignSelf: 'center' },
  horizontalList: { paddingRight: spacing.md, gap: 12, marginBottom: spacing.lg },
  featuredGrid: { marginBottom: 20, gap: 12 },
  featuredRow: { gap: 12 },
  featuredGridItem: { flex: 1 },
  productCard: { marginBottom: 0 },
  vehicleCard: { marginBottom: 0 },
});
