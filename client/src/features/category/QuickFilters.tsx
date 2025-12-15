import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';

export interface IQuickFilter {
  id: string;
  label: string;
  icon: string;
  filter: {
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  };
}

interface IQuickFiltersProps {
  onSelectFilter: (filter: IQuickFilter['filter']) => void;
  activeFilter?: IQuickFilter['filter'];
}

const quickFilters: IQuickFilter[] = [
  {
    id: 'under_1000',
    label: 'Under ₹1000',
    icon: 'pricetag-outline',
    filter: {maxPrice: 1000},
  },
  {
    id: 'under_5000',
    label: 'Under ₹5000',
    icon: 'pricetag-outline',
    filter: {maxPrice: 5000},
  },
  {
    id: 'new_arrivals',
    label: 'New Arrivals',
    icon: 'sparkles-outline',
    filter: {sort: 'newest'},
  },
  {
    id: 'best_deals',
    label: 'Best Deals',
    icon: 'flash-outline',
    filter: {sort: 'popularity'},
  },
  {
    id: 'top_rated',
    label: 'Top Rated',
    icon: 'star-outline',
    filter: {sort: 'popularity'},
  },
];

const QuickFilters: FC<IQuickFiltersProps> = ({onSelectFilter, activeFilter}) => {
  const {colors} = useTheme();

  const isFilterActive = (filter: IQuickFilter['filter']) => {
    if (filter.maxPrice && activeFilter?.maxPrice === filter.maxPrice) {
      return true;
    }
    if (filter.sort && activeFilter?.sort === filter.sort) {
      return true;
    }
    return false;
  };

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    scrollView: {
      flexDirection: 'row',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeFilterButton: {
      backgroundColor: Colors.secondary + '20',
      borderColor: Colors.secondary,
    },
    filterIcon: {
      marginRight: 6,
    },
    filterText: {
      fontSize: RFValue(11),
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}>
        {quickFilters.map(filter => {
          const isActive = isFilterActive(filter.filter);
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterButton, isActive && styles.activeFilterButton]}
              onPress={() => onSelectFilter(filter.filter)}
              activeOpacity={0.7}>
              <Icon
                name={filter.icon}
                color={isActive ? Colors.secondary : colors.text}
                size={RFValue(14)}
                style={styles.filterIcon}
              />
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={{
                  color: isActive ? Colors.secondary : colors.text,
                }}>
                {filter.label}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default QuickFilters;

