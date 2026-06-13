import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, {FC, useState, useEffect} from 'react';
import {screenHeight} from '@utils/Scaling';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getDropdownOptions, IDropdownOption} from '@service/dropdownService';
import PriceRangeSlider from '@components/ui/PriceRangeSlider';

type FilterCategory = 'Sort' | 'Type' | 'Brand' | 'Price';

interface IFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: IFilterState) => void;
  initialFilters?: IFilterState;
  productCount?: number;
}

export interface IFilterState {
  type?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  allowTestDrive?: boolean;
}

const FilterModal: FC<IFilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters,
  productCount = 0,
}) => {
  const {colors} = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('Sort');
  const [dropdownOptions, setDropdownOptions] = useState<{
    vehicleTypes: IDropdownOption[];
    brands: IDropdownOption[];
  }>({
    vehicleTypes: [],
    brands: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<IFilterState>(initialFilters || {});
  const [priceRange, setPriceRange] = useState<{min: number; max: number}>({
    min: 0,
    max: 1000000,
  });

  useEffect(() => {
    if (visible) {
      fetchDropdownOptions();
      if (initialFilters) {
        setFilters(initialFilters);
        if (initialFilters.minPrice !== undefined && initialFilters.maxPrice !== undefined) {
          setPriceRange({
            min: initialFilters.minPrice,
            max: initialFilters.maxPrice,
          });
        }
      }
    }
  }, [visible]);

  const fetchDropdownOptions = async () => {
    try {
      setLoading(true);
      const options = await getDropdownOptions();
      console.log('Dropdown options fetched:', {
        vehicleTypes: options.vehicleTypes?.length || 0,
        brands: options.brands?.length || 0,
      });
      setDropdownOptions({
        vehicleTypes: options.vehicleTypes || [],
        brands: options.brands || [],
      });
      
      if (options.vehicleTypes.length > 0 || options.brands.length > 0) {
        const prices = [0, 1000000];
        setPriceRange({
          min: prices[0],
          max: prices[1],
        });
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSelect = (value: string) => {
    if (selectedCategory === 'Type') {
      setFilters(prev => ({
        ...prev,
        type: prev.type === value ? undefined : value,
      }));
    } else if (selectedCategory === 'Brand') {
      setFilters(prev => ({
        ...prev,
        brand: prev.brand === value ? undefined : value,
      }));
    }
  };

  const handlePriceChange = (min: number, max: number) => {
    setPriceRange({min, max});
    setFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
    }));
  };

  const handleClearAll = () => {
    setFilters({});
    setPriceRange({min: 0, max: 1000000});
  };

  const handleApply = () => {
    const finalFilters: IFilterState = {
      ...filters,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    };
    onApplyFilters(finalFilters);
    onClose();
  };

  const renderFilterOptions = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.secondary} />
        </View>
      );
    }
    if (selectedCategory === 'Sort') {
      const sortOptions = [
        {label: 'New Arrivals', value: 'newest', icon: 'sparkles-outline'},
        {label: 'Best Deals', value: 'popularity', icon: 'flash-outline'},
        {label: 'Top Rated', value: 'top_rated', icon: 'star-outline'},
        {label: 'Price: Low to High', value: 'price_low_high', icon: 'trending-up-outline'},
        {label: 'Price: High to Low', value: 'price_high_low', icon: 'trending-down-outline'},
      ];

      return (
        <View>
          {sortOptions.map(option => {
            const isSelected = filters.sort === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => setFilters(prev => ({...prev, sort: option.value}))}
                activeOpacity={0.7}>
                <View style={styles.radioContainer}>
                  <Icon 
                    name={option.icon} 
                    color={isSelected ? colors.secondary : colors.textSecondary} 
                    size={RFValue(16)} 
                    style={{marginRight: 10}}
                  />
                  <CustomText
                    variant="h6"
                    fontFamily={Fonts.Medium}
                    style={[styles.optionText, {color: isSelected ? colors.secondary : colors.text}]}>
                    {option.label}
                  </CustomText>
                  {isSelected && (
                    <Icon 
                      name="checkmark-circle" 
                      color={colors.secondary} 
                      size={RFValue(18)} 
                      style={{marginLeft: 'auto'}}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (selectedCategory === 'Type') {
      if (dropdownOptions.vehicleTypes.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <CustomText
              variant="h6"
              fontFamily={Fonts.Medium}
              style={[styles.emptyText, {color: colors.textSecondary}]}>
              No vehicle types available
            </CustomText>
          </View>
        );
      }
      return (
        <View>
          {dropdownOptions.vehicleTypes.map(option => {
            const isSelected = filters.type === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => handleFilterSelect(option.value)}
                activeOpacity={0.7}>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radio,
                      isSelected && styles.radioSelected,
                      {borderColor: isSelected ? colors.secondary : colors.border},
                    ]}>
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          {backgroundColor: colors.secondary},
                        ]}
                      />
                    )}
                  </View>
                  <CustomText
                    variant="h6"
                    fontFamily={Fonts.Medium}
                    style={[styles.optionText, {color: colors.text}]}>
                    {option.label}
                  </CustomText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (selectedCategory === 'Brand') {
      if (dropdownOptions.brands.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <CustomText
              variant="h6"
              fontFamily={Fonts.Medium}
              style={[styles.emptyText, {color: colors.textSecondary}]}>
              No brands available
            </CustomText>
          </View>
        );
      }
      return (
        <View>
          {dropdownOptions.brands.map(option => {
            const isSelected = filters.brand === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => handleFilterSelect(option.value)}
                activeOpacity={0.7}>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radio,
                      isSelected && styles.radioSelected,
                      {borderColor: isSelected ? colors.secondary : colors.border},
                    ]}>
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          {backgroundColor: colors.secondary},
                        ]}
                      />
                    )}
                  </View>
                  <CustomText
                    variant="h6"
                    fontFamily={Fonts.Medium}
                    style={[styles.optionText, {color: colors.text}]}>
                    {option.label}
                  </CustomText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (selectedCategory === 'Price') {
      return (
        <View style={styles.priceContainer}>
          <CustomText
            variant="h5"
            fontFamily={Fonts.SemiBold}
            style={[styles.priceTitle, {color: colors.text}]}>
            Select Price Range
          </CustomText>
          <CustomText
            variant="h6"
            fontFamily={Fonts.Medium}
            style={[styles.priceRangeText, {color: colors.textSecondary}]}>
            ₹{priceRange.min} - ₹{priceRange.max}
          </CustomText>
          <PriceRangeSlider
            minValue={0}
            maxValue={1000000}
            initialMin={priceRange.min}
            initialMax={priceRange.max}
            onValueChange={handlePriceChange}
          />
        </View>
      );
    }

    return null;
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: screenHeight * 0.8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -10},
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 20,
    },
    modalHeader: {
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '50',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      flexDirection: 'row',
      height: screenHeight * 0.55,
    },
    leftPanel: {
      width: '30%',
      backgroundColor: colors.backgroundSecondary + '50',
      paddingTop: 10,
    },
    rightPanel: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    categoryItem: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
    },
    categoryItemSelected: {
      backgroundColor: colors.cardBackground,
      borderLeftColor: colors.secondary,
    },
    categoryText: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
    },
    categoryTextSelected: {
      color: colors.secondary,
      ...fontStyle(Fonts.Bold),
    },
    optionItem: {
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      fontSize: RFValue(12),
      flex: 1,
    },
    priceContainer: {
      paddingVertical: 20,
    },
    priceTitle: {
      marginBottom: 10,
      fontSize: RFValue(14),
    },
    priceRangeText: {
      marginBottom: 30,
      fontSize: RFValue(13),
      color: colors.secondary,
    },
    actionButtonsContainer: {
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderTopColor: colors.border + '50',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    clearButton: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButton: {
      flex: 2,
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.secondary,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    clearButtonText: {
      color: colors.text,
      fontSize: RFValue(13),
      ...fontStyle(Fonts.SemiBold),
    },
    applyButtonText: {
      color: '#fff',
      fontSize: RFValue(13),
      ...fontStyle(Fonts.Bold),
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <CustomText
                  variant="h4"
                  fontFamily={Fonts.Bold}
                  style={{color: colors.text}}>
                  Filters
                </CustomText>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Icon
                    name="close"
                    color={colors.text}
                    size={RFValue(18)}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <View style={styles.leftPanel}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingTop: 8}}>
                    {(['Sort', 'Type', 'Brand', 'Price'] as FilterCategory[]).map(category => {
                      const isSelected = selectedCategory === category;
                      return (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryItem,
                            isSelected && styles.categoryItemSelected,
                          ]}
                          onPress={() => setSelectedCategory(category)}
                          activeOpacity={0.7}>
                          <CustomText
                            variant="h6"
                            style={[
                              styles.categoryText,
                              isSelected && styles.categoryTextSelected,
                            ]}>
                            {category}
                          </CustomText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.rightPanel}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingBottom: 20, flexGrow: 1}}>
                    {renderFilterOptions()}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.actionButtonsContainer}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearAll}
                    activeOpacity={0.8}>
                    <CustomText style={styles.clearButtonText}>
                      Reset
                    </CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                    activeOpacity={0.8}>
                    <CustomText style={styles.applyButtonText}>
                      Show {productCount} results
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default FilterModal;

