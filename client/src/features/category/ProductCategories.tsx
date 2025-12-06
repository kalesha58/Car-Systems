import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import React, {useEffect, useState} from 'react';
import CustomHeader from '@components/ui/CustomHeader';
import Sidebar, {CategoryType} from './Sidebar';
import ProductList from './ProductList';
import {getCategories} from '@service/categoryService';
import {getProducts} from '@service/productService';
import {getDealerVehicles} from '@service/vehicleService';
import {getServices} from '@service/serviceService';
import type {IProduct} from '../../types/product/IProduct';
import type {IDealerVehicle} from '../../types/vehicle/IVehicle';
import type {IService} from '../../types/service/IService';
import type {ICategoryItem} from '../../types/category/ICategoryItem';
import {useTheme} from '@hooks/useTheme';

type ItemType = IProduct | IDealerVehicle | IService;

const allProductsImage = require('@assets/images/AutoMobile-Services.jpeg');
const allVehiclesImage = require('@assets/images/All-Vehicles.jpeg');
const carImage = require('@assets/images/Car.jpeg');
const bikeImage = require('@assets/images/Bike.jpeg');
const allServicesImage = require('@assets/images/AutoMobile-Services.jpeg');
const repairImage = require('@assets/images/Repair.jpeg');
const maintenanceImage = require('@assets/images/Maintenance.jpeg');
const homeServiceImage = require('@assets/images/Home Service.jpeg');

const ProductCategories = () => {
  const [categoryType, setCategoryType] = useState<CategoryType>('products');
  const [categories, setCategories] = useState<ICategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategoryItem | null>(null);
  const [items, setItems] = useState<ItemType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        if (categoryType === 'products') {
          const response = await getCategories('active');
          const categoriesData: ICategoryItem[] = [
            {
              _id: 'all',
              name: 'All Products',
              image: allProductsImage,
            },
            ...(response.categories || []).map((cat) => ({
              _id: cat.id,
              name: cat.name,
              image: allProductsImage,
            })),
          ];
          setCategories(categoriesData);
          if (categoriesData.length > 0) {
            setSelectedCategory(categoriesData[0]);
          }
        } else if (categoryType === 'vehicles') {
          const vehicleCategories: ICategoryItem[] = [
            {_id: 'all', name: 'All Vehicles', image: allVehiclesImage},
            {_id: 'car', name: 'Cars', image: carImage},
            {_id: 'bike', name: 'Bikes', image: bikeImage},
          ];
          setCategories(vehicleCategories);
          setSelectedCategory(vehicleCategories[0]);
        } else if (categoryType === 'services') {
          const serviceCategories: ICategoryItem[] = [
            {_id: 'all', name: 'All Services', image: allServicesImage},
            {_id: 'repair', name: 'Repair', image: repairImage},
            {_id: 'maintenance', name: 'Maintenance', image: maintenanceImage},
            {_id: 'home', name: 'Home Service', image: homeServiceImage},
          ];
          setCategories(serviceCategories);
          setSelectedCategory(serviceCategories[0]);
        }
      } catch (error) {
        // Handle error - set empty categories on error
        if (categoryType === 'products') {
          const categoriesData: ICategoryItem[] = [
            {
              _id: 'all',
              name: 'All Products',
              image: allProductsImage,
            },
          ];
          setCategories(categoriesData);
          setSelectedCategory(categoriesData[0]);
        } else if (categoryType === 'vehicles') {
          const vehicleCategories: ICategoryItem[] = [
            {_id: 'all', name: 'All Vehicles', image: allVehiclesImage},
            {_id: 'car', name: 'Cars', image: carImage},
            {_id: 'bike', name: 'Bikes', image: bikeImage},
          ];
          setCategories(vehicleCategories);
          setSelectedCategory(vehicleCategories[0]);
        } else if (categoryType === 'services') {
          const serviceCategories: ICategoryItem[] = [
            {_id: 'all', name: 'All Services', image: allServicesImage},
            {_id: 'repair', name: 'Repair', image: repairImage},
            {_id: 'maintenance', name: 'Maintenance', image: maintenanceImage},
            {_id: 'home', name: 'Home Service', image: homeServiceImage},
          ];
          setCategories(serviceCategories);
          setSelectedCategory(serviceCategories[0]);
        }
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [categoryType]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        if (categoryType === 'products') {
          const query: {category?: string} = {};
          if (selectedCategory?._id && selectedCategory._id !== 'all') {
            query.category = selectedCategory.name;
          }
          const response = await getProducts(query);
          setItems(response.Response?.products || []);
        } else if (categoryType === 'vehicles') {
          const query: {vehicleType?: 'Car' | 'Bike'} = {};
          if (selectedCategory?._id === 'car') {
            query.vehicleType = 'Car';
          } else if (selectedCategory?._id === 'bike') {
            query.vehicleType = 'Bike';
          }
          const response = await getDealerVehicles(query);
          setItems(response.Response?.vehicles || []);
        } else if (categoryType === 'services') {
          const query: {homeService?: boolean; category?: string} = {};
          if (selectedCategory?._id === 'home') {
            query.homeService = true;
          } else if (selectedCategory && selectedCategory._id !== 'all') {
            query.category = selectedCategory.name;
          }
          const response = await getServices(query);
          setItems(response.Response?.services || []);
        }
      } catch (error) {
        // Handle error - set empty items on error
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    if (selectedCategory) {
      fetchItems();
    }
  }, [selectedCategory, categoryType]);

  const getHeaderTitle = () => {
    if (selectedCategory?.name) {
      return selectedCategory.name;
    }
    return categoryType.charAt(0).toUpperCase() + categoryType.slice(1);
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
            selectedCategoryType={categoryType}
            onCategoryTypePress={(type: CategoryType) => {
              setCategoryType(type);
              setSelectedCategory(null);
              setItems([]);
            }}
          />
        )}

        {itemsLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.border}
            style={styles.center}
          />
        ) : (
          <ProductList data={items || []} itemType={categoryType} />
        )}
      </View>
    </View>
  );
};

export default ProductCategories;
