import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';
import {useFavoritesStore} from '@state/favoritesStore';
import {getProducts} from '@service/productService';
import {getDealerVehicles} from '@service/vehicleService';
import {getServices} from '@service/serviceService';
import ProductListItem from '@features/category/ProductListItem';
import VehicleItem from '@features/category/VehicleItem';
import ServiceItem from '@features/category/ServiceItem';
import EmptyState from '@components/common/EmptyState/EmptyState';
import {IProduct} from '../../types/product/IProduct';
import {IDealerVehicle} from '../../types/vehicle/IVehicle';
import {IService} from '../../types/service/IService';

type TabType = 'products' | 'vehicles' | 'services';

const WishlistScreen: React.FC = () => {
  const {t} = useTranslation();
  const {colors} = useTheme();
  const {favorites, isFavorite} = useFavoritesStore();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [products, setProducts] = useState<IProduct[]>([]);
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter items based on favorites
  const favoriteProducts = useMemo(() => {
    return products.filter(item => {
      const itemId = item.id || (item as any)._id;
      return favorites.includes(String(itemId));
    });
  }, [products, favorites]);

  const favoriteVehicles = useMemo(() => {
    return vehicles.filter(item => {
      const itemId = item.id || (item as any)._id;
      return favorites.includes(String(itemId));
    });
  }, [vehicles, favorites]);

  const favoriteServices = useMemo(() => {
    return services.filter(item => {
      const itemId = item.id || (item as any)._id;
      return favorites.includes(String(itemId));
    });
  }, [services, favorites]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsData, vehiclesData, servicesData] = await Promise.all([
        getProducts({limit: 1000}),
        getDealerVehicles({limit: 1000}),
        getServices({limit: 1000}),
      ]);

      setProducts(productsData.Response?.products || []);
      setVehicles(vehiclesData.Response?.vehicles || []);
      setServices(servicesData.Response?.services || []);
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const renderProductItem = ({item}: {item: IProduct}) => (
    <ProductListItem item={item} />
  );

  const renderVehicleItem = ({item, index}: {item: IDealerVehicle; index: number}) => (
    <VehicleItem item={item} index={index} />
  );

  const renderServiceItem = ({item, index}: {item: IService; index: number}) => (
    <ServiceItem item={item} index={index} />
  );

  const renderEmptyState = () => {
    const emptyMessages = {
      products: {
        title: t('wishlist.noProducts'),
        message: t('wishlist.noProductsMessage'),
        icon: 'cube-outline',
      },
      vehicles: {
        title: t('wishlist.noVehicles'),
        message: t('wishlist.noVehiclesMessage'),
        icon: 'car-outline',
      },
      services: {
        title: t('wishlist.noServices'),
        message: t('wishlist.noServicesMessage'),
        icon: 'construct-outline',
      },
    };

    const emptyData = emptyMessages[activeTab];

    return (
      <EmptyState
        title={emptyData.title}
        message={emptyData.message}
        icon={emptyData.icon}
      />
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
    },
    tabContainerOuter: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 2,
      backgroundColor: colors.background,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 4,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      gap: 6,
    },
    activeTab: {
      backgroundColor: colors.secondary + '15',
    },
    tabText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Medium,
    },
    listContent: {
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 22,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    productListContent: {
      paddingTop: 8,
      paddingBottom: 22,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      <CustomHeader
        title={t('wishlist.title')}
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
      />
      <View style={styles.contentContainer}>
        <View style={styles.tabContainerOuter}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'products' && styles.activeTab]}
              onPress={() => setActiveTab('products')}>
              <Icon
                name="cube-outline"
                size={RFValue(16)}
                color={activeTab === 'products' ? colors.secondary : colors.textSecondary}
              />
              <CustomText
                variant="h6"
                fontFamily={Fonts.SemiBold}
                style={{
                  color: activeTab === 'products' ? colors.secondary : colors.textSecondary,
                }}>
                {t('wishlist.products')}
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
              onPress={() => setActiveTab('vehicles')}>
              <Icon
                name="car-outline"
                size={RFValue(16)}
                color={activeTab === 'vehicles' ? colors.secondary : colors.textSecondary}
              />
              <CustomText
                variant="h6"
                fontFamily={Fonts.SemiBold}
                style={{
                  color: activeTab === 'vehicles' ? colors.secondary : colors.textSecondary,
                }}>
                {t('wishlist.vehicles')}
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'services' && styles.activeTab]}
              onPress={() => setActiveTab('services')}>
              <Icon
                name="construct-outline"
                size={RFValue(16)}
                color={activeTab === 'services' ? colors.secondary : colors.textSecondary}
              />
              <CustomText
                variant="h6"
                fontFamily={Fonts.SemiBold}
                style={{
                  color: activeTab === 'services' ? colors.secondary : colors.textSecondary,
                }}>
                {t('wishlist.services')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <>
            {activeTab === 'products' && (
              <FlatList
                data={favoriteProducts}
                renderItem={renderProductItem}
                keyExtractor={item => item.id || (item as any)._id}
                contentContainerStyle={styles.productListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.secondary}
                  />
                }
              />
            )}
            {activeTab === 'vehicles' && (
              <FlatList
                data={favoriteVehicles}
                renderItem={renderVehicleItem}
                keyExtractor={item => item.id || (item as any)._id}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.secondary}
                  />
                }
              />
            )}
            {activeTab === 'services' && (
              <FlatList
                data={favoriteServices}
                renderItem={renderServiceItem}
                keyExtractor={item => item.id || (item as any)._id}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.secondary}
                  />
                }
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default WishlistScreen;
