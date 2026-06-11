import {View, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Alert, ScrollView} from 'react-native';
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import {useRoute} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Sidebar from './Sidebar';
import SidebarSkeleton from './SidebarSkeleton';
import CategoryTabs from './CategoryTabs';
import SubcategoryTabs from './SubcategoryTabs';
import PackageChips from './PackageChips';
import ProductList from './ProductList';
import FilterBar from './FilterBar';
import FilterModal, {IFilterState} from './FilterModal';
import SortModal, {SortOption} from './SortModal';
import FilterChips from './FilterChips';
import ViewToggle, {ViewMode} from './ViewToggle';
import QuickFilters, {IQuickFilter} from './QuickFilters';
import RecentSearches from './RecentSearches';
import EmptyState from './EmptyState';
import Breadcrumbs from './Breadcrumbs';
import Suggestions from './Suggestions';
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
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';
import {useRecentSearchesStore} from '@state/recentSearchesStore';
import {useCompareStore} from '@state/compareStore';
import {useAuthStore} from '@state/authStore';
import {startVoiceSearch, isVoiceSearchAvailable} from '@utils/voiceSearch';
import {useToast} from '@hooks/useToast';
import {navigate} from '@utils/NavigationUtils';
import {useNavigation} from '@react-navigation/native';
import {getSectionById, SPARE_PARTS_BRANDS} from '../../config/serviceCategoryConfig';

type ItemType = IProduct | IDealerVehicle | IService;

const allProductsImage = require('@assets/images/AutoMobile-Services.jpeg');
const allVehiclesImage = require('@assets/images/All-Vehicles.jpeg');
const allServicesImage = require('@assets/images/AutoMobile-Services.jpeg');

