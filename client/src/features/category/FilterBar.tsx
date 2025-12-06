import {View, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';

interface IFilterBarProps {
  onFilterPress: () => void;
  onTypePress: () => void;
  onBrandPress: () => void;
  selectedType?: string;
  selectedBrand?: string;
}

const FilterBar: FC<IFilterBarProps> = ({
  onFilterPress,
  onTypePress,
  onBrandPress,
  selectedType,
  selectedBrand,
}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    filterButtonText: {
      marginLeft: 6,
      fontSize: RFValue(12),
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: selectedType || selectedBrand ? 1 : 0,
      borderColor: selectedType || selectedBrand ? colors.secondary : 'transparent',
    },
    dropdownButtonText: {
      marginRight: 4,
      fontSize: RFValue(12),
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onFilterPress}
        activeOpacity={0.7}>
        <Icon name="options-outline" color={colors.text} size={RFValue(18)} />
        <CustomText
          variant="h6"
          fontFamily={Fonts.Medium}
          style={[styles.filterButtonText, {color: colors.text}]}>
          Filter
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={onTypePress}
        activeOpacity={0.7}>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Medium}
          style={[styles.dropdownButtonText, {color: selectedType ? colors.secondary : colors.text}]}>
          {selectedType || 'Type'}
        </CustomText>
        <Icon
          name="chevron-down-outline"
          color={selectedType ? colors.secondary : colors.text}
          size={RFValue(14)}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={onBrandPress}
        activeOpacity={0.7}>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Medium}
          style={[styles.dropdownButtonText, {color: selectedBrand ? colors.secondary : colors.text}]}>
          {selectedBrand || 'Brand'}
        </CustomText>
        <Icon
          name="chevron-down-outline"
          color={selectedBrand ? colors.secondary : colors.text}
          size={RFValue(14)}
        />
      </TouchableOpacity>
    </View>
  );
};

export default FilterBar;

