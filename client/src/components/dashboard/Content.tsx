import { View, Text, StyleSheet } from 'react-native'
import React, { FC, useMemo } from 'react'
import { categories } from '@utils/dummyData'
import { Fonts } from '@utils/Constants'
import CustomText from '@components/ui/CustomText'
import CategoryContainer from './CategoryContainer'
import { useTheme } from '@hooks/useTheme'
import TopProductsSection from './TopProductsSection'

const Content: FC = () => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background
    },
    section: {
      paddingHorizontal: 20,
    }
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

  const bestsellersCategories = useMemo(() => {
    return categories.filter(cat => [1, 2, 3, 5, 6, 7, 10, 11, 12].includes(cat.id)).slice(0, 8);
  }, []);

  return (
    <View style={styles.container}>
      <TopProductsSection />
      <View style={styles.section}>
        <CustomText variant='h5' fontFamily={Fonts.SemiBold} style={{ marginTop: 20, marginBottom: 10 }}>Product Categories</CustomText>
        <CategoryContainer data={productsCategories} />
        <CustomText variant='h5' fontFamily={Fonts.SemiBold} style={{ marginTop: 20, marginBottom: 10 }}>Bestseller Categories</CustomText>
        <CategoryContainer data={bestsellersCategories} />
        <CustomText variant='h5' fontFamily={Fonts.SemiBold} style={{ marginTop: 20, marginBottom: 10 }}>Vehicle Categories</CustomText>
        <CategoryContainer data={vehiclesCategories} />
        <CustomText variant='h5' fontFamily={Fonts.SemiBold} style={{ marginTop: 20, marginBottom: 10 }}>Service Categories</CustomText>
        <CategoryContainer data={servicesCategories} />
      </View>
    </View>
  )
}

export default Content