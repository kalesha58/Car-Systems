import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {IFilterState} from './FilterModal';

interface IFilterChipsProps {
  filters: IFilterState;
  onRemoveFilter: (key: keyof IFilterState) => void;
  onClearAll: () => void;
  typeLabel?: string;
  brandLabel?: string;
}

const FilterChips: FC<IFilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  typeLabel,
  brandLabel,
}) => {
  const {colors} = useTheme();

  const hasActiveFilters =
    filters.type || filters.brand || filters.minPrice !== undefined || filters.maxPrice !== undefined;

  if (!hasActiveFilters) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 0,
      paddingVertical: 10,
      backgroundColor: 'transparent',
      gap: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: Colors.secondary + '10',
    },
    chipText: {
      fontSize: RFValue(11),
      marginRight: 6,
      color: Colors.secondary,
    },
    clearAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
    },
    clearAllText: {
      fontSize: RFValue(11),
      marginRight: 4,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      {filters.type && typeLabel && (
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onRemoveFilter('type')}
          activeOpacity={0.7}>
          <CustomText
            variant="h7"
            fontFamily={Fonts.Medium}
            style={[styles.chipText, {color: Colors.secondary}]}>
            Type: {typeLabel}
          </CustomText>
          <Icon name="close-circle" color={Colors.secondary} size={RFValue(16)} />
        </TouchableOpacity>
      )}

      {filters.brand && brandLabel && (
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onRemoveFilter('brand')}
          activeOpacity={0.7}>
          <CustomText
            variant="h7"
            fontFamily={Fonts.Medium}
            style={[styles.chipText, {color: Colors.secondary}]}>
            Brand: {brandLabel}
          </CustomText>
          <Icon name="close-circle" color={Colors.secondary} size={RFValue(16)} />
        </TouchableOpacity>
      )}

      {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
        <TouchableOpacity
          style={styles.chip}
          onPress={() => {
            onRemoveFilter('minPrice');
            onRemoveFilter('maxPrice');
          }}
          activeOpacity={0.7}>
          <CustomText
            variant="h7"
            fontFamily={Fonts.Medium}
            style={[styles.chipText, {color: Colors.secondary}]}>
            Price: ₹{filters.minPrice || 0} - ₹{filters.maxPrice || '∞'}
          </CustomText>
          <Icon name="close-circle" color={Colors.secondary} size={RFValue(16)} />
        </TouchableOpacity>
      )}

      {hasActiveFilters && (
        <TouchableOpacity
          style={styles.clearAllButton}
          onPress={onClearAll}
          activeOpacity={0.7}>
          <CustomText
            variant="h7"
            fontFamily={Fonts.Medium}
            style={[styles.clearAllText, {color: colors.text}]}>
            Clear All
          </CustomText>
          <Icon name="close" color={colors.text} size={RFValue(14)} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default FilterChips;

