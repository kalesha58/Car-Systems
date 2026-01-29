import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Pressable,
  Alert,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getDealerProducts, getDealerVehicles, getDealerServices, getBusinessRegistrationByUserId, IBusinessRegistration} from '@service/dealerService';
import {useAuthStore} from '@state/authStore';
import {IProduct} from '../../types/product/IProduct';
import {IDealerVehicle} from '../../types/vehicle/IVehicle';
import {IService} from '../../types/service/IService';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenWidth, screenHeight} from '@utils/Scaling';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '@components/common/EmptyState/EmptyState';
import {formatCurrency} from '@utils/analytics';
import ImagePreviewModal from '@components/common/ImagePreviewModal/ImagePreviewModal';
import InventoryItemSkeleton from './InventoryItemSkeleton';

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const {colors: theme} = useTheme();
  const {t} = useTranslation();
  const {user} = useAuthStore();
  const [activeTab, setActiveTab] = useState<'products' | 'vehicles' | 'services'>('products');
  const [products, setProducts] = useState<IProduct[]>([]);
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [businessRegistration, setBusinessRegistration] = useState<IBusinessRegistration | null>(null);
  const [loadingRegistration, setLoadingRegistration] = useState(true);
  const pagerRef = useRef<ScrollView>(null);

  // Filter tabs based on business type
  const tabOrder = useMemo(() => {
    const businessType = businessRegistration?.type;
    // Automobile Showroom: Show products, vehicles, and car automobile services
    if (businessType === 'Automobile Showroom') {
      return ['products', 'vehicles', 'services'] as const;
    }
    // Bike Dealer: Show products, vehicles, and bike automobile services
    if (businessType === 'Bike Dealer') {
      return ['products', 'vehicles', 'services'] as const;
    }
    // Vehicle Wash Station: Show car wash services only
    if (businessType === 'Vehicle Wash Station') {
      return ['services'] as const;
    }
    // Detailing Center: Show car detailing services only
    if (businessType === 'Detailing Center') {
      return ['services'] as const;
    }
    // Spare Parts Dealer: Show products only
    if (businessType === 'Spare Parts Dealer') {
      return ['products'] as const;
    }
    // Mechanic Workshop: Show services only
    if (businessType === 'Mechanic Workshop') {
      return ['services'] as const;
    }
    // Default: Show all tabs
    return ['products', 'vehicles', 'services'] as const;
  }, [businessRegistration?.type]);
  
  const activeIndex = useMemo(() => tabOrder.indexOf(activeTab), [activeTab, tabOrder]);

  // Set default active tab based on available tabs
  useEffect(() => {
    if (tabOrder.length > 0 && !tabOrder.includes(activeTab)) {
      setActiveTab(tabOrder[0]);
    }
  }, [tabOrder]);

  const isApproved = businessRegistration?.status === 'approved';
  const canAddItems = isApproved;

  const handleAddPress = () => {
    if (!canAddItems) {
      Alert.alert(
        t('dealer.registrationRequired') || 'Registration Required',
        t('dealer.completeRegistrationToAdd') || 'Please complete business registration to add products to inventory',
        [
          {
            text: t('dealer.cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: t('dealer.goToRegistration') || 'Go to Registration',
            onPress: () => {
              (navigation as any).navigate('BusinessRegistration');
            },
          },
        ],
      );
      return;
    }

    if (activeTab === 'products') {
      (navigation as any).navigate('AddEditProduct');
    } else if (activeTab === 'vehicles') {
      (navigation as any).navigate('AddEditVehicle');
    } else if (activeTab === 'services') {
      (navigation as any).navigate('AddEditService');
    }
  };

  const handleItemPress = (item: IProduct | IDealerVehicle | IService) => {
    if (activeTab === 'products') {
      (navigation as any).navigate('AddEditProduct', {product: item as IProduct});
    } else if (activeTab === 'vehicles') {
      (navigation as any).navigate('AddEditVehicle', {vehicle: item as IDealerVehicle});
    } else if (activeTab === 'services') {
      (navigation as any).navigate('AddEditService', {service: item as IService});
    }
  };

  const handleToggleServiceStatus = async (serviceId: string, e: any) => {
    e.stopPropagation();
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;
      
      // Toggle the service status locally
      const updatedServices = services.map(s =>
        s.id === serviceId ? {...s, isActive: !s.isActive} : s
      );
      setServices(updatedServices);
      
      // TODO: Call API to update service status on backend
      // await updateServiceStatus(serviceId, !service.isActive);
    } catch (error) {
      // Revert on error
      fetchData();
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const businessType = businessRegistration?.type;
      
      // Build service filters based on business type
      const serviceFilters: any = { limit: 1000 };
      
      if (businessType === 'Automobile Showroom') {
        // Show car automobile services
        serviceFilters.serviceType = 'car_automobile';
        serviceFilters.vehicleType = 'Car';
      } else if (businessType === 'Bike Dealer') {
        // Show bike automobile services
        serviceFilters.serviceType = 'bike_automobile';
        serviceFilters.vehicleType = 'Bike';
      } else if (businessType === 'Vehicle Wash Station') {
        // Show car wash services
        serviceFilters.serviceType = 'car_wash';
      } else if (businessType === 'Detailing Center') {
        // Show car detailing services
        serviceFilters.serviceType = 'car_detailing';
      }
      
      const [productsData, vehiclesData, servicesData] = await Promise.all([
        getDealerProducts({limit: 1000}),
        getDealerVehicles({limit: 1000}),
        getDealerServices(serviceFilters),
      ]);
      setProducts(productsData.Response?.products || []);
      setVehicles(vehiclesData.Response?.vehicles || []);
      setServices(servicesData.Response?.services || []);
    } catch (error) {
      // Error handling - no fallback per rules
    } finally {
      setLoading(false);
    }
  }, [businessRegistration?.type]);

  const fetchBusinessRegistration = useCallback(async () => {
    if (!user?.id) {
      setLoadingRegistration(false);
      return;
    }
    try {
      setLoadingRegistration(true);
      const registration = await getBusinessRegistrationByUserId(user.id);
      setBusinessRegistration(registration);
    } catch (error) {
      console.error('Error fetching business registration:', error);
      setBusinessRegistration(null);
    } finally {
      setLoadingRegistration(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
    fetchBusinessRegistration();
  }, [fetchData, fetchBusinessRegistration]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchBusinessRegistration();
    }, [fetchData, fetchBusinessRegistration]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const scrollToTab = useCallback(
    (tab: (typeof tabOrder)[number]) => {
      const index = tabOrder.indexOf(tab);
      if (index < 0) return;
      setActiveTab(tab);
      pagerRef.current?.scrollTo({x: index * screenWidth, y: 0, animated: true});
    },
    [tabOrder],
  );

  const onPagerMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / screenWidth);
      const nextTab = tabOrder[index] ?? 'products';
      if (nextTab !== activeTab) setActiveTab(nextTab);
    },
    [activeTab, tabOrder],
  );

  const handleImagePress = (images: string[]) => {
    if (images && images.length > 0) {
      setPreviewImages(images);
      setIsImagePreviewVisible(true);
    }
  };

  const renderProductItem = ({item}: {item: IProduct}) => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const discountPercent = hasDiscount
      ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={[styles.productCard, {backgroundColor: theme.cardBackground, borderColor: theme.border}]}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}>
        {/* Left Side - Product Info */}
        <View style={styles.productInfo}>
          {/* Header */}
          <View style={styles.productHeader}>
            <CustomText variant="h6" fontFamily={Fonts.SemiBold} numberOfLines={1} style={styles.productName}>
              {item.name}
            </CustomText>
            <CustomText variant="h9" style={[styles.brandText, {color: theme.textSecondary}]} numberOfLines={1}>
              {item.brand}
            </CustomText>
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <CustomText variant="h6" fontFamily={Fonts.Bold} style={{color: theme.secondary}}>
              {formatCurrency(item.price)}
            </CustomText>
            {hasDiscount && (
              <>
                <CustomText variant="h9" style={[styles.originalPrice, {color: theme.disabled}]}>
                  {formatCurrency(item.originalPrice!)}
                </CustomText>
                <View style={styles.discountBadge}>
                  <CustomText style={styles.discountText}>-{discountPercent}%</CustomText>
                </View>
              </>
            )}
          </View>

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="cube-outline" size={RFValue(12)} color={theme.textSecondary} />
              <CustomText variant="h9" style={[styles.metaText, {color: theme.textSecondary}]}>
                {item.stock}
              </CustomText>
            </View>
            {item.category && (
              <View style={styles.metaItem}>
                <Icon name="pricetag-outline" size={RFValue(12)} color={theme.textSecondary} />
                <CustomText variant="h9" style={[styles.metaText, {color: theme.textSecondary}]} numberOfLines={1}>
                  {item.category}
                </CustomText>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: item.status === 'active' ? '#10b98115' : '#f59e0b15'},
              ]}>
              <CustomText
                variant="h9"
                fontFamily={Fonts.Medium}
                style={[styles.statusText, {color: item.status === 'active' ? '#10b981' : '#f59e0b'}]}>
                {item.status}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Right Side - Image Thumbnail */}
        <Pressable 
          style={styles.productImageContainer}
          onPress={(e) => {
            e.stopPropagation();
            handleImagePress(item.images || []);
          }}>
          {firstImage ? (
            <Image source={{uri: firstImage}} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImagePlaceholder, {backgroundColor: theme.border}]}>
              <Icon name="image-outline" size={RFValue(24)} color={theme.textSecondary} />
            </View>
          )}
        </Pressable>
      </TouchableOpacity>
    );
  };

  const renderVehicleItem = ({item}: {item: IDealerVehicle}) => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

    return (
      <TouchableOpacity
        style={[styles.productCard, {backgroundColor: theme.cardBackground, borderColor: theme.border}]}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}>
        {/* Left Side - Vehicle Info */}
        <View style={styles.productInfo}>
          {/* Header */}
          <View style={styles.productHeader}>
            <CustomText variant="h6" fontFamily={Fonts.SemiBold} numberOfLines={1} style={styles.productName}>
              {item.brand} {item.vehicleModel}
            </CustomText>
            <CustomText variant="h9" style={[styles.brandText, {color: theme.textSecondary}]} numberOfLines={1}>
              {item.year} • {item.vehicleType}
            </CustomText>
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <CustomText variant="h6" fontFamily={Fonts.Bold} style={{color: theme.secondary}}>
              {formatCurrency(item.price)}
            </CustomText>
          </View>

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon
                name={item.availability === 'available' ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={RFValue(12)}
                color={item.availability === 'available' ? '#10b981' : '#ef4444'}
              />
              <CustomText variant="h9" style={[styles.metaText, {color: theme.textSecondary}]}>
                {item.availability.charAt(0).toUpperCase() + item.availability.slice(1)}
              </CustomText>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.availability === 'available' ? '#10b98115' : item.availability === 'sold' ? '#ef444415' : '#f59e0b15',
                },
              ]}>
              <CustomText
                variant="h9"
                fontFamily={Fonts.Medium}
                style={[
                  styles.statusText,
                  {
                    color:
                      item.availability === 'available' ? '#10b981' : item.availability === 'sold' ? '#ef4444' : '#f59e0b',
                  },
                ]}>
                {item.availability}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Right Side - Image Thumbnail */}
        <Pressable 
          style={styles.productImageContainer}
          onPress={(e) => {
            e.stopPropagation();
            handleImagePress(item.images || []);
          }}>
          {firstImage ? (
            <Image source={{uri: firstImage}} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImagePlaceholder, {backgroundColor: theme.border}]}>
              <Icon name="car-outline" size={RFValue(24)} color={theme.textSecondary} />
            </View>
          )}
        </Pressable>
      </TouchableOpacity>
    );
  };

  const renderServiceItem = ({item}: {item: IService}) => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

    return (
      <TouchableOpacity
        style={[styles.productCard, {backgroundColor: theme.cardBackground, borderColor: theme.border}]}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}>
        {/* Left Side - Service Info */}
        <View style={styles.productInfo}>
          {/* Header */}
          <View style={styles.productHeader}>
            <CustomText variant="h6" fontFamily={Fonts.SemiBold} numberOfLines={1} style={styles.productName}>
              {item.name}
            </CustomText>
            {item.category && (
              <CustomText variant="h9" style={[styles.brandText, {color: theme.textSecondary}]} numberOfLines={1}>
                {item.category}
              </CustomText>
            )}
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <CustomText variant="h6" fontFamily={Fonts.Bold} style={{color: theme.secondary}}>
              {formatCurrency(item.price)}
            </CustomText>
          </View>

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={RFValue(12)} color={theme.textSecondary} />
              <CustomText variant="h9" style={[styles.metaText, {color: theme.textSecondary}]}>
                {item.durationMinutes} {item.durationMinutes === 1 ? t('dealer.minute') : t('dealer.minutes')}
              </CustomText>
            </View>
            {item.homeService && (
              <View style={styles.metaItem}>
                <Icon name="home-outline" size={RFValue(12)} color={theme.textSecondary} />
                <CustomText variant="h9" style={[styles.metaText, {color: theme.textSecondary}]}>
                  {t('dealer.homeService')}
                </CustomText>
              </View>
            )}
            <TouchableOpacity
              onPress={(e) => handleToggleServiceStatus(item.id, e)}
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.isActive !== false ? theme.success + '15' : theme.error + '15',
                },
              ]}>
              <CustomText
                variant="h9"
                fontFamily={Fonts.Medium}
                style={[
                  styles.statusText,
                  {color: item.isActive !== false ? theme.success : theme.error},
                ]}>
                {item.isActive !== false ? t('dealer.active') : t('dealer.inactive')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Side - Image Thumbnail */}
        <Pressable 
          style={styles.productImageContainer}
          onPress={(e) => {
            e.stopPropagation();
            handleImagePress(item.images || []);
          }}>
          {firstImage ? (
            <Image source={{uri: firstImage}} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImagePlaceholder, {backgroundColor: theme.border}]}>
              <Icon name="construct-outline" size={RFValue(24)} color={theme.textSecondary} />
            </View>
          )}
        </Pressable>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'products') {
      return (
        <EmptyState
          title={t('dealer.noProducts')}
          message={t('dealer.noProductsMessage')}
          icon="cube-outline"
        />
      );
    }
    if (activeTab === 'vehicles') {
      return (
        <EmptyState
          title={t('dealer.noVehicles')}
          message={t('dealer.noVehiclesMessage')}
          icon="car-outline"
        />
      );
    }
    return (
      <EmptyState
        title={t('dealer.noServices')}
        message={t('dealer.noServicesMessage')}
        icon="construct-outline"
      />
    );
  };

  const renderSkeletonList = () => {
    const skeletonData = Array.from({length: 5}, (_, i) => ({id: `skeleton-${i}`}));
    return (
      <FlatList
        data={skeletonData}
        renderItem={() => <InventoryItemSkeleton type={activeTab === 'products' ? 'product' : activeTab === 'vehicles' ? 'vehicle' : 'service'} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderBanner = () => {
    if (loadingRegistration || isApproved) {
      return null;
    }

    let bannerMessage = '';
    let bannerColor = '#f59e0b';
    let bannerIcon = 'information-circle-outline';
    let showButton = false;

    if (!businessRegistration) {
      bannerMessage = t('dealer.completeRegistrationToAdd') || 'Complete business registration to add products to inventory';
      bannerColor = '#3b82f6';
      bannerIcon = 'business-outline';
      showButton = true;
    } else if (businessRegistration.status === 'pending') {
      bannerMessage = t('dealer.pendingApprovalMessage') || "Your dealership request is pending approval. You'll be able to add products once approved.";
      bannerColor = '#f59e0b';
      bannerIcon = 'time-outline';
    } else if (businessRegistration.status === 'rejected') {
      bannerMessage = t('dealer.rejectedMessage') || 'Your dealership request was rejected. Please update your registration to reapply.';
      bannerColor = '#ef4444';
      bannerIcon = 'close-circle-outline';
      showButton = true;
    }

    if (!bannerMessage) {
      return null;
    }

    return (
      <View style={[styles.banner, {backgroundColor: bannerColor + '20', borderLeftColor: bannerColor}]}>
        <Icon name={bannerIcon} size={RFValue(20)} color={bannerColor} />
        <View style={styles.bannerContent}>
          <CustomText style={[styles.bannerText, {color: bannerColor}]} numberOfLines={2}>
            {bannerMessage}
          </CustomText>
          {showButton && (
            <TouchableOpacity
              style={[styles.bannerButton, {backgroundColor: bannerColor}]}
              onPress={() => {
                (navigation as any).navigate('BusinessRegistration');
              }}
              activeOpacity={0.8}>
              <CustomText style={styles.bannerButtonText}>
                {!businessRegistration
                  ? t('dealer.completeRegistration') || 'Complete Registration'
                  : t('dealer.updateRegistration') || 'Update Registration'}
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <CustomHeader title={t('dealer.inventory')} />
      {renderBanner()}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'products' && {backgroundColor: theme.success + '20', borderBottomColor: theme.success},
          ]}
          onPress={() => scrollToTab('products')}>
          <Icon
            name="cube-outline"
            size={RFValue(16)}
            color={activeTab === 'products' ? theme.success : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{color: activeTab === 'products' ? theme.success : theme.textSecondary}}
            numberOfLines={1}>
            {t('dealer.products')}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'vehicles' && {backgroundColor: theme.success + '20', borderBottomColor: theme.success},
          ]}
          onPress={() => scrollToTab('vehicles')}>
          <Icon
            name="car-outline"
            size={RFValue(16)}
            color={activeTab === 'vehicles' ? theme.success : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{color: activeTab === 'vehicles' ? theme.success : theme.textSecondary}}
            numberOfLines={1}>
            {t('dealer.vehicles')}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'services' && {backgroundColor: theme.success + '20', borderBottomColor: theme.success},
          ]}
          onPress={() => scrollToTab('services')}>
          <Icon
            name="construct-outline"
            size={RFValue(16)}
            color={activeTab === 'services' ? theme.success : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{color: activeTab === 'services' ? theme.success : theme.textSecondary}}
            numberOfLines={1}>
            {t('dealer.services')}
          </CustomText>
        </TouchableOpacity>
      </View>
      {loading ? (
        renderSkeletonList()
      ) : (
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPagerMomentumEnd}
          contentOffset={{x: activeIndex * screenWidth, y: 0}}
          keyboardShouldPersistTaps="handled">
          <View style={{width: screenWidth}}>
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={activeTab === 'products' ? renderEmptyState : null}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondary} colors={[theme.secondary]} />
              }
            />
          </View>
          <View style={{width: screenWidth}}>
            <FlatList
              data={vehicles}
              renderItem={renderVehicleItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={activeTab === 'vehicles' ? renderEmptyState : null}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondary} colors={[theme.secondary]} />
              }
            />
          </View>
          <View style={{width: screenWidth}}>
            <FlatList
              data={services}
              renderItem={renderServiceItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={activeTab === 'services' ? renderEmptyState : null}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondary} colors={[theme.secondary]} />
              }
            />
          </View>
        </ScrollView>
      )}
      <TouchableOpacity
        style={[styles.fab, !canAddItems && styles.fabDisabled]}
        onPress={handleAddPress}
        activeOpacity={canAddItems ? 0.8 : 1}
        disabled={!canAddItems}>
        <Icon name="add" size={RFValue(24)} color={canAddItems ? '#fff' : theme.disabled} />
      </TouchableOpacity>

      <ImagePreviewModal
        visible={isImagePreviewVisible}
        images={previewImages}
        onClose={() => setIsImagePreviewVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  listContent: {
    padding: 12,
    paddingTop: 0,
  },
  itemCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
  },
  productCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  productHeader: {
    marginBottom: 0,
  },
  productName: {
    marginBottom: 2,
    fontSize: RFValue(14),
  },
  brandText: {
    fontSize: RFValue(10),
    opacity: 0.7,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontSize: RFValue(10),
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: RFValue(9),
    fontFamily: Fonts.Bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: RFValue(10),
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: RFValue(9),
    textTransform: 'capitalize',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: screenWidth * 0.04,
    bottom: screenHeight * 0.1,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0.1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: 12,
  },
  bannerContent: {
    flex: 1,
    gap: 8,
  },
  bannerText: {
    fontSize: RFValue(12),
    fontFamily: Fonts.Medium,
    lineHeight: RFValue(16),
  },
  bannerButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontSize: RFValue(11),
    fontFamily: Fonts.SemiBold,
    color: '#fff',
  },
});

export default InventoryScreen;

