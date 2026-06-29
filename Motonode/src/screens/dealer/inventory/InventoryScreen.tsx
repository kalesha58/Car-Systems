import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes, DealerTabRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { DealerProduct, DealerService, DealerVehicle } from '@data/dealerData';
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

type InventoryNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DealerTabParamList, typeof DealerTabRoutes.Inventory>,
  NativeStackNavigationProp<DealerStackParamList>
>;

const PRODUCT_STATUS: Record<string, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: '#10B981' },
  low_stock: { label: 'Low Stock', color: '#F59E0B' },
  out_of_stock: { label: 'Out of Stock', color: '#EF4444' },
};

const VEHICLE_STATUS: Record<string, { label: string; color: string }> = {
  available: { label: 'Available', color: '#10B981' },
  reserved: { label: 'Reserved', color: '#F59E0B' },
  sold: { label: 'Sold', color: '#EF4444' },
};

export function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<InventoryNavigationProp>();
  const { capabilities, products, vehicles, services, deleteProduct, deleteVehicle, deleteService } =
    useDealer();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'vehicles' | 'services'>(
    capabilities.hasProducts ? 'products' : capabilities.hasServices ? 'services' : 'products',
  );
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const tabs = [
    capabilities.hasProducts && { key: 'products', label: 'Products', count: products.length },
    capabilities.hasVehicles && { key: 'vehicles', label: 'Vehicles', count: vehicles.length },
    capabilities.hasServices && { key: 'services', label: 'Services', count: services.length },
  ].filter(Boolean) as { key: string; label: string; count: number }[];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddNew = () => {
    lightHaptic();
    if (activeTab === 'products') {
      navigation.navigate(DealerStackRoutes.ProductForm, {});
    } else if (activeTab === 'vehicles') {
      navigation.navigate(DealerStackRoutes.VehicleForm, {});
    } else {
      navigation.navigate(DealerStackRoutes.ServiceForm, {});
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    Alert.alert('Delete Product', `Remove "${name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(id) },
    ]);
  };

  const handleDeleteVehicle = (id: string, name: string) => {
    Alert.alert('Delete Vehicle', `Remove "${name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVehicle(id) },
    ]);
  };

  const handleDeleteService = (id: string, name: string) => {
    Alert.alert('Delete Service', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteService(id) },
    ]);
  };

  const getSummary = () => {
    if (activeTab === 'products') {
      return [
        { label: 'Total', value: products.length, color: colors.primary },
        {
          label: 'In Stock',
          value: products.filter((p) => p.status === 'in_stock').length,
          color: '#10B981',
        },
        {
          label: 'Low Stock',
          value: products.filter((p) => p.status === 'low_stock').length,
          color: '#F59E0B',
        },
        {
          label: 'Out',
          value: products.filter((p) => p.status === 'out_of_stock').length,
          color: '#EF4444',
        },
      ];
    }
    if (activeTab === 'vehicles') {
      return [
        { label: 'Total', value: vehicles.length, color: colors.primary },
        {
          label: 'Available',
          value: vehicles.filter((v) => v.status === 'available').length,
          color: '#10B981',
        },
        {
          label: 'Reserved',
          value: vehicles.filter((v) => v.status === 'reserved').length,
          color: '#F59E0B',
        },
        { label: 'Sold', value: vehicles.filter((v) => v.status === 'sold').length, color: '#EF4444' },
      ];
    }
    return [
      { label: 'Total', value: services.length, color: colors.primary },
      { label: 'Active', value: services.filter((s) => s.available).length, color: '#10B981' },
      { label: 'Paused', value: services.filter((s) => !s.available).length, color: '#F59E0B' },
      {
        label: 'Avg ₹',
        value:
          services.length > 0
            ? Math.round(services.reduce((s, x) => s + x.price, 0) / services.length)
            : 0,
        color: '#8B5CF6',
      },
    ];
  };

  const renderProduct = ({ item }: { item: DealerProduct }) => {
    const st = PRODUCT_STATUS[item.status];
    return (
      <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="package" size={22} color={colors.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemSub, { color: colors.textTertiary }]}>
            {item.sku} · {item.brand}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
              {item.category}
            </Text>
            <View style={[styles.badge, { backgroundColor: st.color + '20' }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
            ₹{item.price.toLocaleString('en-IN')}
          </Text>
          <Text
            style={[
              styles.itemStock,
              { color: item.stock === 0 ? colors.destructive : colors.textSecondary },
            ]}
          >
            {item.stock} units
          </Text>
          <View style={styles.itemActions}>
            <Pressable
              style={styles.actionIcon}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.ProductForm, { id: item.id });
              }}
            >
              <Feather name="edit-2" size={16} color={colors.primary} />
            </Pressable>
            <Pressable
              style={styles.actionIcon}
              onPress={() => handleDeleteProduct(item.id, item.name)}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderVehicle = ({ item }: { item: DealerVehicle }) => {
    const st = VEHICLE_STATUS[item.status];
    return (
      <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: '#7C3AED' + '15' }]}>
          <Feather name={item.type === 'bike' ? 'wind' : 'truck'} size={22} color="#7C3AED" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemSub, { color: colors.textTertiary }]}>
            {item.brand} · {item.year} · {item.fuel}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
              {item.transmission}
            </Text>
            <View style={[styles.badge, { backgroundColor: st.color + '20' }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
            ₹{(item.price / 100000).toFixed(1)}L
          </Text>
          <Text style={[styles.itemStock, { color: colors.textSecondary }]}>{item.stock} units</Text>
          <View style={styles.itemActions}>
            <Pressable
              style={styles.actionIcon}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.VehicleForm, { id: item.id });
              }}
            >
              <Feather name="edit-2" size={16} color={colors.primary} />
            </Pressable>
            <Pressable
              style={styles.actionIcon}
              onPress={() => handleDeleteVehicle(item.id, item.name)}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderService = ({ item }: { item: DealerService }) => (
    <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.itemIcon, { backgroundColor: '#059669' + '15' }]}>
        <Feather name="tool" size={22} color="#059669" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemSub, { color: colors.textTertiary }]}>
          {item.category} · {item.duration}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
            {item.slotsPerDay} slots/day
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: (item.available ? '#10B981' : '#F59E0B') + '20' },
            ]}
          >
            <Text
              style={[styles.badgeText, { color: item.available ? '#10B981' : '#F59E0B' }]}
            >
              {item.available ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
          ₹{item.price.toLocaleString('en-IN')}
        </Text>
        <Text style={[styles.itemStock, { color: colors.textSecondary }]}>{item.duration}</Text>
        <View style={styles.itemActions}>
          <Pressable
            style={styles.actionIcon}
            onPress={() => {
              lightHaptic();
              navigation.navigate(DealerStackRoutes.ServiceForm, { id: item.id });
            }}
          >
            <Feather name="edit-2" size={16} color={colors.primary} />
          </Pressable>
          <Pressable
            style={styles.actionIcon}
            onPress={() => handleDeleteService(item.id, item.name)}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const data =
    activeTab === 'products'
      ? filteredProducts
      : activeTab === 'vehicles'
        ? filteredVehicles
        : filteredServices;
  const summary = getSummary();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddNew}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={[styles.searchInput, { color: '#fff' }]}
            placeholder="Search inventory…"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {tabs.length > 1 && (
          <View style={styles.tabsRow}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
                onPress={() => {
                  lightHaptic();
                  setActiveTab(tab.key as 'products' | 'vehicles' | 'services');
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)' },
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.summaryRow}>
        {summary.map((s) => (
          <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <FlatList<DealerProduct | DealerVehicle | DealerService>
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, Platform.OS === 'web' && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={info => {
          if (activeTab === 'products') {
            return renderProduct({ item: info.item as DealerProduct });
          }
          if (activeTab === 'vehicles') {
            return renderVehicle({ item: info.item as DealerVehicle });
          }
          return renderService({ item: info.item as DealerService });
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {activeTab} found
            </Text>
            <Pressable
              style={[styles.emptyAdd, { backgroundColor: colors.primary }]}
              onPress={handleAddNew}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyAddText}>
                Add{' '}
                {activeTab === 'products'
                  ? 'Product'
                  : activeTab === 'vehicles'
                    ? 'Vehicle'
                    : 'Service'}
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  tabsRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  summaryValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 2 },
  list: { padding: 16, paddingTop: 4, gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  itemIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  itemSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemCategory: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  itemRight: { alignItems: 'flex-end', gap: 3 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  itemStock: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  itemActions: { flexDirection: 'row', gap: 6, marginTop: 2 },
  actionIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  emptyAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyAddText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
