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
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getDropdownOptions, IDropdownOption} from '@service/dropdownService';
import PriceRangeSlider from '@components/ui/PriceRangeSlider';

type FilterCategory = 'Type' | 'Brand' | 'Price';

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
}

const FilterModal: FC<IFilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters,
  productCount = 0,
}) => {
  const {colors} = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('Type');
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: screenHeight * 0.75,
      overflow: 'hidden',
    },
    modalContent: {
      flexDirection: 'row',
      height: screenHeight * 0.5,
    },
    leftPanel: {
      width: '32%',
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingRight: 8,
      height: '100%',
    },
    rightPanel: {
      flex: 1,
      paddingLeft: 12,
      paddingRight: 12,
      height: '100%',
    },
    categoryItem: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      marginBottom: 2,
      borderRadius: 6,
    },
    categoryItemSelected: {
      backgroundColor: colors.backgroundSecondary,
    },
    categoryText: {
      fontSize: RFValue(11),
    },
    modalHeader: {
      paddingHorizontal: 12,
      paddingTop: 16,
      paddingBottom: 12,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 10,
    },
    optionItem: {
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioSelected: {
      borderWidth: 1.5,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    optionText: {
      fontSize: RFValue(11),
    },
    priceContainer: {
      paddingVertical: 12,
    },
    priceTitle: {
      marginBottom: 8,
      fontSize: RFValue(12),
    },
    priceRangeText: {
      marginBottom: 20,
      fontSize: RFValue(11),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
      minHeight: 200,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
      minHeight: 200,
    },
    emptyText: {
      fontSize: RFValue(12),
      textAlign: 'center',
    },
    actionButtonsContainer: {
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    clearButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1.5,
      borderColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      color: colors.secondary,
      fontSize: RFValue(13),
    },
    applyButtonText: {
      color: colors.white,
      fontSize: RFValue(13),
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
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Icon
                    name="close"
                    color={colors.text}
                    size={RFValue(16)}
                  />
                </TouchableOpacity>
                <CustomText
                  variant="h4"
                  fontFamily={Fonts.SemiBold}
                  style={{color: colors.text}}>
                  Filters
                </CustomText>
              </View>

              <View style={styles.modalContent}>
                <View style={styles.leftPanel}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingTop: 8}}>
                    {(['Type', 'Brand', 'Price'] as FilterCategory[]).map(category => {
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
                            fontFamily={isSelected ? Fonts.SemiBold : Fonts.Medium}
                            style={[
                              styles.categoryText,
                              {color: isSelected ? colors.secondary : colors.text},
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
                    contentContainerStyle={{paddingBottom: 16, flexGrow: 1}}>
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
                    <CustomText
                      variant="h6"
                      fontFamily={Fonts.SemiBold}
                      style={styles.clearButtonText}>
                      Clear all
                    </CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                    activeOpacity={0.8}>
                    <CustomText
                      variant="h6"
                      fontFamily={Fonts.SemiBold}
                      style={styles.applyButtonText}>
                      Show {productCount} products
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

