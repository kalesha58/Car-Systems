import React, { useState } from 'react';
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

import { ProductCard } from '@components/cards/ProductCard';
import { ServiceCard } from '@components/cards/ServiceCard';
import { VehicleCard } from '@components/cards/VehicleCard';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useCart } from '@context/index';
import { PRODUCTS, SERVICES, VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import type { CustomerTabParamList } from '@navigation/CustomerTabsNavigator';

const TABS = ['Products', 'Vehicles', 'Services'];

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
};

type MarketplaceScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Marketplace>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

export function MarketplaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MarketplaceScreenNavigationProp>();
  const { count: cartCount } = useCart();
  const [activeTab, setActiveTab] = useState(0);
  const [filterActive, setFilterActive] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate(CustomerStackRoutes.Search)}
              style={styles.iconBtn}
            >
              <Feather name="search" size={22} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate(CustomerStackRoutes.Cart)}
            >
              <Feather name="shopping-cart" size={22} color="#fff" />
              {cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab, i) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === i && [styles.tabActive, { backgroundColor: colors.primary }]]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabText, { color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.7)' }]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <Pressable style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setFilterActive(!filterActive)}>
          <Feather name="sliders" size={16} color={colors.textSecondary} />
          <Text style={[styles.filterBtnText, { color: colors.textSecondary }]}>Filter</Text>
        </Pressable>
        {['Price: Low to High', 'Most Popular', 'Newest'].map((sort) => (
          <Pressable key={sort} style={[styles.sortChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sortChipText, { color: colors.textSecondary }]}>{sort}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 0 && (
        <FlatList
          data={PRODUCTS}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={[styles.gridContent, Platform.OS === 'web' && { paddingBottom: 34 }]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              style={styles.gridItem}
              onPress={() =>
                navigation.navigate(CustomerStackRoutes.ProductDetail, { id: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found</Text>
            </View>
          }
        />
      )}

      {activeTab === 1 && (
        <FlatList
          data={VEHICLES}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.listContent, Platform.OS === 'web' && { paddingBottom: 34 }]}
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No vehicles found</Text>
            </View>
          }
        />
      )}

      {activeTab === 2 && (
        <ScrollView
          contentContainerStyle={[styles.listContent, Platform.OS === 'web' && { paddingBottom: 34 }]}
          showsVerticalScrollIndicator={false}
        >
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  tabRow: { flexDirection: 'row', gap: 8, paddingBottom: 16 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  tabActive: {},
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, flexWrap: 'wrap' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  sortChipText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  gridContent: { padding: 16, paddingTop: 4 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  gridItem: { flex: 1 },
  listContent: { padding: 16, paddingTop: 4 },
  vehicleItem: { width: '100%', marginBottom: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