const ProductCategories = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const routeParams = route.params as {
    initialCategoryId?: string;
    initialCategoryType?: CategoryType;
    sortBy?: string;
    dealerId?: string;
    serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'general';
    vehicleType?: 'Car' | 'Bike';
  } | undefined;
  
  const {t} = useTranslation();
  const {showError, showSuccess} = useToast();
  const {addSearch} = useRecentSearchesStore();
  const {items: compareItems} = useCompareStore();
  const [categories, setCategories] = useState<ICategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategoryItem | null>(null);
  const [items, setItems] = useState<ItemType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [itemsLoading, setItemsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<IFilterState>({});
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [sortModalVisible, setSortModalVisible] = useState<boolean>(false);
  const [currentSort, setCurrentSort] = useState<SortOption>('relevance');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [productCount, setProductCount] = useState<number>(0);
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVoiceSearching, setIsVoiceSearching] = useState<boolean>(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  // Subcategory & package filter state
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<string | null>(null);
  // Spare parts vehicle type & brand filter
  const [sparePartsVehicleType, setSparePartsVehicleType] = useState<'Car' | 'Bike'>('Car');
  const [sparePartsBrand, setSparePartsBrand] = useState<string | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<{
    vehicleTypes: Array<{label: string; value: string}>;
    brands: Array<{label: string; value: string}>;
  }>({
    vehicleTypes: [],
    brands: [],
  });

  // API response cache
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const apiCacheRef = useRef<Map<string, {
    data: ItemType[];
    timestamp: number;
  }>>(new Map());
  const hasFailedAuthRef = useRef(false);

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
            image:
              cat.imageUrl && typeof cat.imageUrl === 'string' && cat.imageUrl.trim() !== ''
                ? cat.imageUrl
                : null,
            type: 'products' as CategoryType,
          })) || [];

        const allCategories: ICategoryItem[] = [
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
          {
            _id: 'car-service',
            name: 'Car Service',
            image: require('@assets/services/car_service.png'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'bike-service',
            name: 'Bike Service',
            image: require('@assets/services/bike_service.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'car-wash',
            name: 'Vehicle Wash',
            image: require('@assets/services/car_wash.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'bike-wash',
            name: 'Bike Wash',
            image: require('@assets/services/bike_service.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'ppf-detailing',
            name: 'PPF & Detailing',
            image: require('@assets/services/ppf_detailing.png'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'tire-service',
            name: 'Tire Service',
            image: require('@assets/services/tier_service.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'battery-service',
            name: 'Battery Service',
            image: require('@assets/services/batery_sevices.jpg'),
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
          {
            _id: 'car-service',
            name: 'Car Service',
            image: require('@assets/services/car_service.png'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'bike-service',
            name: 'Bike Service',
            image: require('@assets/services/bike_service.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'car-wash',
            name: 'Vehicle Wash',
            image: require('@assets/services/car_wash.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'bike-wash',
            name: 'Bike Wash',
            image: require('@assets/services/bike_service.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'ppf-detailing',
            name: 'PPF & Detailing',
            image: require('@assets/services/ppf_detailing.png'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'tire-service',
            name: 'Tire Service',
            image: require('@assets/services/tier_service.jpg'),
            type: 'services' as CategoryType,
          },
          {
            _id: 'battery-service',
            name: 'Battery Service',
            image: require('@assets/services/batery_sevices.jpg'),
            type: 'services' as CategoryType,
          },
        ];
        setCategories(defaultCategories);
        // Set initial category - will be overridden by route params if they exist
        if (!routeParams?.initialCategoryId) {
          setSelectedCategory(defaultCategories[0]);
        }
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  // Handle route parameters to set initial category
  useEffect(() => {
    if (!routeParams || categories.length === 0 || categoriesLoading) {
      return;
    }

    let categoryToSelect: ICategoryItem | null = null;

    // If initialCategoryId is provided, find matching category
    if (routeParams.initialCategoryId) {
      categoryToSelect = categories.find(
        cat => cat._id === routeParams.initialCategoryId
      ) || null;
    }
    // Otherwise, if initialCategoryType is provided, find first category of that type
    else if (routeParams.initialCategoryType) {
      categoryToSelect = categories.find(
        cat => cat.type === routeParams.initialCategoryType
      ) || null;
    }

    // Set the selected category if found
    if (categoryToSelect) {
      setItemsLoading(true);
      setItems([]);
      setSelectedCategory(categoryToSelect);
    }

    // Apply sortBy if provided
    if (routeParams.sortBy) {
      if (routeParams.sortBy === 'popularity') {
        setCurrentSort('popularity');
      } else if (routeParams.sortBy === 'createdAt') {
        setCurrentSort('newest');
      }
    }

    // Clear dealerId filter if navigating to "all products" without explicit dealerId
    // This ensures that when navigating from dashboard, we don't use stale dealerId
    if (categoryToSelect && 
        (categoryToSelect._id === 'all-products' || 
         categoryToSelect._id === 'all-vehicles' || 
         categoryToSelect._id === 'all-services') &&
        !routeParams.dealerId) {
      // Category is "all" and no dealerId in params, so we're viewing all items
      // The dealerId filter will not be applied in fetchItemsMemoized
    }
  }, [routeParams, categories, categoriesLoading]);

  // Update category counts
  const updateCategoryCounts = useCallback(async () => {
    // If we've already tried and got a 401, don't keep hammering the API as a guest
    if (!useAuthStore.getState().user && hasFailedAuthRef.current) {
      return;
    }

    try {
      const counts: Record<string, number> = {};
      for (const category of categories) {
        try {
          if (category.type === 'products') {
            const response = await getProducts(
              category._id !== 'all-products' ? {category: category.name} : {},
            ).catch((err) => {
              if (err?.response?.status === 401) {
                hasFailedAuthRef.current = true;
              }
              return {Response: {products: []}};
            });
            counts[category._id] = response.Response?.products?.length || 0;
          } else if (category.type === 'vehicles') {
            const response = await getDealerVehicles({limit: 1000}).catch((err) => {
              if (err?.response?.status === 401) {
                hasFailedAuthRef.current = true;
              }
              return {Response: {vehicles: []}};
            });
            counts[category._id] = response.Response?.vehicles?.length || 0;
          } else if (category.type === 'services') {
            const response = await getServices().catch((err) => {
              if (err?.response?.status === 401) {
                hasFailedAuthRef.current = true;
              }
              return {Response: {services: []}};
            });
            counts[category._id] = response.Response?.services?.length || 0;
          }
        } catch (error) {
          counts[category._id] = 0;
        }
      }
      setCategoryCounts(counts);
    } catch (error) {
      // Silently fail
    }
  }, [categories]);

  // Update category counts when categories change
  useEffect(() => {
    if (categories.length > 0 && !categoriesLoading) {
      updateCategoryCounts();
    }
  }, [categories.length, categoriesLoading, updateCategoryCounts]);

  // Memoized fetch function with caching
  const fetchItemsMemoized = useCallback(async (
    category: ICategoryItem,
    queryFilters: IFilterState,
    forceRefresh: boolean = false
  ) => {
    if (!category || !category.type) {
      return [];
    }

    const categoryType = category.type;

    // Build query params
    const queryParams: any = {};
    
    // Set high limit to fetch all items for "all" categories
    if (category._id === 'all-products' || category._id === 'all-vehicles' || category._id === 'all-services') {
      queryParams.limit = 1000;
    }
    
    // Add dealerId filter only if explicitly provided in route params and truthy
    // Only apply for products category type to avoid filtering vehicles/services incorrectly
    // Check for both undefined and 'undefined' string (React Navigation sometimes passes strings)
    const dealerId = routeParams?.dealerId;
    if (dealerId && 
        typeof dealerId === 'string' && 
        dealerId !== 'undefined' && 
        dealerId.trim() !== '' &&
        categoryType === 'products') {
      queryParams.dealerId = dealerId;
    }
    
    // Apply service type and vehicle type filters
    if (categoryType === 'services') {
      if (category._id === 'car-service') {
        queryParams.serviceType = 'car_automobile';
        queryParams.vehicleType = 'Car';
      } else if (category._id === 'bike-service') {
        queryParams.serviceType = 'bike_automobile';
        queryParams.vehicleType = 'Bike';
      } else if (category._id === 'car-wash') {
        queryParams.serviceType = 'car_wash';
      } else if (category._id === 'bike-wash') {
        queryParams.serviceType = 'car_wash';
        queryParams.vehicleType = 'Bike';
      } else if (category._id === 'ppf-detailing') {
        queryParams.serviceType = 'car_detailing';
      } else if (category._id === 'tire-service') {
        queryParams.serviceType = 'general';
      } else if (category._id === 'battery-service') {
        queryParams.serviceType = 'battery_service';
      } else {
        if (routeParams?.serviceType) {
          queryParams.serviceType = routeParams.serviceType;
        }
        if (routeParams?.vehicleType) {
          queryParams.vehicleType = routeParams.vehicleType;
        }
      }
    }
    
    if (queryFilters.type) {
      queryParams.vehicleType = queryFilters.type;
    }
    if (queryFilters.brand) {
      queryParams.brand = queryFilters.brand;
    }
    if (queryFilters.minPrice !== undefined) {
      queryParams.minPrice = queryFilters.minPrice;
    }
    if (queryFilters.maxPrice !== undefined) {
      queryParams.maxPrice = queryFilters.maxPrice;
    }
    if (categoryType === 'products' && category._id !== 'all-products') {
      queryParams.category = category.name;
    }

    // Generate cache key
    const sortedParams = Object.keys(queryParams).sort().reduce((acc, key) => {
      acc[key] = queryParams[key];
      return acc;
    }, {} as any);
    const cacheKey = `${categoryType}_${category._id}_${JSON.stringify(sortedParams)}`;

    // Check cache first
    console.log(`[${categoryType}] Checking cache for category:`, category._id, 'Cache key:', cacheKey);
    if (!forceRefresh) {
      const cached = apiCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[${categoryType}] Using cached data for category:`, category._id, 'Items:', cached.data.length);
        return cached.data;
      } else if (cached) {
        console.log(`[${categoryType}] Cache expired for category:`, category._id);
      } else {
        console.log(`[${categoryType}] No cache found for category:`, category._id);
      }
    } else {
      console.log(`[${categoryType}] Force refresh requested for category:`, category._id);
    }

    // Fetch from API
    try {
      let fetchedItems: ItemType[] = [];
      
      if (categoryType === 'products') {
        console.log('[All Products] Fetching products with params:', JSON.stringify(queryParams, null, 2));
        const response = await getProducts(queryParams);
        console.log('[All Products] Full API Response:', JSON.stringify(response, null, 2));
        console.log('[All Products] Response structure:', {
          success: response?.success,
          hasResponse: !!response?.Response,
          productsCount: response?.Response?.products?.length || 0,
          pagination: response?.Response?.pagination,
        });
        fetchedItems = response.Response?.products || [];
        console.log('[All Products] Extracted products:', fetchedItems.length);
        if (fetchedItems.length > 0) {
          console.log('[All Products] First product sample:', {
            id: fetchedItems[0].id,
            name: (fetchedItems[0] as IProduct).name,
            dealerId: (fetchedItems[0] as IProduct).dealerId,
            dealer: (fetchedItems[0] as IProduct).dealer,
          });
        }
      } else if (categoryType === 'vehicles') {
        console.log('[All Vehicles] Fetching vehicles with params:', queryParams);
        const response = await getDealerVehicles(queryParams);
        console.log('[All Vehicles] API Response:', response);
        console.log('[All Vehicles] Response structure:', {
          success: response?.success,
          hasResponse: !!response?.Response,
          vehiclesCount: response?.Response?.vehicles?.length || 0,
          pagination: response?.Response?.pagination,
        });
        // Handle both response structures: Response.vehicles or Response.vehicles (nested)
        fetchedItems = response.Response?.vehicles || [];
        console.log('[All Vehicles] Extracted vehicles:', fetchedItems.length);
      } else if (categoryType === 'services') {
        const response = await getServices(queryParams);
        fetchedItems = response.Response?.services || [];
      }

      // Cache the result
      apiCacheRef.current.set(cacheKey, {
        data: fetchedItems,
        timestamp: Date.now(),
      });

      console.log(`[${categoryType}] Fetched ${fetchedItems.length} items for category:`, category._id);
      return fetchedItems;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.warn(`[${categoryType}] Authentication required for category ${category._id}. Guest access might be limited on the backend.`);
      } else {
        console.error(`[${categoryType}] Error fetching items for category ${category._id}:`, error);
      }
      // Return cached data if available, even if expired
      const cached = apiCacheRef.current.get(cacheKey);
      if (cached) {
        console.log(`[${categoryType}] Using cached data for category:`, category._id);
        return cached.data;
      }
      console.warn(`[${categoryType}] No cached data available, returning empty array for category:`, category._id);
      return [];
    }
  }, [routeParams?.dealerId]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedCategory) {
        return;
      }

      try {
        setItemsLoading(true);
        setItems([]); // Clear items immediately when category changes

        const fetchedItems = await fetchItemsMemoized(selectedCategory, filters, false);
        console.log('[ProductCategories] Setting items:', {
          category: selectedCategory._id,
          categoryType: selectedCategory.type,
          itemsCount: fetchedItems.length,
        });
        setItems(fetchedItems);
        setProductCount(fetchedItems.length);
      } catch (error) {
        console.error('[ProductCategories] Error in fetchItems:', error);
        setItems([]);
        setProductCount(0);
      } finally {
        setItemsLoading(false);
      }
    };

    if (selectedCategory) {
      fetchItems();
    }
  }, [selectedCategory, filters, fetchItemsMemoized]);

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
    if (appliedFilters.sort) {
      setCurrentSort(appliedFilters.sort as SortOption);
    }
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

  // Compute which categories to show in the tab bar based on route params.
  // This makes the tab bar generic: it only shows tabs relevant to what the
  // user selected on the home screen instead of showing all sections.
  const visibleCategories = useMemo(() => {
    if (!routeParams?.initialCategoryId && !routeParams?.initialCategoryType) {
      // No route params → user opened Store tab directly → show all categories
      return categories;
    }

    const id = routeParams.initialCategoryId;

    if (id === 'all-products') {
      // Show only product-type categories
      return categories.filter(cat => cat.type === 'products');
    }

    if (id === 'all-vehicles') {
      // Show only vehicle-type categories
      return categories.filter(cat => cat.type === 'vehicles');
    }

    if (id === 'all-services') {
      // Show all service-type sub-categories
      return categories.filter(cat => cat.type === 'services');
    }

    if (id) {
      // A specific sub-category was selected (e.g. 'car-wash') →
      // only show that one tab so the screen stays focused on the selection.
      const matched = categories.filter(cat => cat._id === id);
      if (matched.length > 0) {
        return matched;
      }
    }

    // Fallback: respect initialCategoryType if no id match
    if (routeParams.initialCategoryType) {
      return categories.filter(cat => cat.type === routeParams.initialCategoryType);
    }

    return categories;
  }, [categories, routeParams?.initialCategoryId, routeParams?.initialCategoryType]);

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
      const descriptionMatch = !!('description' in item && item.description?.toLowerCase().includes(query));
      const priceMatch = !!('price' in item && String(item.price)?.includes(query));
      
      // Product-specific search fields
      let nameMatch = false;
      let brandMatch = false;
      let categoryMatch = false;
      let productTypeMatch = false;
      let originalPriceMatch = false;
      
      if (isProduct) {
        nameMatch = !!('name' in item && item.name?.toLowerCase().includes(query));
        brandMatch = !!('brand' in item && item.brand?.toLowerCase().includes(query));
        categoryMatch = !!('category' in item && item.category?.toLowerCase().includes(query));
        productTypeMatch = !!('productType' in item && (item as any).productType?.toLowerCase().includes(query));
        originalPriceMatch = !!('originalPrice' in item && item.originalPrice && 
          String(item.originalPrice)?.includes(query));
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
        vehicleBrandMatch = !!vehicle.brand?.toLowerCase().includes(query);
        vehicleModelMatch = !!vehicle.vehicleModel?.toLowerCase().includes(query);
        vehicleYearMatch = !!String(vehicle.year)?.includes(query);
        vehicleTypeMatch = !!vehicle.vehicleType?.toLowerCase().includes(query);
        vehicleMakeMatch = !!('make' in vehicle && (vehicle as any).make?.toLowerCase().includes(query));
        vehicleColorMatch = !!vehicle.color?.toLowerCase().includes(query);
        vehicleFuelTypeMatch = !!vehicle.fuelType?.toLowerCase().includes(query);
        vehicleTransmissionMatch = !!vehicle.transmission?.toLowerCase().includes(query);
        vehicleConditionMatch = !!vehicle.condition?.toLowerCase().includes(query);
        vehicleMileageMatch = !!(vehicle.mileage && String(vehicle.mileage)?.includes(query));
        vehicleNumberPlateMatch = !!vehicle.numberPlate?.toLowerCase().includes(query);
        vehicleDealerMatch = !!(vehicle.dealer?.businessName?.toLowerCase().includes(query) ||
          vehicle.dealer?.address?.toLowerCase().includes(query));
        
        // Also search in combined brand + model
        const brandModelMatch = `${vehicle.brand} ${vehicle.vehicleModel}`.toLowerCase().includes(query);
        vehicleModelMatch = vehicleModelMatch || brandModelMatch;
      }
      
      // Service-specific search fields
      let serviceNameMatch = false;
      let durationMatch = false;
      let homeServiceMatch = false;
      
      if (isService) {
        const service = item as IService;
        serviceNameMatch = !!('name' in service && service.name?.toLowerCase().includes(query));
        durationMatch = !!(service.durationMinutes && String(service.durationMinutes)?.includes(query));
        homeServiceMatch = !!(service.homeService !== undefined && 
          (service.homeService ? 'home service' : 'shop service').includes(query));
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
        durationMatch ||
        homeServiceMatch
      );
    });
  }, [items, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addSearch(query);
    }
  };

  const handleSelectSearch = (query: string) => {
    setSearchQuery(query);
    addSearch(query);
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
    // Also reset subcategory / package / brand filters on section switch
    setSelectedSubcategoryId(null);
    setSelectedPackage(null);
    setSelectedDeliveryMode(null);
    setSparePartsBrand(null);
  }, [selectedCategory?._id]);


  const sortedItems = useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) {
      return filteredItems;
    }

    const sorted = [...filteredItems];

    switch (currentSort) {
      case 'price_low_high':
        return sorted.sort((a, b) => {
          const priceA = 'price' in a ? a.price : 0;
          const priceB = 'price' in b ? b.price : 0;
          return priceA - priceB;
        });
      case 'price_high_low':
        return sorted.sort((a, b) => {
          const priceA = 'price' in a ? a.price : 0;
          const priceB = 'price' in b ? b.price : 0;
          return priceB - priceA;
        });
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = 'createdAt' in a ? new Date(a.createdAt || 0).getTime() : 0;
          const dateB = 'createdAt' in b ? new Date(b.createdAt || 0).getTime() : 0;
          return dateB - dateA;
        });
      case 'popularity':
        return sorted.sort((a, b) => {
          const likesA = 'likes' in a ? (a as any).likes || 0 : 0;
          const likesB = 'likes' in b ? (b as any).likes || 0 : 0;
          return likesB - likesA;
        });
      case 'relevance':
      default:
        return sorted;
    }
  }, [filteredItems, currentSort]);

  // ── Derived: section config for the currently selected category ──────────
  const currentSection = useMemo(() => {
    if (!selectedCategory) return null;
    return getSectionById(selectedCategory._id) ?? null;
  }, [selectedCategory?._id]);

  // ── Client-side subcategory / package / delivery-mode filter ─────────────
  const subcategoryFilteredItems = useMemo(() => {
    if (!currentSection || selectedCategory?.type !== 'services') {
      return sortedItems;
    }
    let result = [...sortedItems];

    // Filter by subcategory
    if (selectedSubcategoryId) {
      result = result.filter(item => {
        const svc = item as IService;
        return svc.serviceSubCategory === selectedSubcategoryId;
      });
    }

    // Filter by package (Vehicle Wash)
    if (selectedPackage && currentSection.hasPackages) {
      result = result.filter(item => {
        const svc = item as any;
        return svc.servicePackage === selectedPackage;
      });
    }

    // Filter by delivery mode (home vs store/dealer)
    if (selectedDeliveryMode && currentSection.hasDeliveryModes) {
      result = result.filter(item => {
        const svc = item as IService;
        const isHome = svc.homeService === true;
        if (selectedDeliveryMode === 'home') return isHome;
        return !isHome;
      });
    }

    return result;
  }, [sortedItems, currentSection, selectedSubcategoryId, selectedPackage, selectedDeliveryMode, selectedCategory?.type]);

  // ── Spare Parts: filter by vehicleType + brand ───────────────────────────
  const finalItems = useMemo(() => {
    if (selectedCategory?.type !== 'products') {
      return subcategoryFilteredItems;
    }
    let result = [...subcategoryFilteredItems];
    if (sparePartsVehicleType) {
      result = result.filter(item => {
        const p = item as IProduct;
        return !p.vehicleType || p.vehicleType.toLowerCase() === sparePartsVehicleType.toLowerCase();
      });
    }
    if (sparePartsBrand) {
      result = result.filter(item => {
        const p = item as IProduct;
        return p.brand?.toLowerCase() === sparePartsBrand.toLowerCase();
      });
    }
    return result;
  }, [subcategoryFilteredItems, selectedCategory?.type, sparePartsVehicleType, sparePartsBrand]);

  // Handle sort selection
  const handleSortSelect = (sort: SortOption) => {
    setCurrentSort(sort);
  };

  // Handle quick filter
  const handleQuickFilter = (filter: IQuickFilter['filter']) => {
    if (filter.maxPrice) {
      setFilters(prev => ({
        ...prev,
        maxPrice: filter.maxPrice,
        minPrice: prev.minPrice || 0,
      }));
    }
    if (filter.sort) {
      setCurrentSort(filter.sort as SortOption);
    }
  };

  // Handle filter removal
  const handleRemoveFilter = (key: keyof IFilterState) => {
    setFilters(prev => {
      const newFilters = {...prev};
      if (key === 'minPrice' || key === 'maxPrice') {
        delete newFilters.minPrice;
        delete newFilters.maxPrice;
      } else {
        delete newFilters[key];
      }
      return newFilters;
    });
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setFilters({});
    setCurrentSort('relevance');
  };

  // Handle voice search
  const handleVoiceSearch = async () => {
    if (!isVoiceSearchAvailable()) {
      showError('Voice search is not available');
      return;
    }

    setIsVoiceSearching(true);
    try {
      const result = await startVoiceSearch();
      if (result.text) {
        setSearchQuery(result.text);
        addSearch(result.text);
      } else if (result.error) {
        showError(result.error);
      }
    } catch (error) {
      showError('Voice search failed. Please try again.');
    } finally {
      setIsVoiceSearching(false);
    }
  };

  // Handle wishlist navigation
  const handleWishlistPress = () => {
    navigation.navigate('WishlistScreen' as never);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch items with force refresh
      if (selectedCategory) {
        const fetchedItems = await fetchItemsMemoized(selectedCategory, filters, true);
        setItems(fetchedItems);
        setProductCount(fetchedItems.length);
      }
      updateCategoryCounts();
    } catch (error) {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  };

  const {colors} = useTheme();

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    subContainer: {
      flex: 1,
      flexDirection: 'column',
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
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 12,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: RFValue(13),
      fontFamily: Fonts.Medium,
      color: colors.text,
      marginLeft: 8,
    },
    searchIconButton: {
      padding: 4,
    },
    searchDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    compareButton: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    compareBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#ff3040',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: '#fff',
    },
    filterSection: {
      backgroundColor: colors.background,
      paddingBottom: 8,
    },
  });

  return (
    <View style={styles.mainContainer}>
      <CustomHeader 
        title={getHeaderTitle()} 
        backgroundColor="#0d8320"
        titleColor="#fff"
        iconColor="#fff"
        rightComponent={
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <TouchableOpacity
              style={[styles.headerButton, {backgroundColor: 'rgba(255, 255, 255, 0.2)'}]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.7}>
              <Icon name="options-outline" color="#fff" size={RFValue(18)} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, {backgroundColor: 'rgba(255, 255, 255, 0.2)'}]}
              onPress={handleWishlistPress}
              activeOpacity={0.7}>
              <Icon name="heart-outline" color="#fff" size={RFValue(18)} />
            </TouchableOpacity>
          </View>
        }
      />
      <View style={styles.subContainer}>
        <View style={styles.contentContainer}>
          {/* Permanent Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" color={colors.text} size={RFValue(18)} />
            <TextInput
              style={styles.searchInput}
              placeholder={getSearchPlaceholder()}
              placeholderTextColor={colors.text + '80'}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => handleSearch('')}
                style={styles.searchIconButton}>
                <Icon 
                  name="close-circle" 
                  color={colors.text} 
                  size={RFValue(18)} 
                />
              </TouchableOpacity>
            )}
            <View style={styles.searchDivider} />
            <TouchableOpacity
              style={styles.searchIconButton}
              onPress={handleVoiceSearch}
              disabled={isVoiceSearching || !isVoiceSearchAvailable()}
              activeOpacity={0.7}>
              {isVoiceSearching ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Icon
                  name="mic"
                  color={isVoiceSearchAvailable() ? colors.text : colors.disabled}
                  size={RFValue(18)}
                />
              )}
            </TouchableOpacity>
          </View>

          {categoriesLoading ? (
            <View style={{height: 60, backgroundColor: colors.background}} />
          ) : visibleCategories.length > 1 ? (
            <CategoryTabs
              categories={visibleCategories}
              selectedCategory={selectedCategory}
              onCategoryPress={(category: ICategoryItem) => {
                setItemsLoading(true);
                setItems([]);
                setSelectedCategory(category);
              }}
              categoryCounts={categoryCounts}
            />
          ) : null}

          {/* ── Subcategory tabs (for service sections) ── */}
          {!categoriesLoading && currentSection && currentSection.subcategories.length > 0 && (
            <SubcategoryTabs
              subcategories={currentSection.subcategories}
              selectedId={selectedSubcategoryId}
              onSelect={setSelectedSubcategoryId}
            />
          )}

          {/* ── Package chips (Premium / Basic — for Vehicle Wash) ── */}
          {!categoriesLoading && currentSection?.hasPackages && (currentSection.packages ?? []).length > 0 && (
            <PackageChips
              label="Package"
              options={(currentSection.packages ?? []).map(p => ({value: p.value, label: p.label}))}
              selectedValue={selectedPackage}
              onSelect={setSelectedPackage}
            />
          )}

          {/* ── Delivery mode chips (Home / Store / Dealer Center) ── */}
          {!categoriesLoading && currentSection?.hasDeliveryModes && (currentSection.deliveryModes ?? []).length > 0 && (
            <PackageChips
              label="Service Mode"
              options={(currentSection.deliveryModes ?? []).map(d => ({value: d.value, label: d.label}))}
              selectedValue={selectedDeliveryMode}
              onSelect={setSelectedDeliveryMode}
            />
          )}

          {/* ── Spare Parts: Vehicle Type + Brand filter ── */}
          {!categoriesLoading && selectedCategory?.type === 'products' && (
            <View style={{paddingHorizontal: 16, paddingBottom: 4}}>
              {/* Vehicle type toggle */}
              <View style={{flexDirection: 'row', gap: 8, marginBottom: 6}}>
                {(['Car', 'Bike'] as const).map(vt => (
                  <TouchableOpacity
                    key={vt}
                    activeOpacity={0.75}
                    onPress={() => { setSparePartsVehicleType(vt); setSparePartsBrand(null); }}
                    style={{
                      paddingVertical: 5, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1,
                      backgroundColor: sparePartsVehicleType === vt ? Colors.secondary : colors.backgroundSecondary,
                      borderColor: sparePartsVehicleType === vt ? Colors.secondary : colors.border,
                    }}>
                    <CustomText
                      fontSize={RFValue(10)}
                      fontFamily={sparePartsVehicleType === vt ? Fonts.SemiBold : Fonts.Medium}
                      style={{color: sparePartsVehicleType === vt ? '#fff' : colors.text}}>
                      {vt}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Brand chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 6}}>
                {[{value: null, label: 'All Brands'}, ...SPARE_PARTS_BRANDS[sparePartsVehicleType].map(b => ({value: b, label: b}))].map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    activeOpacity={0.75}
                    onPress={() => setSparePartsBrand(opt.value)}
                    style={{
                      paddingVertical: 4, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1,
                      backgroundColor: sparePartsBrand === opt.value ? Colors.secondary + '18' : colors.backgroundSecondary,
                      borderColor: sparePartsBrand === opt.value ? Colors.secondary : colors.border,
                    }}>
                    <CustomText
                      fontSize={RFValue(9)}
                      fontFamily={sparePartsBrand === opt.value ? Fonts.SemiBold : Fonts.Regular}
                      style={{color: sparePartsBrand === opt.value ? Colors.secondary : colors.text}}>
                      {opt.label}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <View style={{paddingHorizontal: 16, paddingVertical: 8}}>
            <FilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
              typeLabel={getSelectedTypeLabel()}
              brandLabel={getSelectedBrandLabel()}
            />
          </View>

          {searchQuery.trim() !== '' && (
            <View style={{paddingHorizontal: 16, paddingVertical: 4}}>
              <CustomText variant="h8" fontFamily={Fonts.Medium} style={{opacity: 0.6}}>
                Showing {finalItems.length} results for "{searchQuery}"
              </CustomText>
            </View>
          )}
          
          {itemsLoading ? (
            <ProductList 
              data={[]} 
              itemType={selectedCategory?.type || 'products'}
              loading={true}
              viewMode={viewMode}
            />
          ) : (
            <>
              {finalItems.length === 0 ? (
                <EmptyState
                  hasSearchQuery={!!searchQuery.trim()}
                  searchQuery={searchQuery}
                  onClearFilters={handleClearAllFilters}
                  onClearSearch={() => handleSearch('')}
                />
              ) : (
              <ProductList 
                  data={finalItems || []} 
                itemType={selectedCategory?.type || 'products'}
                loading={false}
                  viewMode={viewMode}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
              />
              )}
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
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        onSelectSort={handleSortSelect}
        currentSort={currentSort}
      />
      
      {/* Compare Indicator Button */}
      {compareItems.length > 0 && (
        <TouchableOpacity
          style={[styles.compareButton, {backgroundColor: Colors.secondary}]}
          onPress={() => navigate('CompareScreen')}
          activeOpacity={0.8}>
          <Icon name="git-compare" color="#fff" size={RFValue(20)} />
          <View style={styles.compareBadge}>
            <CustomText
              fontSize={RFValue(10)}
              fontFamily={Fonts.Bold}
              style={{color: '#fff'}}>
              {compareItems.length}
            </CustomText>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProductCategories;
