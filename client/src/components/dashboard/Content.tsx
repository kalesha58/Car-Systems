import { View, StyleSheet, TouchableOpacity } from 'react-native'
import React, { FC, useMemo } from 'react'
import { categories } from '@utils/dummyData'
import { Fonts } from '@utils/Constants'
import CustomText from '@components/ui/CustomText'
import CompactCategoryContainer from './CompactCategoryContainer'
import CompactProductGrid from './CompactProductGrid'
import { useTheme } from '@hooks/useTheme'
import TopProductsSection from './TopProductsSection'
import { navigate } from '@utils/NavigationUtils'

const Content: FC = () => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background
    },
    section: {
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 15,
      marginBottom: 8,
    },
    viewAllButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    viewAllText: {
      color: colors.secondary,
      fontSize: 14,
    },
  });

  const productsCategories = useMemo(() => {
    return categories.filter(cat => [1, 2, 3, 4].includes(cat.id));
  }, []);

  const vehiclesCategories = useMemo(() => {
    return categories.filter(cat => [4, 5, 6, 7, 8].includes(cat.id));
  }, []);

  const servicesCategories = useMemo(() => {
    return categories.filter(cat => [9, 10, 11, 12].includes(cat.id));
  }, []);

  const handleNavigateToCategory = (
    initialCategoryId: string,
    initialCategoryType: string,
    sortBy?: string
  ) => {
    navigate('Category', {
      screen: 'ProductCategories',
      params: {
        initialCategoryId,
        initialCategoryType,
        sortBy
      }
    });
  };

  return (
    <View style={styles.container}>
      <TopProductsSection />
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Product Categories</CustomText>
        </View>
        <CompactCategoryContainer data={productsCategories} categoryType="products" />

        <View style={styles.sectionHeader}>
          <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Best Sellers</CustomText>
        </View>
        <CompactProductGrid />

        <View style={styles.sectionHeader}>
          <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Vehicle Categories</CustomText>
        </View>
        <CompactCategoryContainer data={vehiclesCategories} categoryType="vehicles" />

        <View style={styles.sectionHeader}>
          <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Service Categories</CustomText>
        </View>
        <CompactCategoryContainer data={servicesCategories} categoryType="services" />
      </View>
    </View>
  )
}

export default Content