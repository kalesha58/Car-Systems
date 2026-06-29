import React from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { AIBanner } from '@components/common/AIBanner';
import { CategoryChip } from '@components/common/CategoryChip';
import { SectionHeader } from '@components/common/SectionHeader';
import { ProductCard } from '@components/cards/ProductCard';
import { VehicleCard } from '@components/cards/VehicleCard';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useAuth, useCart } from '@context/index';
import { CATEGORIES, PRODUCTS, VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import type { CustomerTabParamList } from '@navigation/CustomerTabsNavigator';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Home>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

export function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { count: cartCount } = useCart();
  const { user } = useAuth();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.locationBtn}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <View>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationName}>{user?.location ?? 'Bengaluru'}</Text>
                <Feather name="chevron-down" size={14} color="#fff" />
              </View>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate(CustomerStackRoutes.Notifications)}
            >
              <Feather name="bell" size={22} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate(CustomerStackRoutes.Cart)}
            >
              <Feather name="shopping-cart" size={22} color="#fff" />
              {cartCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
        <Pressable
          style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          onPress={() => navigation.navigate(CustomerStackRoutes.Search)}
        >
          <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.searchPlaceholder}>Search products, vehicles, services...</Text>
          <Feather name="camera" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, Platform.OS === 'web' && { paddingBottom: 34 }]}
      >
        <AIBanner onPress={() => navigation.navigate(CustomerStackRoutes.AiAssistant)} />

        <SectionHeader
          title="Categories"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        <FlatList
          data={CATEGORIES}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.label}
              icon={item.icon}
              onPress={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
            />
          )}
        />

        <SectionHeader
          title="Featured Products"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        <FlatList
          data={PRODUCTS.slice(0, 6)}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              style={styles.productCard}
              onPress={() =>
                navigation.navigate(CustomerStackRoutes.ProductDetail, { id: item.id })
              }
            />
          )}
        />

        <SectionHeader
          title="Browse Vehicles"
          onViewAll={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
        />
        <FlatList
          data={VEHICLES}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              style={styles.vehicleCard}
              onNavigate={() =>
                navigation.navigate(CustomerStackRoutes.VehicleDetail, { id: item.id })
              }
            />
          )}
        />

        <View style={styles.offerBanner}>
          <View style={[styles.offerCard, { backgroundColor: colors.primary }]}>
            <View>
              <Text style={styles.offerTitle}>First Service Free!</Text>
              <Text style={styles.offerSubtitle}>Book any mechanic service and get ₹200 off</Text>
              <Pressable
                style={styles.offerBtn}
                onPress={() => navigation.navigate(CustomerTabRoutes.Marketplace)}
              >
                <Text style={styles.offerBtnText}>Book Now</Text>
              </Pressable>
            </View>
            <Feather name="tool" size={64} color="rgba(255,255,255,0.2)" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  locationLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationName: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Inter_400Regular' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20 },
  categoriesRow: { paddingRight: 16, gap: 10, marginBottom: 24 },
  horizontalList: { paddingRight: 16, gap: 12, marginBottom: 24 },
  productCard: { marginBottom: 0 },
  vehicleCard: { marginBottom: 0 },
  offerBanner: { marginBottom: 16 },
  offerCard: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  offerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  offerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  offerBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  offerBtnText: { color: '#2563EB', fontSize: 13, fontFamily: 'Inter_700Bold' },
});
