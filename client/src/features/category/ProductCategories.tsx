import {View, StyleSheet, ActivityIndicator} from 'react-native';
import React, {useEffect, useState} from 'react';
import CustomHeader from '@components/ui/CustomHeader';
import Sidebar from './Sidebar';
import ProductList from './ProductList';
import FilterBar from './FilterBar';
import FilterModal, {IFilterState} from './FilterModal';
import {getProducts} from '@service/productService';
import {getDealerVehicles} from '@service/vehicleService';
import {getServices} from '@service/serviceService';
import {getDropdownOptions} from '@service/dropdownService';
import type {IProduct} from '../../types/product/IProduct';
import type {IDealerVehicle} from '../../types/vehicle/IVehicle';
import type {IService} from '../../types/service/IService';
import type {ICategoryItem, CategoryType} from '../../types/category/ICategoryItem';
import {useTheme} from '@hooks/useTheme';

type ItemType = IProduct | IDealerVehicle | IService;

const allProductsImage = require('@assets/images/AutoMobile-Services.jpeg');
const allVehiclesImage = require('@assets/images/All-Vehicles.jpeg');
const allServicesImage = require('@assets/images/AutoMobile-Services.jpeg');

const ProductCategories = () => {
  const [categories, setCategories] = useState<ICategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategoryItem | null>(null);
  const [items, setItems] = useState<ItemType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<IFilterState>({});
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [productCount, setProductCount] = useState<number>(0);
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
            name: 'All Categories',
            image: allProductsImage,
            type: 'all' as CategoryType,
          },
          {
            _id: 'all-products',
            name: 'All Products',
            image: allProductsImage,
            type: 'products' as CategoryType,
          },
          {
            _id: 'all-vehicles',
            name: 'All Vehicles',
            image: allVehiclesImage,
            type: 'vehicles' as CategoryType,
          },
          {
            _id: 'all-services',
            name: 'All Services',
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
            name: 'All Categories',
            image: allProductsImage,
            type: 'all' as CategoryType,
          },
          {
            _id: 'all-products',
            name: 'All Products',
            image: allProductsImage,
            type: 'products' as CategoryType,
          },
          {
            _id: 'all-vehicles',
            name: 'All Vehicles',
            image: allVehiclesImage,
            type: 'vehicles' as CategoryType,
          },
          {
            _id: 'all-services',
            name: 'All Services',
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
  });

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title={getHeaderTitle()} search />
      <View style={styles.subContainer}>
        {categoriesLoading ? (
          <ActivityIndicator size="small" color={colors.border} />
        ) : (
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryPress={(category: ICategoryItem) => setSelectedCategory(category)}
          />
        )}

        <View style={styles.contentContainer}>
          <FilterBar
            onFilterPress={handleFilterPress}
            onTypePress={handleTypePress}
            onBrandPress={handleBrandPress}
            selectedType={getSelectedTypeLabel()}
            selectedBrand={getSelectedBrandLabel()}
          />
          {itemsLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.border}
              style={styles.center}
            />
          ) : (
            <ProductList 
              data={items || []} 
              itemType={selectedCategory?.type === 'all' ? undefined : (selectedCategory?.type || 'products')} 
            />
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
