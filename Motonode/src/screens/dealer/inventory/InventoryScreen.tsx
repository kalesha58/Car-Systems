import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes, DealerTabRoutes } from '@constants/routes';
import { ChromeHeader } from '@components/common';
import { RegistrationStatusBanner } from '@components/dealer/RegistrationStatusBanner';
import {
  ProductsGridSkeleton,
  ServicesListSkeleton,
  VehiclesListSkeleton,
} from '@components/loaders';
import { useDealer } from '@context/index';
import { useColors } from '@hooks/useColors';
import { useDealerOnboardingStatus } from '@hooks/useDealerOnboardingStatus';
import {
  deleteDealerProduct,
  deleteDealerService,
  deleteDealerVehicle,
  getDealerInventoryVehicles,
  getDealerProducts,
  getDealerServices,
} from '@services/dealer.service';
import type { IProduct } from '@app-types/product';
import type { IService } from '@app-types/service';
import type { IDealerVehicle } from '@app-types/vehicle';
import { themeLight } from '@theme/colors';
import { getApiErrorMessage, isApiForbiddenError } from '@utils/apiHelpers';
import { showRegistrationBlockedAlert } from '@utils/dealerRegistration';
import {
  getProductId,
  getProductImage,
  getProductStockStatus,
  getServiceDurationLabel,
  getServiceId,
  getServiceImage,
  getVehicleId,
  getVehicleDisplayName,
  getVehicleImage,
} from '@utils/displayMappers';
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
  [DealerStackRoutes.NotificationSettings]: undefined;
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
  const { capabilities } = useDealer();
  const { status, canAccessDealerApis, isPending } = useDealerOnboardingStatus();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<IProduct[]>([]);
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'vehicles' | 'services'>(
    capabilities.hasProducts ? 'products' : capabilities.hasServices ? 'services' : 'products',
  );

  useEffect(() => {
    const allowed: Array<'products' | 'vehicles' | 'services'> = [];
    if (capabilities.hasProducts) allowed.push('products');
    if (capabilities.hasVehicles) allowed.push('vehicles');
    if (capabilities.hasServices) allowed.push('services');
    if (allowed.length > 0 && !allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  }, [capabilities.hasProducts, capabilities.hasVehicles, capabilities.hasServices, activeTab]);

  const fetchInventory = useCallback(async (isRefresh = false) => {
    if (!canAccessDealerApis) {
      setProducts([]);
      setVehicles([]);
      setServices([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [productsRes, vehiclesRes, servicesRes] = await Promise.all([
        capabilities.hasProducts ? getDealerProducts({ limit: 1000 }) : Promise.resolve(null),
        capabilities.hasVehicles ? getDealerInventoryVehicles({ limit: 1000 }) : Promise.resolve(null),
        capabilities.hasServices ? getDealerServices({ limit: 1000 }) : Promise.resolve(null),
      ]);

      setProducts(productsRes?.Response?.products ?? []);
      setVehicles(vehiclesRes?.Response?.vehicles ?? []);
      setServices(servicesRes?.Response?.services ?? []);
    } catch (error) {
      if (isApiForbiddenError(error) || isPending) {
        setProducts([]);
        setVehicles([]);
        setServices([]);
      } else {
        Alert.alert('Error', getApiErrorMessage(error, 'Failed to load inventory'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canAccessDealerApis, capabilities.hasProducts, capabilities.hasVehicles, capabilities.hasServices, isPending]);

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [fetchInventory]),
  );
  
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const tabs = [
    capabilities.hasProducts && { key: 'products', label: 'Products', count: products.length },
    capabilities.hasVehicles && { key: 'vehicles', label: 'Vehicles', count: vehicles.length },
    capabilities.hasServices && { key: 'services', label: 'Services', count: services.length },
  ].filter(Boolean) as { key: string; label: string; count: number }[];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()),
  );
  const filteredVehicles = vehicles.filter(
    (v) =>
      getVehicleDisplayName(v).toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddNew = () => {
    lightHaptic();
    if (!canAccessDealerApis) {
      showRegistrationBlockedAlert(status, {
        onViewRegistration: () => navigation.navigate(DealerStackRoutes.BusinessRegistration),
      });
      return;
    }
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
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDealerProduct(id);
            await fetchInventory(true);
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to delete product'));
          }
        },
      },
    ]);
  };

  const handleDeleteVehicle = (id: string, name: string) => {
    Alert.alert('Delete Vehicle', `Remove "${name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDealerVehicle(id);
            await fetchInventory(true);
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to delete vehicle'));
          }
        },
      },
    ]);
  };

  const handleDeleteService = (id: string, name: string) => {
    Alert.alert('Delete Service', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDealerService(id);
            await fetchInventory(true);
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to delete service'));
          }
        },
      },
    ]);
  };

  const getSummary = () => {
    if (activeTab === 'products') {
      return [
        { label: 'Total Items', value: products.length, color: themeLight.textSecondary, icon: 'shopping-bag', bg: '#F2F2F2' },
        {
          label: 'In Stock',
          value: products.filter((p) => getProductStockStatus(p.stock) === 'in_stock').length,
          color: '#10B981',
          icon: 'check-circle',
          bg: '#ECFDF5'
        },
        {
          label: 'Low Stock',
          value: products.filter((p) => getProductStockStatus(p.stock) === 'low_stock').length,
          color: '#F59E0B',
          icon: 'alert-triangle',
          bg: '#FFFBEB'
        },
        {
          label: 'Out of Stock',
          value: products.filter((p) => getProductStockStatus(p.stock) === 'out_of_stock').length,
          color: '#EF4444',
          icon: 'x-circle',
          bg: '#FEF2F2'
        },
      ];
    }
    if (activeTab === 'vehicles') {
      return [
        { label: 'Total Items', value: vehicles.length, color: themeLight.textSecondary, icon: 'truck', bg: '#F2F2F2' },
        {
          label: 'Available',
          value: vehicles.filter((v) => v.availability === 'available').length,
          color: '#10B981',
          icon: 'check-circle',
          bg: '#ECFDF5'
        },
        {
          label: 'Reserved',
          value: vehicles.filter((v) => v.availability === 'reserved').length,
          color: '#F59E0B',
          icon: 'clock',
          bg: '#FFFBEB'
        },
        { label: 'Sold', value: vehicles.filter((v) => v.availability === 'sold').length, color: '#EF4444', icon: 'shopping-cart', bg: '#FEF2F2' },
      ];
    }
    return [
      { label: 'Total Items', value: services.length, color: themeLight.textSecondary, icon: 'tool', bg: '#F2F2F2' },
      { label: 'Active', value: services.filter((s) => s.isActive !== false).length, color: '#10B981', icon: 'check-circle', bg: '#ECFDF5' },
      { label: 'Paused', value: services.filter((s) => s.isActive === false).length, color: '#F59E0B', icon: 'pause-circle', bg: '#FFFBEB' },
      {
        label: 'Avg Price',
        value: '₹' + (services.length > 0
          ? Math.round(services.reduce((s, x) => s + x.price, 0) / services.length)
          : 0),
        color: '#8B5CF6',
        icon: 'dollar-sign',
        bg: '#F3E8FF'
      },
    ];
  };

  const renderProduct = ({ item }: { item: IProduct }) => {
    const stockStatus = getProductStockStatus(item.stock);
    const st = PRODUCT_STATUS[stockStatus] || { label: 'In Stock', color: '#10B981' };
    const productId = getProductId(item);

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={{ uri: getProductImage(item) }}
          style={styles.itemImage}
        />

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
            {item.category || 'General'} • {item.brand}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemCategory, { color: colors.textTertiary }]}>
              {item.category}
            </Text>
            <View style={[styles.badge, { backgroundColor: st.color + '15' }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.itemRight}>
          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
            ₹{item.price.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.itemStock, { color: colors.textSecondary }]}>
            {item.stock} units
          </Text>
          
          <View style={styles.itemActions}>
            <Pressable
              style={[styles.actionIcon, { borderColor: '#E60012', backgroundColor: '#F2F2F2' }]}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.ProductForm, { id: productId });
              }}
            >
              <Feather name="edit-2" size={14} color={colors.icon} />
            </Pressable>
            <Pressable
              style={[styles.actionIcon, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}
              onPress={() => handleDeleteProduct(productId, item.name)}
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderVehicle = ({ item }: { item: IDealerVehicle }) => {
    const st = VEHICLE_STATUS[item.availability] || { label: 'Available', color: '#10B981' };
    const vehicleId = getVehicleId(item);
    const displayName = getVehicleDisplayName(item);

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={{ uri: getVehicleImage(item) }}
          style={styles.itemImage}
        />

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
            {item.brand} • {item.year} • {item.fuelType || '—'}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemCategory, { color: colors.textTertiary }]}>
              {item.transmission || '—'}
            </Text>
            <View style={[styles.badge, { backgroundColor: st.color + '15' }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.itemRight}>
          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
            ₹{(item.price / 100000).toFixed(1)}L
          </Text>
          <Text style={[styles.itemStock, { color: colors.textSecondary }]}>
            {item.allowTestDrive ? 'Test drive on' : 'No test drive'}
          </Text>

          <View style={styles.itemActions}>
            <Pressable
              style={[styles.actionIcon, { borderColor: '#E60012', backgroundColor: '#F2F2F2' }]}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.VehicleForm, { id: vehicleId });
              }}
            >
              <Feather name="edit-2" size={14} color={colors.icon} />
            </Pressable>
            <Pressable
              style={[styles.actionIcon, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}
              onPress={() => handleDeleteVehicle(vehicleId, displayName)}
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderService = ({ item }: { item: IService }) => {
    const serviceId = getServiceId(item);
    const duration = getServiceDurationLabel(item);
    const isActive = item.isActive !== false;

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={{ uri: getServiceImage(item) }}
          style={styles.itemImage}
        />

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
            {item.category || 'Service'} • {duration}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemCategory, { color: colors.textTertiary }]}>
              {item.slotBookingEnabled ? 'Slot booking' : 'Walk-in'}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: (isActive ? '#10B981' : '#F59E0B') + '15' },
              ]}
            >
              <Text style={[styles.badgeText, { color: isActive ? '#10B981' : '#F59E0B' }]}>
                {isActive ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemRight}>
          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
            ₹{item.price.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.itemStock, { color: colors.textSecondary }]}>
            {duration}
          </Text>

          <View style={styles.itemActions}>
            <Pressable
              style={[styles.actionIcon, { borderColor: '#E60012', backgroundColor: '#F2F2F2' }]}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.ServiceForm, { id: serviceId });
              }}
            >
              <Feather name="edit-2" size={14} color={colors.icon} />
            </Pressable>
            <Pressable
              style={[styles.actionIcon, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}
              onPress={() => handleDeleteService(serviceId, item.name)}
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const data =
    activeTab === 'products'
      ? filteredProducts
      : activeTab === 'vehicles'
        ? filteredVehicles
        : filteredServices;
        
  const summary = getSummary();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Inventory</Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.72)' }]}>
              Manage your products, vehicles & services
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.notificationBtn}
              onPress={() => {
                lightHaptic();
                navigation.navigate(DealerStackRoutes.NotificationSettings);
              }}
            >
              <Feather name="bell" size={22} color={colors.headerForeground} />
            </Pressable>
          </View>
        </View>

        <RegistrationStatusBanner
          status={status}
          onPress={
            status !== 'approved'
              ? () =>
                  showRegistrationBlockedAlert(status, {
                    onViewRegistration: () =>
                      navigation.navigate(DealerStackRoutes.BusinessRegistration),
                  })
              : undefined
          }
        />

        <View style={[styles.searchBar, { backgroundColor: '#ffffff', borderColor: '#E2E8F0' }]}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search inventory..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          <Pressable style={styles.filterSlidersBtn}>
            <Feather name="sliders" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {tabs.length > 1 && (
          <View style={styles.tabsRow}>
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.tab,
                    isSelected ? { backgroundColor: '#E60012' } : { backgroundColor: '#F1F5F9' },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setActiveTab(tab.key as 'products' | 'vehicles' | 'services');
                  }}
                >
                  <Text style={[styles.tabText, isSelected ? { color: '#ffffff' } : { color: colors.textSecondary }]}>
                    {tab.label} ({tab.count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ChromeHeader>

      {/* Summary Row (4-column Grid) */}
      <View style={styles.summaryRow}>
        {summary.map((s) => (
          <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: s.bg }]}>
              <Feather name={s.icon as any} size={14} color={s.color} />
            </View>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* All Products header list */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.listHeaderTitle, { color: colors.textPrimary }]}>
          All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </Text>
        <View style={styles.listHeaderActions}>
          <Text style={[styles.sortText, { color: colors.textSecondary }]}>Sort by: Newest</Text>
          <Feather name="chevron-down" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Pressable style={styles.gridToggleBtn}>
            <Feather name="grid" size={14} color={colors.icon} />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Inventory List */}
      <FlatList<IProduct | IDealerVehicle | IService>
        data={data}
        keyExtractor={(item) => {
          if (activeTab === 'products') return getProductId(item as IProduct);
          if (activeTab === 'vehicles') return getVehicleId(item as IDealerVehicle);
          return getServiceId(item as IService);
        }}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} />
        }
        renderItem={info => {
          if (activeTab === 'products') {
            return renderProduct({ item: info.item as IProduct });
          }
          if (activeTab === 'vehicles') {
            return renderVehicle({ item: info.item as IDealerVehicle });
          }
          return renderService({ item: info.item as IService });
        }}
        ListEmptyComponent={
          loading ? (
            activeTab === 'products' ? (
              <ProductsGridSkeleton />
            ) : activeTab === 'vehicles' ? (
              <VehiclesListSkeleton />
            ) : (
              <ServicesListSkeleton />
            )
          ) : !canAccessDealerApis ? (
            <View style={styles.empty}>
              <Feather name="clock" size={48} color="#F59E0B" />
              <Text style={[styles.emptyText, { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' }]}>
                {status === 'pending' ? 'Registration pending' : 'Registration required'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {status === 'pending'
                  ? 'Your business registration is under review. Inventory will unlock once approved.'
                  : 'Complete business registration to start adding products, vehicles, and services.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Feather name="package" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {activeTab} found
              </Text>
            </View>
          )
        }
      />

      {/* Floating Action Button (FAB) + Prompt Banner */}
      <View style={[styles.bottomCTAContainer, { backgroundColor: '#F2F2F2', borderTopColor: colors.border }]}>
        <View style={styles.ctaLeft}>
          <View style={styles.ctaIconBox}>
            <Feather name="box" size={18} color={colors.icon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>Keep your inventory updated!</Text>
            <Text style={[styles.ctaSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
              Regular updates help you manage stock better and avoid missing sales.
            </Text>
          </View>
        </View>
        <Pressable style={styles.ctaBtn} onPress={handleAddNew}>
          <Text style={styles.ctaBtnText}>Add New Item</Text>
        </Pressable>
      </View>

      {/* FAB */}
      <Pressable style={styles.fabBtn} onPress={handleAddNew}>
        <Feather name="plus" size={24} color="#ffffff" />
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
    padding: 4,
  },
  redBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadgeText: { color: '#ffffff', fontSize: 8, fontFamily: 'Inter_700Bold' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', padding: 0 },
  filterSlidersBtn: {
    padding: 4,
  },
  tabsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  tabText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', textAlign: 'center', marginTop: 1 },
  
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listHeaderTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  listHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginRight: 2 },
  gridToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { padding: 16, paddingTop: 4, gap: 12 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  itemSub: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  itemCategory: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  itemStock: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  itemActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8, paddingHorizontal: 24 },

  bottomCTAContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  ctaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  ctaSubtitle: { fontSize: 10, marginTop: 1 },
  ctaBtn: {
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaBtnText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  fabBtn: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E60012',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E60012',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 11,
  },
});
