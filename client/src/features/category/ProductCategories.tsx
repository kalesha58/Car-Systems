import {View, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity} from 'react-native';
import React, {useEffect, useState, useMemo} from 'react';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Sidebar from './Sidebar';
import SidebarSkeleton from './SidebarSkeleton';
import ProductList from './ProductList';
import FilterBar from './FilterBar';
import FilterModal, {IFilterState} from './FilterModal';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {getProducts} from '@service/productService';
import {getDealerVehicles} from '@service/vehicleService';
import {getServices} from '@service/serviceService';
import {getDropdownOptions} from '@service/dropdownService';
import type {IProduct} from '../../types/product/IProduct';
import type {IDealerVehicle} from '../../types/vehicle/IVehicle';
import type {IService} from '../../types/service/IService';
import type {ICategoryItem, CategoryType} from '../../types/category/ICategoryItem';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';

type ItemType = IProduct | IDealerVehicle | IService;

const allProductsImage = require('@assets/images/AutoMobile-Services.jpeg');
const allVehiclesImage = require('@assets/images/All-Vehicles.jpeg');
const allServicesImage = require('@assets/images/AutoMobile-Services.jpeg');

const ProductCategories = () => {
  const {t} = useTranslation();
  const [categories, setCategories] = useState<ICategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategoryItem | null>(null);
  const [items, setItems] = useState<ItemType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<IFilterState>({});
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dropdownOptions, setDropdownOptions] = useState<{
    vehicleTypes: Array<{label: string; value: string}>;
    brands: Array<{label: string; value: string}>;
  }>({
    vehicleTypes: [],
    brands: [],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);

        const dropdownData = await getDropdownOptions();
        setDropdownOptions({
          vehicleTypes: dropdownData.vehicleTypes || [],
          brands: dropdownData.brands || [],
        });
        const backendCategories: ICategoryItem[] =
          dropdownData.categories?.map(cat => ({
            _id: cat.value,
            name: cat.label,
            image: null,
            type: 'products' as CategoryType,
          })) || [];

        const allCategories: ICategoryItem[] = [
          {
            _id: 'all-categories',
            name: t('categories.allCategories'),
            image: allProductsImage,
            type: 'all' as CategoryType,
          },
          {
            _id: 'all-products',
            name: t('categories.allProducts'),
            image: allProductsImage,
            type: 'products' as CategoryType,
          },
          {
            _id: 'all-vehicles',
            name: t('categories.allVehicles'),
            image: allVehiclesImage,
            type: 'vehicles' as CategoryType,
          },
          {
            _id: 'all-services',
            name: t('categories.allServices'),
            image: allServicesImage,
            type: 'services' as CategoryType,
          },
          ...backendCategories,
        ];

        setCategories(allCategories);
        if (allCategories.length > 0) {
          setSelectedCategory(allCategories[0]);
        }
      } catch (error) {
        const defaultCategories: ICategoryItem[] = [
          {
            _id: 'all-categories',
            name: t('categories.allCategories'),
            image: allProductsImage,
            type: 'all' as CategoryType,
          },
          {
            _id: 'all-products',
            name: t('categories.allProducts'),
            image: allProductsImage,
            type: 'products' as CategoryType,
          },
          {
            _id: 'all-vehicles',
            name: t('categories.allVehicles'),
            image: allVehiclesImage,
            type: 'vehicles' as CategoryType,
          },
          {
            _id: 'all-services',
            name: t('categories.allServices'),
            image: allServicesImage,
            type: 'services' as CategoryType,
          },
        ];
        setCategories(defaultCategories);
        setSelectedCategory(defaultCategories[0]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedCategory || !selectedCategory.type) {
        return;
      }

      try {
        setItemsLoading(true);
        setItems([]); // Clear items immediately when category changes
        const categoryType = selectedCategory.type;

        const queryParams: any = {};
        if (filters.type) {
          queryParams.vehicleType = filters.type;
        }
        if (filters.brand) {
          queryParams.brand = filters.brand;
        }
        if (filters.minPrice !== undefined) {
          queryParams.minPrice = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          queryParams.maxPrice = filters.maxPrice;
        }
        if (selectedCategory.type === 'products' && selectedCategory._id !== 'all-products') {
          queryParams.category = selectedCategory.name;
        }

        if (categoryType === 'all') {
          const [productsResponse, vehiclesResponse, servicesResponse] = await Promise.all([
            getProducts(queryParams),
            getDealerVehicles(queryParams),
            getServices(queryParams),
          ]);

          const allItems: ItemType[] = [
            ...(productsResponse.Response?.products || []),
            ...(vehiclesResponse.Response?.vehicles || []),
            ...(servicesResponse.Response?.services || []),
          ];

          setItems(allItems);
          setProductCount(allItems.length);
        } else if (categoryType === 'products') {
          const response = await getProducts(queryParams);
          const products = response.Response?.products || [];
          setItems(products);
          setProductCount(products.length);
        } else if (categoryType === 'vehicles') {
          const response = await getDealerVehicles(queryParams);
          const vehicles = response.Response?.vehicles || [];
          setItems(vehicles);
          setProductCount(vehicles.length);
        } else if (categoryType === 'services') {
          const response = await getServices(queryParams);
          const services = response.Response?.services || [];
          setItems(services);
          setProductCount(services.length);
        }
      } catch (error) {
        setItems([]);
        setProductCount(0);
      } finally {
        setItemsLoading(false);
      }
    };

    if (selectedCategory) {
      fetchItems();
    }
  }, [selectedCategory, filters]);

  const getHeaderTitle = () => {
    if (selectedCategory?.name) {
      return selectedCategory.name;
    }
    return 'Categories';
  };

  const getSearchPlaceholder = () => {
    if (!selectedCategory) {
      return 'Search for products, vehicles, services...';
    }
    
    switch (selectedCategory.type) {
      case 'all':
        return 'Search all categories...';
      case 'products':
        return selectedCategory._id === 'all-products' 
          ? 'Search all products...' 
          : `Search in ${selectedCategory.name}...`;
      case 'vehicles':
        return selectedCategory._id === 'all-vehicles'
          ? 'Search all vehicles...'
          : `Search in ${selectedCategory.name}...`;
      case 'services':
        return selectedCategory._id === 'all-services'
          ? 'Search all services...'
          : `Search in ${selectedCategory.name}...`;
      default:
        return 'Search...';
    }
  };

  const handleFilterApply = (appliedFilters: IFilterState) => {
    setFilters(appliedFilters);
  };

  const handleFilterPress = () => {
    setFilterModalVisible(true);
  };

  const handleTypePress = () => {
    setFilterModalVisible(true);
  };

  const handleBrandPress = () => {
    setFilterModalVisible(true);
  };

  const getSelectedTypeLabel = (): string | undefined => {
    if (!filters.type) {
      return undefined;
    }
    const typeOption = dropdownOptions.vehicleTypes.find(
      opt => opt.value === filters.type,
    );
    return typeOption?.label;
  };

  const getSelectedBrandLabel = (): string | undefined => {
    if (!filters.brand) {
      return undefined;
    }
    const brandOption = dropdownOptions.brands.find(
      opt => opt.value === filters.brand,
    );
    return brandOption?.label;
  };

  // Filter items based on search query - works for all category types
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      // Check if item is a vehicle (has vehicleModel and year)
      const isVehicle = 'vehicleModel' in item && 'year' in item;
      // Check if item is a service (has durationMinutes and homeService)
      const isService = 'durationMinutes' in item && 'homeService' in item;
      // Otherwise it's a product
      const isProduct = !isVehicle && !isService;

      // Common search fields
      const descriptionMatch = 'description' in item && item.description?.toLowerCase().includes(query);
      const priceMatch = 'price' in item && String(item.price)?.includes(query);
      
      // Product-specific search fields
      let nameMatch = false;
      let brandMatch = false;
      let categoryMatch = false;
      let productTypeMatch = false;
      let originalPriceMatch = false;
      
      if (isProduct) {
        nameMatch = 'name' in item && item.name?.toLowerCase().includes(query);
        brandMatch = 'brand' in item && item.brand?.toLowerCase().includes(query);
        categoryMatch = 'category' in item && item.category?.toLowerCase().includes(query);
        productTypeMatch = 'productType' in item && (item as any).productType?.toLowerCase().includes(query);
        originalPriceMatch = 'originalPrice' in item && item.originalPrice && 
          String(item.originalPrice)?.includes(query);
      }
      
      // Vehicle-specific search fields
      let vehicleModelMatch = false;
      let vehicleYearMatch = false;
      let vehicleTypeMatch = false;
      let vehicleBrandMatch = false;
      let vehicleMakeMatch = false;
      let vehicleColorMatch = false;
      let vehicleFuelTypeMatch = false;
      let vehicleTransmissionMatch = false;
      let vehicleConditionMatch = false;
      let vehicleMileageMatch = false;
      let vehicleNumberPlateMatch = false;
      let vehicleDealerMatch = false;
      
      if (isVehicle) {
        const vehicle = item as IDealerVehicle;
        vehicleBrandMatch = vehicle.brand?.toLowerCase().includes(query);
        vehicleModelMatch = vehicle.vehicleModel?.toLowerCase().includes(query);
        vehicleYearMatch = String(vehicle.year)?.includes(query);
        vehicleTypeMatch = vehicle.vehicleType?.toLowerCase().includes(query);
        vehicleMakeMatch = 'make' in vehicle && (vehicle as any).make?.toLowerCase().includes(query);
        vehicleColorMatch = vehicle.color?.toLowerCase().includes(query);
        vehicleFuelTypeMatch = vehicle.fuelType?.toLowerCase().includes(query);
        vehicleTransmissionMatch = vehicle.transmission?.toLowerCase().includes(query);
        vehicleConditionMatch = vehicle.condition?.toLowerCase().includes(query);
        vehicleMileageMatch = vehicle.mileage && String(vehicle.mileage)?.includes(query);
        vehicleNumberPlateMatch = vehicle.numberPlate?.toLowerCase().includes(query);
        vehicleDealerMatch = vehicle.dealer?.businessName?.toLowerCase().includes(query) ||
          vehicle.dealer?.address?.toLowerCase().includes(query);
        
        // Also search in combined brand + model
        const brandModelMatch = `${vehicle.brand} ${vehicle.vehicleModel}`.toLowerCase().includes(query);
        vehicleModelMatch = vehicleModelMatch || brandModelMatch;
      }
      
      // Service-specific search fields
      let serviceTypeMatch = false;
      let serviceNameMatch = false;
      let durationMatch = false;
      let homeServiceMatch = false;
      
      if (isService) {
        const service = item as IService;
        serviceNameMatch = 'name' in service && service.name?.toLowerCase().includes(query);
        serviceTypeMatch = service.serviceType?.toLowerCase().includes(query);
        durationMatch = service.durationMinutes && String(service.durationMinutes)?.includes(query);
        homeServiceMatch = service.homeService !== undefined && 
          (service.homeService ? 'home service' : 'shop service').includes(query);
      }
      
      // Search in all relevant fields
      return (
        // Common fields
        descriptionMatch ||
        priceMatch ||
        // Product fields
        nameMatch ||
        brandMatch ||
        categoryMatch ||
        productTypeMatch ||
        originalPriceMatch ||
        // Vehicle fields
        vehicleBrandMatch ||
        vehicleModelMatch ||
        vehicleYearMatch ||
        vehicleTypeMatch ||
        vehicleMakeMatch ||
        vehicleColorMatch ||
        vehicleFuelTypeMatch ||
        vehicleTransmissionMatch ||
        vehicleConditionMatch ||
        vehicleMileageMatch ||
        vehicleNumberPlateMatch ||
        vehicleDealerMatch ||
        // Service fields
        serviceNameMatch ||
        serviceTypeMatch ||
        durationMatch ||
        homeServiceMatch
      );
    });
  }, [items, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchPress = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };

  // Clear search when category changes
  useEffect(() => {
    setSearchQuery('');
  }, [selectedCategory?._id]);

  const {colors} = useTheme();

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    subContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      borderWidth: 0.6,
      borderColor: colors.border,
      marginHorizontal: 10,
      marginTop: 10,
      marginBottom: 10,
      paddingHorizontal: 12,
      minHeight: 50,
    },
    searchInput: {
      flex: 1,
      fontSize: RFValue(14),
      fontFamily: Fonts.Medium,
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    searchIconButton: {
      padding: 8,
    },
    searchDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    searchResultsInfo: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      paddingBottom: 4,
    },
  });

  return (
    <View style={styles.mainContainer}>
      <CustomHeader 
        title={getHeaderTitle()} 
        search 
        onSearchPress={handleSearchPress}
      />
      <View style={styles.subContainer}>
        {categoriesLoading ? (
          <SidebarSkeleton />
        ) : (
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryPress={(category: ICategoryItem) => setSelectedCategory(category)}
          />
        )}

        <View style={styles.contentContainer}>
          {searchVisible && (
            <View>
              <View style={styles.searchContainer}>
                <Icon name="search" color={colors.text} size={RFValue(20)} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={getSearchPlaceholder()}
                  placeholderTextColor={colors.text + '80'}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => handleSearch('')}
                    style={styles.searchIconButton}>
                    <Icon 
                      name="close-circle" 
                      color={colors.text} 
                      size={RFValue(20)} 
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.searchDivider} />
                <TouchableOpacity style={styles.searchIconButton}>
                  <Icon name="mic" color={colors.text} size={RFValue(20)} />
                </TouchableOpacity>
              </View>
              {searchQuery.trim() && (
                <View style={styles.searchResultsInfo}>
                  <CustomText variant="h7" fontFamily={Fonts.Medium} style={{opacity: 0.7}}>
                    {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} found
                    {selectedCategory?.name && ` in ${selectedCategory.name}`}
                  </CustomText>
                </View>
              )}
            </View>
          )}
          <FilterBar
            onFilterPress={handleFilterPress}
            onTypePress={handleTypePress}
            onBrandPress={handleBrandPress}
            selectedType={getSelectedTypeLabel()}
            selectedBrand={getSelectedBrandLabel()}
          />
          {itemsLoading ? (
            <ProductList 
              data={[]} 
              itemType={selectedCategory?.type === 'all' ? 'products' : (selectedCategory?.type || 'products')}
              loading={true}
            />
          ) : (
            <>
              {searchQuery.trim() && filteredItems.length === 0 && (
                <View style={[styles.center, {padding: 20}]}>
                  <CustomText variant="h6" fontFamily={Fonts.Medium} style={{opacity: 0.6}}>
                    No results found for "{searchQuery}"
                  </CustomText>
                </View>
              )}
              <ProductList 
                data={filteredItems || []} 
                itemType={selectedCategory?.type === 'all' ? undefined : (selectedCategory?.type || 'products')}
                loading={false}
              />
            </>
          )}
        </View>
      </View>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleFilterApply}
        initialFilters={filters}
        productCount={productCount}
      />
    </View>
  );
};

export default ProductCategories;
