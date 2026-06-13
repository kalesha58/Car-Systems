import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
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
import CustomActionBottomSheet, { IActionSheetItem } from '@components/ui/CustomActionBottomSheet';
import { getDealerById, parseDealerResponse } from '@service/dealerService';
import { getProducts } from '@service/productService';
import { getDealerVehicles } from '@service/vehicleService';
import { getServicesByDealerId } from '@service/serviceService';
import { shareStore, getStoreShareUrl } from '@utils/shareUtils';
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

const tint = (hex: string, alpha: string) => `${hex}${alpha}`;

const getVehicleAvailabilityStyle = (
  availability: string,
  colors: { success: string; error: string; warning: string },
) => {
  if (availability === 'available') {
    return { bg: tint(colors.success, '1F'), text: colors.success };
  }
  if (availability === 'sold') {
    return { bg: tint(colors.error, '1F'), text: colors.error };
  }
  return { bg: tint(colors.warning, '1F'), text: colors.warning };
};

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
  const { colors } = useTheme();
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
  const [productsLoading, setProductsLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTestDriveOnly, setVehicleTestDriveOnly] = useState(false);
  const [storeOpen, setStoreOpen] = useState(
    dealerSnapshot?.storeOpen !== undefined ? dealerSnapshot.storeOpen : true,
  );
  const [showStoreActions, setShowStoreActions] = useState(false);

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
    const stats: { icon: string; label: string }[] = [];
    if (products.length > 0) {
      stats.push({
        icon: 'cube-outline',
        label: `${products.length} Product${products.length !== 1 ? 's' : ''}`,
      });
    }
    if (vehicles.length > 0) {
      stats.push({
        icon: 'car-outline',
        label: `${vehicles.length} Vehicle${vehicles.length !== 1 ? 's' : ''}`,
      });
    }
    if (services.length > 0) {
      stats.push({
        icon: 'construct-outline',
        label: `${services.length} Service${services.length !== 1 ? 's' : ''}`,
      });
    }
    return stats;
  }, [products.length, vehicles.length, services.length]);

  const profileAvatarUri = dealer?.shopPhotos?.[0]?.url ?? dealerSnapshot?.shopPhotos?.[0]?.url;

  const fetchDealerDetails = useCallback(async () => {
    const profileFetchId = dealerSnapshot?.businessRegistrationId ?? dealerId;
    try {
      setLoading(true);
      const response = await getDealerById(profileFetchId);
      const dealerData = parseDealerResponse(response);
      if (dealerData) {
        setDealer(dealerData);
        setStoreOpen(dealerData.storeOpen !== undefined ? dealerData.storeOpen : true);
      } else if (!dealerSnapshot) {
        setDealer(null);
      }
    } catch (error) {
      console.error('Error fetching dealer:', error);
      if (!dealerSnapshot) {
        setDealer(null);
        showError('Failed to load dealer information');
      }
    } finally {
      setLoading(false);
    }
  }, [dealerId, dealerSnapshot, showError]);

  // Fetch Dealer details
  useEffect(() => {
    if (dealerId) {
      fetchDealerDetails();
    }
  }, [dealerId, fetchDealerDetails]);

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
  const handleShareStoreLink = useCallback(async () => {
    if (!dealer) return;
    try {
      const shared = await shareStore(dealer.businessName || dealer.name, catalogDealerId);
      if (shared) {
        showSuccess('Store link shared successfully');
      }
    } catch (error) {
      showError('Failed to share store link');
    }
  }, [dealer, catalogDealerId, showSuccess, showError]);

  const storeActionItems = useMemo<IActionSheetItem[]>(() => {
    if (!dealer) return [];
    return [
      {
        id: 'share-store',
        label: 'Share Store Link',
        description: getStoreShareUrl(catalogDealerId),
        icon: 'share-social-outline',
        onPress: handleShareStoreLink,
      },
    ];
  }, [dealer, catalogDealerId, handleShareStoreLink]);

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
    return vehicles.filter((v) => {
      const matchesSearch =
        v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTestDrive = !vehicleTestDriveOnly || v.allowTestDrive === true;
      return matchesSearch && matchesTestDrive;
    });
  }, [vehicles, searchQuery, vehicleTestDriveOnly]);

  const filteredServices = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    return list.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  const tabCounts = useMemo(
    () => ({
      products: products.length,
      vehicles: vehicles.length,
      services: Array.isArray(services) ? services.length : 0,
    }),
    [products.length, vehicles.length, services.length],
  );

  const statusChipStyle = useMemo(
    () =>
      storeOpen
        ? { bg: tint(colors.success, '1F'), dot: colors.success, text: colors.success }
        : { bg: tint(colors.error, '1F'), dot: colors.error, text: colors.error },
    [storeOpen, colors.success, colors.error],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        bannerContainer: {
          width: '100%',
          height: 200,
          backgroundColor: colors.backgroundSecondary,
          position: 'relative',
        },
        bannerImage: {
          width: '100%',
          height: '100%',
        },
        bannerGradient: {
          ...StyleSheet.absoluteFillObject,
        },
        profileCard: {
          backgroundColor: colors.cardBackground,
          marginHorizontal: 16,
          marginTop: -56,
          borderRadius: 16,
          padding: 18,
          paddingTop: 0,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          overflow: 'visible',
        },
        profileAvatarWrap: {
          alignSelf: 'flex-start',
          marginTop: -36,
          marginBottom: 12,
        },
        profileAvatar: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 3,
          borderColor: colors.cardBackground,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        profileAvatarImage: {
          width: '100%',
          height: '100%',
        },
        profileHeaderContent: {
          gap: 6,
        },
        profileLabel: {
          color: colors.textSecondary,
          fontSize: RFValue(10),
          ...fontStyle(Fonts.Medium),
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        storeBadgeRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        },
        storeTypeTag: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.backgroundSecondary,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
        },
        storeTypeText: {
          color: colors.textSecondary,
          ...fontStyle(Fonts.Medium),
          fontSize: RFValue(10),
        },
        statusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
        },
        statusDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        statusText: {
          ...fontStyle(Fonts.SemiBold),
          fontSize: RFValue(10),
          letterSpacing: 0.4,
        },
        businessName: {
          color: colors.text,
          fontSize: RFValue(20),
          ...fontStyle(Fonts.Bold),
          lineHeight: RFValue(26),
        },
        addressCard: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        addressText: {
          color: colors.textSecondary,
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Regular),
          flex: 1,
          lineHeight: RFValue(18),
        },
        inventoryRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 12,
        },
        inventoryChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        inventoryChipText: {
          color: colors.text,
          fontSize: RFValue(10),
          ...fontStyle(Fonts.Medium),
        },
        profileActionsRow: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 14,
        },
        profileActionBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
        },
        profileActionText: {
          color: colors.text,
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Medium),
        },
        closedBanner: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 14,
          borderRadius: 12,
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        closedBannerTitle: {
          color: colors.text,
          fontSize: RFValue(13),
          ...fontStyle(Fonts.SemiBold),
          marginBottom: 2,
        },
        closedBannerText: {
          color: colors.textSecondary,
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Regular),
          lineHeight: RFValue(16),
          flex: 1,
        },
        catalogSection: {
          marginHorizontal: 16,
          marginTop: 4,
          marginBottom: 10,
        },
        catalogSectionTitle: {
          color: colors.text,
          fontSize: RFValue(15),
          ...fontStyle(Fonts.SemiBold),
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
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        retryButtonText: {
          color: colors.text,
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Medium),
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundSecondary,
          marginHorizontal: 16,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 12 : 8,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: colors.border,
        },
        searchIcon: {
          marginRight: 10,
        },
        searchInput: {
          flex: 1,
          color: colors.text,
          ...fontStyle(Fonts.Medium),
          fontSize: RFValue(13),
        },
        tabsWrapper: {
          marginHorizontal: 16,
          marginBottom: 16,
          padding: 4,
          borderRadius: 12,
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        tabsContainer: {
          flexDirection: 'row',
        },
        tabButton: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          borderRadius: 8,
          position: 'relative',
        },
        tabButtonActive: {
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
        },
        tabActiveIndicator: {
          position: 'absolute',
          bottom: 4,
          width: '40%',
          height: 2,
          borderRadius: 1,
          backgroundColor: colors.secondary,
        },
        tabText: {
          ...fontStyle(Fonts.Medium),
          fontSize: RFValue(11),
        },
        tabCountBadge: {
          marginTop: 2,
          fontSize: RFValue(9),
          ...fontStyle(Fonts.Regular),
        },
        gridList: {
          paddingHorizontal: 10,
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
          height: 130,
          backgroundColor: colors.backgroundSecondary,
        },
        productInfo: {
          padding: 12,
        },
        productBrand: {
          fontSize: RFValue(9),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
          textTransform: 'uppercase',
          marginBottom: 4,
          letterSpacing: 0.4,
        },
        productName: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
          minHeight: 34,
          lineHeight: RFValue(17),
        },
        productFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 10,
        },
        productPrice: {
          fontSize: RFValue(14),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
        },
        addToCartBtn: {
          width: 34,
          height: 34,
          borderRadius: 17,
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
        testDriveChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          alignSelf: 'flex-start',
        },
        testDriveChipText: {
          fontSize: RFValue(9),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
        },
        vehicleFilterRow: {
          flexDirection: 'row',
          gap: 8,
          marginHorizontal: 16,
          marginBottom: 12,
        },
        vehicleFilterChip: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.backgroundSecondary,
        },
        vehicleFilterChipActive: {
          backgroundColor: colors.cardBackground,
          borderColor: colors.secondary,
        },
        vehicleFilterChipText: {
          fontSize: RFValue(10),
          ...fontStyle(Fonts.Medium),
          color: colors.textSecondary,
        },
        vehicleFilterChipTextActive: {
          color: colors.text,
        },
        serviceCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 14,
          padding: 14,
          flexDirection: 'row',
          gap: 12,
        },
        serviceImage: {
          width: 84,
          height: 84,
          borderRadius: 12,
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
          color: colors.text,
        },
        viewServiceBtn: {
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 10,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
        },
        viewServiceText: {
          color: colors.text,
          ...fontStyle(Fonts.Medium),
          fontSize: RFValue(11),
        },
        emptyContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 16,
          paddingVertical: 48,
          paddingHorizontal: 28,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
        },
        emptyIconWrap: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.backgroundSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 14,
        },
        emptyTitle: {
          fontSize: RFValue(15),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
          marginBottom: 8,
          textAlign: 'center',
        },
        emptyText: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: RFValue(18),
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
    [colors]
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
        rightComponent={
          dealer ? (
            <TouchableOpacity onPress={() => setShowStoreActions(true)}>
              <Icon name="ellipsis-horizontal" size={RFValue(22)} color={colors.text} />
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
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)']}
            style={styles.bannerGradient}
          />
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
              <View style={styles.profileAvatarWrap}>
                <View style={styles.profileAvatar}>
                  {profileAvatarUri ? (
                    <Image source={{ uri: profileAvatarUri }} style={styles.profileAvatarImage} resizeMode="cover" />
                  ) : (
                    <Icon name="storefront" size={RFValue(30)} color={colors.textSecondary} />
                  )}
                </View>
              </View>

              <View style={styles.profileHeaderContent}>
                <CustomText style={styles.profileLabel}>Seller Store</CustomText>

                <View style={styles.storeBadgeRow}>
                  <View style={styles.storeTypeTag}>
                    <Icon name="business-outline" size={RFValue(11)} color={colors.textSecondary} />
                    <CustomText style={styles.storeTypeText}>{dealer.dealerType || 'Dealer'}</CustomText>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusChipStyle.bg },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: statusChipStyle.dot }]} />
                    <CustomText style={[styles.statusText, { color: statusChipStyle.text }]}>
                      {storeOpen ? 'OPEN' : 'CLOSED'}
                    </CustomText>
                  </View>
                </View>

                <CustomText style={styles.businessName}>{dealer.businessName || dealer.name}</CustomText>
              </View>

              {dealer.address && (
                <View style={styles.addressCard}>
                  <Icon name="location-outline" size={RFValue(16)} color={colors.textSecondary} />
                  <CustomText style={styles.addressText}>{dealer.address}</CustomText>
                </View>
              )}

              {inventoryStats.length > 0 && (
                <View style={styles.inventoryRow}>
                  {inventoryStats.map((stat) => (
                    <View key={stat.label} style={styles.inventoryChip}>
                      <Icon name={stat.icon} size={RFValue(12)} color={colors.textSecondary} />
                      <CustomText style={styles.inventoryChipText}>{stat.label}</CustomText>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.profileActionsRow}>
                <TouchableOpacity
                  style={styles.profileActionBtn}
                  onPress={() => setShowStoreActions(true)}
                  activeOpacity={0.85}>
                  <Icon name="options-outline" size={RFValue(16)} color={colors.text} />
                  <CustomText style={styles.profileActionText}>Store Actions</CustomText>
                </TouchableOpacity>
              </View>
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

        {!storeOpen && dealer && (
          <View style={styles.closedBanner}>
            <Icon name="close-circle" size={RFValue(20)} color={colors.error} />
            <View style={{ flex: 1 }}>
              <CustomText style={styles.closedBannerTitle}>Store Currently Closed</CustomText>
              <CustomText style={styles.closedBannerText}>
                This seller is not accepting orders right now. You can still browse their catalog.
              </CustomText>
            </View>
          </View>
        )}

        <View style={styles.catalogSection}>
          <CustomText style={styles.catalogSectionTitle}>Store Catalog</CustomText>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={RFValue(18)} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search in store..."
            placeholderTextColor={colors.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={RFValue(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsWrapper}>
          <View style={styles.tabsContainer}>
            {(['products', 'vehicles', 'services'] as TabType[]).map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => {
                    setActiveTab(tab);
                    setSearchQuery('');
                  }}
                  activeOpacity={0.85}
                >
                  <CustomText
                    style={[
                      styles.tabText,
                      { color: isActive ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </CustomText>
                  {count > 0 && (
                    <CustomText
                      style={[
                        styles.tabCountBadge,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {count}
                    </CustomText>
                  )}
                  {isActive && <View style={styles.tabActiveIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
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
                          <Icon name="cart-outline" size={RFValue(14)} color={colors.white} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Icon name="cube-outline" size={RFValue(32)} color={colors.textSecondary} />
              </View>
              <CustomText style={styles.emptyTitle}>No Products Found</CustomText>
              <CustomText style={styles.emptyText}>
                This seller has not listed any products or none match your search.
              </CustomText>
            </View>
          )
        )}

        {activeTab === 'vehicles' && (
          <>
            <View style={styles.vehicleFilterRow}>
              <TouchableOpacity
                style={[styles.vehicleFilterChip, !vehicleTestDriveOnly && styles.vehicleFilterChipActive]}
                onPress={() => setVehicleTestDriveOnly(false)}
              >
                <CustomText
                  style={[
                    styles.vehicleFilterChipText,
                    !vehicleTestDriveOnly && styles.vehicleFilterChipTextActive,
                  ]}
                >
                  All vehicles
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.vehicleFilterChip, vehicleTestDriveOnly && styles.vehicleFilterChipActive]}
                onPress={() => setVehicleTestDriveOnly(true)}
              >
                <CustomText
                  style={[
                    styles.vehicleFilterChipText,
                    vehicleTestDriveOnly && styles.vehicleFilterChipTextActive,
                  ]}
                >
                  Test drive available
                </CustomText>
              </TouchableOpacity>
            </View>
          {vehiclesLoading ? (
            <View style={{ paddingHorizontal: 16 }}>
              {[1, 2].map((i) => (
                <View key={i} style={{ height: 240, marginBottom: 16 }}>
                  <SkeletonLoader width="100%" height={240} borderRadius={12} />
                </View>
              ))}
            </View>
          ) : filteredVehicles.length > 0 ? (
            <View style={{ paddingHorizontal: 16 }}>
              {filteredVehicles.map((item) => {
                const availStyle = getVehicleAvailabilityStyle(item.availability, colors);
                return (
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
                      {item.allowTestDrive && (
                        <View style={styles.testDriveChip}>
                          <Icon name="car-sport-outline" size={RFValue(10)} color={colors.textSecondary} />
                          <CustomText style={styles.testDriveChipText}>Test drive</CustomText>
                        </View>
                      )}
                    </View>

                    <View style={styles.vehicleFooter}>
                      <CustomText style={styles.vehiclePrice}>₹{item.price.toLocaleString()}</CustomText>
                      <View
                        style={[
                          styles.vehicleConditionTag,
                          { backgroundColor: availStyle.bg },
                        ]}
                      >
                        <CustomText
                          style={{
                            fontSize: RFValue(10),
                            ...fontStyle(Fonts.SemiBold),
                            color: availStyle.text,
                          }}
                        >
                          {item.availability.toUpperCase()}
                        </CustomText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Icon name="car-outline" size={RFValue(32)} color={colors.textSecondary} />
              </View>
              <CustomText style={styles.emptyTitle}>No Vehicles Available</CustomText>
              <CustomText style={styles.emptyText}>
                There are no vehicles listed for this showroom currently.
              </CustomText>
            </View>
          )}
          </>
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
              <View style={styles.emptyIconWrap}>
                <Icon name="build-outline" size={RFValue(32)} color={colors.textSecondary} />
              </View>
              <CustomText style={styles.emptyTitle}>No Services Offered</CustomText>
              <CustomText style={styles.emptyText}>
                This showroom or workshop does not list any services at the moment.
              </CustomText>
            </View>
          )
        )}
      </ScrollView>

      <CustomActionBottomSheet
        visible={showStoreActions}
        onClose={() => setShowStoreActions(false)}
        title="Store Actions"
        subtitle={dealer?.businessName || dealer?.name}
        actions={storeActionItems}
      />
    </View>
  );
};

export default DealerStoreScreen;
