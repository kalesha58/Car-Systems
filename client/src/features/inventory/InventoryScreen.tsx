import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator} from 'react-native';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';
import {getDealerProducts, getDealerVehicles, getDealerServices} from '@service/dealerService';
import {IProduct} from '../../types/product/IProduct';
import {IDealerVehicle} from '../../types/vehicle/IVehicle';
import {IService} from '../../types/service/IService';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '@components/common/EmptyState/EmptyState';
import {formatCurrency} from '@utils/analytics';

const InventoryScreen: React.FC = () => {
  const {colors: theme} = useTheme();
  const {t} = useTranslation('dealer');
  const [activeTab, setActiveTab] = useState<'products' | 'vehicles' | 'services'>('products');
  const [products, setProducts] = useState<IProduct[]>([]);
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const renderProductItem = ({item}: {item: IProduct}) => {
    return (
      <TouchableOpacity
        style={[styles.itemCard, {backgroundColor: theme.cardBackground, borderColor: theme.border}]}
        activeOpacity={0.7}>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} numberOfLines={1}>
              {item.name}
            </CustomText>
            <CustomText variant="h8" style={styles.brandText} numberOfLines={1}>
              {item.brand}
            </CustomText>
            <View style={styles.priceRow}>
              <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{color: theme.secondary}}>
                {formatCurrency(item.price)}
              </CustomText>
              {item.originalPrice && item.originalPrice > item.price && (
                <CustomText variant="h9" style={[styles.originalPrice, {color: theme.disabled}]}>
                  {formatCurrency(item.originalPrice)}
                </CustomText>
              )}
            </View>
            <View style={styles.stockRow}>
              <Icon name="cube-outline" size={RFValue(12)} color={theme.textSecondary} />
              <CustomText variant="h9" style={styles.stockText}>
                Stock: {item.stock}
              </CustomText>
            </View>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: item.status === 'active' ? '#10b98115' : '#f59e0b15'}]}>
            <CustomText
              variant="h9"
              fontFamily={Fonts.Medium}
              style={[styles.statusText, {color: item.status === 'active' ? '#10b981' : '#f59e0b'}]}>
              {item.status}
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVehicleItem = ({item}: {item: IDealerVehicle}) => {
    return (
      <TouchableOpacity
        style={[styles.itemCard, {backgroundColor: theme.cardBackground, borderColor: theme.border}]}
        activeOpacity={0.7}>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} numberOfLines={1}>
              {item.brand} {item.vehicleModel}
            </CustomText>
            <CustomText variant="h8" style={styles.brandText} numberOfLines={1}>
              {item.year} • {item.vehicleType}
            </CustomText>
            <View style={styles.priceRow}>
              <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{color: theme.secondary}}>
                {formatCurrency(item.price)}
              </CustomText>
            </View>
            <View style={styles.stockRow}>
              <Icon
                name={item.availability === 'available' ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={RFValue(12)}
                color={item.availability === 'available' ? '#10b981' : '#ef4444'}
              />
              <CustomText variant="h9" style={styles.stockText}>
                {item.availability.charAt(0).toUpperCase() + item.availability.slice(1)}
              </CustomText>
            </View>
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
      </TouchableOpacity>
    );
  };

  const renderServiceItem = ({item}: {item: IService}) => {
    return (
      <TouchableOpacity
        style={[styles.itemCard, {backgroundColor: theme.cardBackground, borderColor: theme.border}]}
        activeOpacity={0.7}>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} numberOfLines={1}>
              {item.name}
            </CustomText>
            {item.category && (
              <CustomText variant="h8" style={styles.brandText} numberOfLines={1}>
                {item.category}
              </CustomText>
            )}
            <View style={styles.priceRow}>
              <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{color: theme.secondary}}>
                {formatCurrency(item.price)}
              </CustomText>
            </View>
            <View style={styles.stockRow}>
              <Icon name="time-outline" size={RFValue(12)} color={theme.textSecondary} />
              <CustomText variant="h9" style={styles.stockText}>
                {item.durationMinutes} {item.durationMinutes === 1 ? 'min' : 'mins'}
              </CustomText>
              {item.homeService && (
                <>
                  <Icon name="home-outline" size={RFValue(12)} color={theme.textSecondary} style={{marginLeft: 8}} />
                  <CustomText variant="h9" style={styles.stockText}>
                    Home Service
                  </CustomText>
                </>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: '#10b98115'}]}>
            <CustomText variant="h9" fontFamily={Fonts.Medium} style={[styles.statusText, {color: '#10b981'}]}>
              Active
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'products') {
      return (
        <EmptyState
          title={t('noProducts')}
          message={t('noProductsMessage')}
          icon="cube-outline"
        />
      );
    }
    if (activeTab === 'vehicles') {
      return (
        <EmptyState
          title={t('noVehicles')}
          message={t('noVehiclesMessage')}
          icon="car-outline"
        />
      );
    }
    return (
      <EmptyState
        title={t('noServices')}
        message={t('noServicesMessage')}
        icon="construct-outline"
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: theme.background}]}>
        <CustomHeader title={t('inventory')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <CustomHeader title={t('inventory')} />
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
            {t('products')}
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
            {t('vehicles')}
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
            {t('services')}
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
    padding: 16,
    paddingTop: 0,
  },
  itemCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
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
  brandText: {
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.7,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: RFValue(10),
    textTransform: 'capitalize',
  },
});

export default InventoryScreen;

