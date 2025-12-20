import {View, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Alert} from 'react-native';
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import {useRoute} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Sidebar from './Sidebar';
import SidebarSkeleton from './SidebarSkeleton';
import CategoryTabs from './CategoryTabs';
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
import {startVoiceSearch, isVoiceSearchAvailable} from '@utils/voiceSearch';
import {shareCategory} from '@utils/shareUtils';
import {useToast} from '@hooks/useToast';
import {navigate} from '@utils/NavigationUtils';

type ItemType = IProduct | IDealerVehicle | IService;

const allProductsImage = require('@assets/images/AutoMobile-Services.jpeg');
const allVehiclesImage = require('@assets/images/All-Vehicles.jpeg');
const allServicesImage = require('@assets/images/AutoMobile-Services.jpeg');

const ProductCategories = () => {
  const route = useRoute();
  const routeParams = route.params as {
    initialCategoryId?: string;
    initialCategoryType?: CategoryType;
    sortBy?: string;
  } | undefined;
  
  const {t} = useTranslation();
  const {showError, showSuccess} = useToast();
  const {addSearch} = useRecentSearchesStore();
  const {items: compareItems} = useCompareStore();
  const [categories, setCategories] = useState<ICategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategoryItem | null>(null);
  const [items, setItems] = useState<ItemType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);
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
  }, [routeParams, categories, categoriesLoading]);

  // Update category counts
  const updateCategoryCounts = useCallback(async () => {
    try {
      const counts: Record<string, number> = {};
      for (const category of categories) {
        try {
          if (category.type === 'products') {
            const response = await getProducts(
              category._id !== 'all-products' ? {category: category.name} : {},
            ).catch(() => ({Response: {products: []}}));
            counts[category._id] = response.Response?.products?.length || 0;
          } else if (category.type === 'vehicles') {
            console.log('[Category Counts] Fetching vehicle count for:', category._id);
            const response = await getDealerVehicles({limit: 1000}).catch((err) => {
              console.error('[Category Counts] Error fetching vehicles:', err);
              return {Response: {vehicles: []}};
            });
            counts[category._id] = response.Response?.vehicles?.length || 0;
            console.log('[Category Counts] Vehicle count for', category._id, ':', counts[category._id]);
          } else if (category.type === 'services') {
            const response = await getServices().catch(() => ({Response: {services: []}}));
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
        const response = await getProducts(queryParams);
        fetchedItems = response.Response?.products || [];
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
    } catch (error) {
      console.error(`[${categoryType}] Error fetching items for category ${category._id}:`, error);
      // Return cached data if available, even if expired
      const cached = apiCacheRef.current.get(cacheKey);
      if (cached) {
        console.log(`[${categoryType}] Using cached data for category:`, category._id);
        return cached.data;
      }
      console.warn(`[${categoryType}] No cached data available, returning empty array for category:`, category._id);
      return [];
    }
  }, []);

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
  }, [selectedCategory?._id]);

  // Sort items based on current sort option
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

  // Handle share category
  const handleShareCategory = async () => {
    if (selectedCategory) {
      await shareCategory(selectedCategory.name);
    }
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
    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButton: {
      padding: 4,
    },
    compareButton: {
      position: 'absolute',
      bottom: 20,
      left: 20,
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
  });

  return (
    <View style={styles.mainContainer}>
      <CustomHeader 
        title={getHeaderTitle()} 
        search 
        onSearchPress={handleSearchPress}
        rightComponent={
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
            <TouchableOpacity
              style={[styles.headerButton, {backgroundColor: colors.backgroundSecondary}]}
              onPress={() => setSortModalVisible(true)}
              activeOpacity={0.7}>
              <Icon name="swap-vertical-outline" color={colors.text} size={RFValue(18)} />
            </TouchableOpacity>
            {selectedCategory && (
              <TouchableOpacity
                style={[styles.headerButton, {backgroundColor: colors.backgroundSecondary}]}
                onPress={handleShareCategory}
                activeOpacity={0.7}>
                <Icon name="share-outline" color={colors.text} size={RFValue(18)} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSearchPress}
              activeOpacity={0.7}>
              <Icon name="search" color={colors.text} size={RFValue(20)} />
            </TouchableOpacity>
          </View>
        }
      />
      <View style={styles.subContainer}>
        <View style={styles.contentContainer}>
        {categoriesLoading ? (
            <View style={{height: 60, backgroundColor: colors.cardBackground}} />
        ) : (
            <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryPress={(category: ICategoryItem) => setSelectedCategory(category)}
              categoryCounts={categoryCounts}
          />
        )}

          <Breadcrumbs
            category={selectedCategory}
            onCategoryPress={() => setSelectedCategory(categories[0])}
          />
          
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
                      size={RFValue(20)}
                    />
                  )}
                </TouchableOpacity>
              </View>
              {!searchQuery.trim() && (
                <>
                  <RecentSearches
                    onSelectSearch={handleSelectSearch}
                    visible={true}
                  />
                  <Suggestions
                    onSelectSuggestion={handleSelectSearch}
                    visible={true}
                  />
                </>
              )}
              {searchQuery.trim() && (
                <View style={styles.searchResultsInfo}>
                  <CustomText variant="h7" fontFamily={Fonts.Medium} style={{opacity: 0.7}}>
                    {sortedItems.length} {sortedItems.length === 1 ? 'result' : 'results'} found
                    {selectedCategory?.name && ` in ${selectedCategory.name}`}
                  </CustomText>
                </View>
              )}
            </View>
          )}
          
          <QuickFilters
            onSelectFilter={handleQuickFilter}
            activeFilter={{...filters, sort: currentSort}}
          />
          
          <FilterBar
            onFilterPress={handleFilterPress}
            onTypePress={handleTypePress}
            onBrandPress={handleBrandPress}
            selectedType={getSelectedTypeLabel()}
            selectedBrand={getSelectedBrandLabel()}
          />
          
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            typeLabel={getSelectedTypeLabel()}
            brandLabel={getSelectedBrandLabel()}
          />
          
          {itemsLoading ? (
            <ProductList 
              data={[]} 
              itemType={selectedCategory?.type || 'products'}
              loading={true}
              viewMode={viewMode}
            />
          ) : (
            <>
              {sortedItems.length === 0 ? (
                <EmptyState
                  hasSearchQuery={!!searchQuery.trim()}
                  searchQuery={searchQuery}
                  onClearFilters={handleClearAllFilters}
                  onClearSearch={() => handleSearch('')}
                />
              ) : (
              <ProductList 
                  data={sortedItems || []} 
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
