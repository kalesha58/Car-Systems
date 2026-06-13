import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts, fontStyle } from '@utils/Constants';
import { navigate } from '@utils/NavigationUtils';
import CustomText from '@components/ui/CustomText';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '@components/ui/CustomHeader';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import { getDealerById, parseDealerResponse } from '@service/dealerService';
import { getProducts } from '@service/productService';
import { getDealerVehicles } from '@service/vehicleService';
import { getServicesByDealerId } from '@service/serviceService';
import { shareStore } from '@utils/shareUtils';
import { useCartStore } from '@state/cartStore';
import type { IDealer, IDealerSnapshot } from '../../types/dealer/IDealer';
import type { IProduct } from '../../types/product/IProduct';
import type { IDealerVehicle } from '../../types/vehicle/IVehicle';
import type { IService } from '../../types/service/IService';

type DealerStoreRouteParams = {
  DealerStore: {
    dealerId: string;
    dealerSnapshot?: IDealerSnapshot;
  };
};

type TabType = 'products' | 'vehicles' | 'services';

const DEFAULT_BANNER_URI =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800';

const snapshotToDealer = (snapshot: IDealerSnapshot, routeDealerId: string): IDealer => ({
  id: routeDealerId,
  businessRegistrationId: snapshot.businessRegistrationId,
  name: snapshot.businessName,
  businessName: snapshot.businessName,
  email: '',
  phone: '',
  status: 'approved',
  address: snapshot.address,
  dealerType: snapshot.dealerType,
  storeOpen: snapshot.storeOpen,
  shopPhotos: snapshot.shopPhotos,
  createdAt: new Date().toISOString(),
});

const { width: screenWidth } = Dimensions.get('window');

