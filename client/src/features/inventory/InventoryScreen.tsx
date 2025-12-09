import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Pressable} from 'react-native';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getDealerProducts, getDealerVehicles, getDealerServices} from '@service/dealerService';
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

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const {colors: theme} = useTheme();
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState<'products' | 'vehicles' | 'services'>('products');
  const [products, setProducts] = useState<IProduct[]>([]);
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const handleAddPress = () => {
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsData, vehiclesData, servicesData] = await Promise.all([
        getDealerProducts({limit: 1000}),
        getDealerVehicles({limit: 1000}),
        getDealerServices({limit: 1000}),
      ]);
      setProducts(productsData.Response?.products || []);
      setVehicles(vehiclesData.Response?.vehicles || []);
      setServices(servicesData.Response?.services || []);
    } catch (error) {
      // Error handling - no fallback per rules
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
            <View style={[styles.statusBadge, {backgroundColor: '#10b98115'}]}>
              <CustomText variant="h9" fontFamily={Fonts.Medium} style={[styles.statusText, {color: '#10b981'}]}>
                {t('dealer.active')}
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

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: theme.background}]}>
        <CustomHeader title={t('dealer.inventory')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <CustomHeader title={t('dealer.inventory')} />
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'products' && {backgroundColor: theme.secondary + '20', borderBottomColor: theme.secondary},
          ]}
          onPress={() => setActiveTab('products')}>
          <Icon
            name="cube-outline"
            size={RFValue(16)}
            color={activeTab === 'products' ? theme.secondary : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{color: activeTab === 'products' ? theme.secondary : theme.textSecondary}}
            numberOfLines={1}>
            {t('dealer.products')}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'vehicles' && {backgroundColor: theme.secondary + '20', borderBottomColor: theme.secondary},
          ]}
          onPress={() => setActiveTab('vehicles')}>
          <Icon
            name="car-outline"
            size={RFValue(16)}
            color={activeTab === 'vehicles' ? theme.secondary : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{color: activeTab === 'vehicles' ? theme.secondary : theme.textSecondary}}
            numberOfLines={1}>
            {t('dealer.vehicles')}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'services' && {backgroundColor: theme.secondary + '20', borderBottomColor: theme.secondary},
          ]}
          onPress={() => setActiveTab('services')}>
          <Icon
            name="construct-outline"
            size={RFValue(16)}
            color={activeTab === 'services' ? theme.secondary : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{color: activeTab === 'services' ? theme.secondary : theme.textSecondary}}
            numberOfLines={1}>
            {t('dealer.services')}
          </CustomText>
        </TouchableOpacity>
      </View>
      {activeTab === 'products' ? (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondary} colors={[theme.secondary]} />
          }
        />
      ) : activeTab === 'vehicles' ? (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondary} colors={[theme.secondary]} />
          }
        />
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondary} colors={[theme.secondary]} />
          }
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.8}>
        <Icon name="add" size={RFValue(24)} color="#fff" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default InventoryScreen;

