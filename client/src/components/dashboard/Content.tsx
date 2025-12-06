import { View, Text, StyleSheet } from 'react-native'
import React, { FC, useMemo } from 'react'
import { adData, categories } from '@utils/dummyData'
import AdCarousal from './AdCarousal'
import { Fonts } from '@utils/Constants'
import CustomText from '@components/ui/CustomText'
import CategoryContainer from './CategoryContainer'
import { useTheme } from '@hooks/useTheme'

const Content:FC = () => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container:{
        paddingHorizontal:20,
        backgroundColor: colors.background
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
      <AdCarousal adData={adData} />
      <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Products</CustomText>
      <CategoryContainer data={productsCategories} />
      <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Bestsellers</CustomText>
      <CategoryContainer data={bestsellersCategories} />
      <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Vehicles</CustomText>
      <CategoryContainer data={vehiclesCategories} />
      <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Services</CustomText>
      <CategoryContainer data={servicesCategories} />
    </View>
  )
}

export default Content