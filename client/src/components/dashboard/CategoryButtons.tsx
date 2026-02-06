import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import React, { FC } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { navigate } from '@utils/NavigationUtils';

interface CategoryButton {
  id: string;
  label: string;
  imageSource: ImageSourcePropType;
  backgroundColor: string;
  textColor: string;
  categoryType: 'products' | 'vehicles' | 'services';
  categoryId?: string;
}

const CategoryButtons: FC = () => {
  const { colors } = useTheme();

  const categoryButtons: CategoryButton[] = [
    {
      id: 'car-service',
      label: 'Car Service',
      imageSource: require('@assets/services/car_service.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'car-service',
    },
    {
      id: 'bike-service',
      label: 'Bike Service',
      imageSource: require('@assets/services/bike_service.jpg'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'bike-service',
    },
    {
      id: 'car-wash',
      label: 'Car Wash',
      imageSource: require('@assets/services/car_wash.jpg'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'car-wash',
    },
    {
      id: 'tire-service',
      label: 'Tire Service',
      imageSource: require('@assets/services/tier_service.jpg'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'all-services',
    },
    {
      id: 'battery-service',
      label: 'Battery',
      imageSource: require('@assets/services/batery_sevices.jpg'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'all-services',
    },
  ];

  const handleCategoryPress = (button: CategoryButton) => {
    const params: any = {
      initialCategoryId: button.categoryId || `all-${button.categoryType}`,
      initialCategoryType: button.categoryType,
    };
    
    // Add service type filter for specific service categories
    if (button.id === 'car-service') {
      params.serviceType = 'car_automobile';
      params.vehicleType = 'Car';
    } else if (button.id === 'bike-service') {
      params.serviceType = 'bike_automobile';
      params.vehicleType = 'Bike';
    } else if (button.id === 'car-wash') {
      params.serviceType = 'car_wash';
    }
    
    navigate('Category', {
      screen: 'ProductCategories',
      params,
    });
  };

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: 'transparent',
      overflow: 'visible',
      zIndex: 1,
    },
    scrollView: {
      paddingHorizontal: 5,
      paddingRight: 15,
    },
    button: {
      marginRight: 10,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      width: 85,
      height: 85,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      overflow: 'hidden',
    },
    buttonContent: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    iconContainer: {
      marginBottom: 4,
      justifyContent: 'center',
      alignItems: 'center',
      width: 50,
      height: 50,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 3,
    },
    serviceImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    label: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Bold,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}
        style={{overflow: 'visible'}}>
        {categoryButtons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={[
              styles.button,
              {
                backgroundColor: button.backgroundColor,
              },
            ]}
            onPress={() => handleCategoryPress(button)}
            activeOpacity={0.8}>
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Image
                  source={button.imageSource}
                  style={styles.serviceImage}
                  resizeMode="contain"
                />
              </View>
              <CustomText
                style={[styles.label, { color: button.textColor }]}
                numberOfLines={2}>
                {button.label}
              </CustomText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryButtons;