const DealerStoreScreen: React.FC = () => {
  const route = useRoute<RouteProp<DealerStoreRouteParams, 'DealerStore'>>();
  const { dealerId, dealerSnapshot } = route.params;
  const { colors, isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const { addItem } = useCartStore();

  // States
  const [dealer, setDealer] = useState<IDealer | null>(() =>
    dealerSnapshot ? snapshotToDealer(dealerSnapshot, dealerId) : null,
  );
  const [products, setProducts] = useState<IProduct[]>([]);
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  
  const [loading, setLoading] = useState(!dealerSnapshot);
  const [dealerFetchError, setDealerFetchError] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeOpen, setStoreOpen] = useState(
    dealerSnapshot?.storeOpen !== undefined ? dealerSnapshot.storeOpen : true,
  );

  const catalogDealerId = useMemo(
    () =>
      dealer?.businessRegistrationId ??
      dealerSnapshot?.businessRegistrationId ??
      dealerId,
    [dealer?.businessRegistrationId, dealerSnapshot?.businessRegistrationId, dealerId],
  );

  const bannerUri =
    dealer?.shopPhotos?.[0]?.url ?? dealerSnapshot?.shopPhotos?.[0]?.url ?? DEFAULT_BANNER_URI;

  const inventoryStats = useMemo(() => {
    const parts: string[] = [];
    if (products.length > 0) {
      parts.push(`${products.length} Product${products.length !== 1 ? 's' : ''}`);
    }
    if (vehicles.length > 0) {
      parts.push(`${vehicles.length} Vehicle${vehicles.length !== 1 ? 's' : ''}`);
    }
    if (services.length > 0) {
      parts.push(`${services.length} Service${services.length !== 1 ? 's' : ''}`);
    }
    return parts.join(' · ');
  }, [products.length, vehicles.length, services.length]);

  const fetchDealerDetails = async () => {
    const profileFetchId = dealerSnapshot?.businessRegistrationId ?? dealerId;
    try {
      setLoading(true);
      setDealerFetchError(false);
      const response = await getDealerById(profileFetchId);
      const dealerData = parseDealerResponse(response);
      if (dealerData) {
        setDealer(dealerData);
        setStoreOpen(dealerData.storeOpen !== undefined ? dealerData.storeOpen : true);
      } else if (!dealerSnapshot) {
        setDealerFetchError(true);
      }
    } catch (error) {
      console.error('Error fetching dealer:', error);
      if (!dealerSnapshot) {
        setDealerFetchError(true);
        showError('Failed to load dealer information');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Dealer details
  useEffect(() => {
    if (dealerId) {
      fetchDealerDetails();
    }
  }, [dealerId]);

  useEffect(() => {
    setProducts([]);
    setVehicles([]);
    setServices([]);
  }, [catalogDealerId]);

  // Fetch products, vehicles, and services based on activeTab
  useEffect(() => {
    if (!catalogDealerId) return;

    if (activeTab === 'products' && products.length === 0) {
      const fetchProducts = async () => {
        try {
          setProductsLoading(true);
          const response = await getProducts({ dealerId: catalogDealerId, limit: 100 });
          if (response.success && response.Response?.products) {
            setProducts(response.Response.products);
          } else {
            setProducts([]);
          }
        } catch (error) {
          console.error('Error fetching products:', error);
          setProducts([]);
        } finally {
          setProductsLoading(false);
        }
      };
      fetchProducts();
    } else if (activeTab === 'vehicles' && vehicles.length === 0) {
      const fetchVehicles = async () => {
        try {
          setVehiclesLoading(true);
          const response = await getDealerVehicles({ dealerId: catalogDealerId, limit: 100 });
          if (response.success && response.Response?.vehicles) {
            setVehicles(response.Response.vehicles);
          } else {
            setVehicles([]);
          }
        } catch (error) {
          console.error('Error fetching vehicles:', error);
          setVehicles([]);
        } finally {
          setVehiclesLoading(false);
        }
      };
      fetchVehicles();
    } else if (activeTab === 'services' && (!Array.isArray(services) || services.length === 0)) {
      const fetchServices = async () => {
        try {
          setServicesLoading(true);
          const response = await getServicesByDealerId(catalogDealerId, { limit: 100 });
          if (response.success && response.Response?.services) {
            setServices(response.Response.services);
          } else {
            setServices([]);
          }
        } catch (error) {
          console.error('Error fetching services:', error);
          setServices([]);
        } finally {
          setServicesLoading(false);
        }
      };
      fetchServices();
    }
  }, [activeTab, catalogDealerId, products.length, vehicles.length, services.length]);

  // Handle Share Store
  const handleShare = async () => {
    if (!dealer) return;
    try {
      const shared = await shareStore(dealer.businessName || dealer.name, dealerId);
      if (shared) {
        showSuccess('Store link shared successfully');
      }
    } catch (error) {
      showError('Failed to share store link');
    }
  };

  // Add to Cart
  const handleAddToCart = (product: IProduct) => {
    if (product.stock === 0) {
      showError('Product is out of stock');
      return;
    }
    const productWithId = { ...product, _id: product.id };
    addItem(productWithId);
    showSuccess('Product added to cart');
  };

  // Search filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) =>
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vehicles, searchQuery]);

  const filteredServices = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    return list.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        bannerContainer: {
          width: '100%',
          height: 160,
          backgroundColor: colors.backgroundSecondary,
          position: 'relative',
        },
        bannerImage: {
          width: '100%',
          height: '100%',
        },
        bannerOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
        profileCard: {
          backgroundColor: colors.cardBackground,
          marginHorizontal: 16,
          marginTop: -60,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? colors.border : '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
          marginBottom: 16,
        },
        storeBadgeRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        storeTypeTag: {
          backgroundColor: colors.secondary + '15',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
        },
        storeTypeText: {
          color: colors.secondary,
          ...fontStyle(Fonts.Medium),
          fontSize: RFValue(10),
        },
        statusBadge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
        },
        statusText: {
          ...fontStyle(Fonts.Bold),
          fontSize: RFValue(10),
          color: '#fff',
        },
        businessName: {
          color: colors.text,
          fontSize: RFValue(18),
          ...fontStyle(Fonts.Bold),
          marginBottom: 6,
        },
        addressRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 6,
          marginTop: 4,
        },
        addressText: {
          color: colors.textSecondary,
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Regular),
          flex: 1,
        },
        inventoryStats: {
          color: colors.textSecondary,
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Medium),
          marginTop: 8,
        },
        profileErrorRow: {
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
        },
        profileErrorText: {
          color: colors.textSecondary,
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Regular),
          textAlign: 'center',
        },
        retryButton: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: colors.secondary,
        },
        retryButtonText: {
          color: '#fff',
          fontSize: RFValue(12),
          ...fontStyle(Fonts.SemiBold),
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundSecondary,
          marginHorizontal: 16,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === 'ios' ? 10 : 2,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
        searchIcon: {
          marginRight: 8,
          opacity: 0.6,
        },
        searchInput: {
          flex: 1,
          color: colors.text,
          ...fontStyle(Fonts.Regular),
          fontSize: RFValue(13),
        },
        tabsContainer: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginHorizontal: 16,
          marginBottom: 16,
        },
        tabButton: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 12,
          position: 'relative',
        },
        tabText: {
          ...fontStyle(Fonts.SemiBold),
          fontSize: RFValue(13),
        },
        activeIndicator: {
          position: 'absolute',
          bottom: 0,
          height: 3,
          width: '60%',
          backgroundColor: colors.secondary,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
        gridList: {
          paddingHorizontal: 16,
          paddingBottom: 40,
        },
        productCard: {
          flex: 1,
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          margin: 6,
          overflow: 'hidden',
          maxWidth: (screenWidth - 44) / 2,
        },
        productImage: {
          width: '100%',
          height: 120,
          backgroundColor: colors.backgroundSecondary,
        },
        productInfo: {
          padding: 10,
        },
        productBrand: {
          fontSize: RFValue(9),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
          textTransform: 'uppercase',
          marginBottom: 2,
        },
        productName: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
          height: 36,
        },
        productFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        },
        productPrice: {
          fontSize: RFValue(13),
          ...fontStyle(Fonts.SemiBold),
          color: colors.text,
        },
        addToCartBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.secondary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        vehicleCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          overflow: 'hidden',
        },
        vehicleImage: {
          width: '100%',
          height: 160,
          backgroundColor: colors.backgroundSecondary,
        },
        vehicleInfo: {
          padding: 16,
        },
        vehicleHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        vehicleModel: {
          fontSize: RFValue(15),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
          flex: 1,
          marginRight: 8,
        },
        vehicleYear: {
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
          marginTop: 2,
        },
        vehicleSpecs: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 10,
          flexWrap: 'wrap',
        },
        specBadge: {
          backgroundColor: colors.backgroundSecondary,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        specText: {
          fontSize: RFValue(10),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
        },
        vehicleFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12,
        },
        vehiclePrice: {
          fontSize: RFValue(16),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
        },
        vehicleConditionTag: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
        },
        serviceCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          padding: 16,
          flexDirection: 'row',
          gap: 12,
        },
        serviceImage: {
          width: 80,
          height: 80,
          borderRadius: 8,
          backgroundColor: colors.backgroundSecondary,
        },
        serviceInfo: {
          flex: 1,
          justifyContent: 'center',
        },
        serviceName: {
          fontSize: RFValue(14),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
          marginBottom: 4,
        },
        serviceDetails: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 2,
        },
        serviceDetailText: {
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
        },
        serviceFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 10,
        },
        servicePrice: {
          fontSize: RFValue(14),
          ...fontStyle(Fonts.Bold),
          color: colors.secondary,
        },
        viewServiceBtn: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: colors.secondary,
        },
        viewServiceText: {
          color: '#fff',
          ...fontStyle(Fonts.SemiBold),
          fontSize: RFValue(11),
        },
        emptyContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 60,
          paddingHorizontal: 40,
        },
        emptyTitle: {
          fontSize: RFValue(15),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
          marginTop: 12,
          marginBottom: 6,
        },
        emptyText: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 18,
        },
        skeletonGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 10,
        },
        skeletonGridItem: {
          width: (screenWidth - 44) / 2,
          height: 200,
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          margin: 6,
          padding: 8,
          gap: 8,
        },
      }),
    [colors, isDark]
  );

  // Render Skeletons for Loading
  const renderSkeletons = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonGridItem}>
          <SkeletonLoader width="100%" height={100} borderRadius={8} />
          <SkeletonLoader width="40%" height={12} borderRadius={4} />
          <SkeletonLoader width="90%" height={16} borderRadius={4} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <SkeletonLoader width="50%" height={16} borderRadius={4} />
            <SkeletonLoader width={24} height={24} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title={dealer?.businessName || 'Store Profile'}
        backgroundColor="#0d8320"
        titleColor="#fff"
        iconColor="#fff"
        rightComponent={
          dealer ? (
            <TouchableOpacity onPress={handleShare}>
              <Icon name="share-social" size={RFValue(20)} color="#fff" />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: bannerUri }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {loading && !dealer ? (
            <View style={{ gap: 8 }}>
              <SkeletonLoader width="50%" height={16} borderRadius={4} />
              <SkeletonLoader width="80%" height={24} borderRadius={4} />
              <SkeletonLoader width="95%" height={14} borderRadius={4} />
            </View>
          ) : dealer ? (
            <>
              <View style={styles.storeBadgeRow}>
                <View style={styles.storeTypeTag}>
                  <CustomText style={styles.storeTypeText}>{dealer.dealerType || 'Dealer'}</CustomText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: storeOpen ? '#10b981' : '#ef4444' },
                  ]}
                >
                  <CustomText style={styles.statusText}>
                    {storeOpen ? 'OPEN' : 'CLOSED'}
                  </CustomText>
                </View>
              </View>

              <CustomText style={styles.businessName}>{dealer.businessName || dealer.name}</CustomText>

              {dealer.address && (
                <View style={styles.addressRow}>
                  <Icon name="location-outline" size={RFValue(14)} color={colors.textSecondary} style={{ marginTop: 2 }} />
                  <CustomText style={styles.addressText}>{dealer.address}</CustomText>
                </View>
              )}

              {inventoryStats.length > 0 && (
                <CustomText style={styles.inventoryStats}>{inventoryStats}</CustomText>
              )}
            </>
          ) : (
            <View style={styles.profileErrorRow}>
              <Icon name="storefront-outline" size={RFValue(28)} color={colors.textSecondary} />
              <CustomText style={styles.profileErrorText}>
                Unable to load store details. Please try again.
              </CustomText>
              <TouchableOpacity style={styles.retryButton} onPress={fetchDealerDetails}>
                <CustomText style={styles.retryButtonText}>Retry</CustomText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={RFValue(16)} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder={`Search in store...`}
            placeholderTextColor={colors.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={RFValue(16)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {(['products', 'vehicles', 'services'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => {
                setActiveTab(tab);
                setSearchQuery('');
              }}
            >
              <CustomText
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.secondary : colors.textSecondary },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </CustomText>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'products' && (
          productsLoading ? (
            renderSkeletons()
          ) : filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gridList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => (navigate as any)('ProductDetail', { productId: item.id })}
                  style={styles.productCard}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=300' }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <CustomText style={styles.productBrand} numberOfLines={1}>
                      {item.brand}
                    </CustomText>
                    <CustomText style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </CustomText>
                    <View style={styles.productFooter}>
                      <CustomText style={styles.productPrice}>₹{item.price.toLocaleString()}</CustomText>
                      {storeOpen && item.stock > 0 && (
                        <TouchableOpacity
                          style={styles.addToCartBtn}
                          onPress={() => handleAddToCart(item)}
                        >
                          <Icon name="cart-outline" size={RFValue(14)} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="cube-outline" size={RFValue(40)} color={colors.disabled} />
              <CustomText style={styles.emptyTitle}>No Products Found</CustomText>
              <CustomText style={styles.emptyText}>
                This seller has not listed any products or none match your search.
              </CustomText>
            </View>
          )
        )}

        {activeTab === 'vehicles' && (
          vehiclesLoading ? (
            <View style={{ paddingHorizontal: 16 }}>
              {[1, 2].map((i) => (
                <View key={i} style={{ height: 240, marginBottom: 16 }}>
                  <SkeletonLoader width="100%" height={240} borderRadius={12} />
                </View>
              ))}
            </View>
          ) : filteredVehicles.length > 0 ? (
            <View style={{ paddingHorizontal: 16 }}>
              {filteredVehicles.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => (navigate as any)('VehicleDetail', { vehicleId: item.id })}
                  style={styles.vehicleCard}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=500' }}
                    style={styles.vehicleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.vehicleInfo}>
                    <View style={styles.vehicleHeader}>
                      <CustomText style={styles.vehicleModel}>
                        {item.brand} {item.vehicleModel}
                      </CustomText>
                      <CustomText style={styles.vehicleYear}>{item.year}</CustomText>
                    </View>
                    
                    <View style={styles.vehicleSpecs}>
                      {item.fuelType && (
                        <View style={styles.specBadge}>
                          <Icon name="flash-outline" size={RFValue(10)} color={colors.textSecondary} />
                          <CustomText style={styles.specText}>{item.fuelType}</CustomText>
                        </View>
                      )}
                      {item.transmission && (
                        <View style={styles.specBadge}>
                          <Icon name="settings-outline" size={RFValue(10)} color={colors.textSecondary} />
                          <CustomText style={styles.specText}>{item.transmission}</CustomText>
                        </View>
                      )}
                      {item.condition && (
                        <View style={styles.specBadge}>
                          <Icon name="ribbon-outline" size={RFValue(10)} color={colors.textSecondary} />
                          <CustomText style={styles.specText}>{item.condition}</CustomText>
                        </View>
                      )}
                    </View>

                    <View style={styles.vehicleFooter}>
                      <CustomText style={styles.vehiclePrice}>₹{item.price.toLocaleString()}</CustomText>
                      <View
                        style={[
                          styles.vehicleConditionTag,
                          {
                            backgroundColor:
                              item.availability === 'available'
                                ? '#10b98120'
                                : item.availability === 'sold'
                                ? '#ef444420'
                                : '#f59e0b20',
                          },
                        ]}
                      >
                        <CustomText
                          style={{
                            fontSize: RFValue(11),
                            ...fontStyle(Fonts.Bold),
                            color:
                              item.availability === 'available'
                                ? '#10b981'
                                : item.availability === 'sold'
                                ? '#ef4444'
                                : '#f59e0b',
                          }}
                        >
                          {item.availability.toUpperCase()}
                        </CustomText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="car-outline" size={RFValue(40)} color={colors.disabled} />
              <CustomText style={styles.emptyTitle}>No Vehicles Available</CustomText>
              <CustomText style={styles.emptyText}>
                There are no vehicles listed for this showroom currently.
              </CustomText>
            </View>
          )
        )}

        {activeTab === 'services' && (
          servicesLoading ? (
            <View style={{ paddingHorizontal: 16 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ height: 110, marginBottom: 12 }}>
                  <SkeletonLoader width="100%" height={110} borderRadius={12} />
                </View>
              ))}
            </View>
          ) : filteredServices.length > 0 ? (
            <View style={{ paddingHorizontal: 16 }}>
              {filteredServices.map((item) => (
                <View key={item.id} style={styles.serviceCard}>
                  {item.images?.[0] && (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.serviceImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.serviceInfo}>
                    <CustomText style={styles.serviceName} numberOfLines={1}>
                      {item.name}
                    </CustomText>
                    
                    <View style={styles.serviceDetails}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="time-outline" size={RFValue(12)} color={colors.textSecondary} />
                        <CustomText style={styles.serviceDetailText}>{item.durationMinutes} mins</CustomText>
                      </View>
                      {item.homeService && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Icon name="home-outline" size={RFValue(12)} color={colors.textSecondary} />
                          <CustomText style={styles.serviceDetailText}>Home service</CustomText>
                        </View>
                      )}
                    </View>

                    <View style={styles.serviceFooter}>
                      <CustomText style={styles.servicePrice}>₹{item.price.toLocaleString()}</CustomText>
                      <TouchableOpacity
                        style={styles.viewServiceBtn}
                        onPress={() => (navigate as any)('ServiceDetail', { serviceId: item.id })}
                      >
                        <CustomText style={styles.viewServiceText}>Book Now</CustomText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="build-outline" size={RFValue(40)} color={colors.disabled} />
              <CustomText style={styles.emptyTitle}>No Services Offered</CustomText>
              <CustomText style={styles.emptyText}>
                This showroom or workshop does not list any services at the moment.
              </CustomText>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

export default DealerStoreScreen;
