import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import React, { FC } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
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
      imageSource: require('@assets/services/car_service_new.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'car-service',
    },
    {
      id: 'bike-service',
      label: 'Bike Service',
      imageSource: require('@assets/services/bike_service_new.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'bike-service',
    },
    {
      id: 'vehicle-wash',
      label: 'Vehicle Wash',
      imageSource: require('@assets/services/car_wash_new.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'vehicle-wash',
    },
    {
      id: 'tire-service',
      label: 'Tire Service',
      imageSource: require('@assets/services/tire_service_new.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'tire-service',
    },
    {
      id: 'ppf-detailing',
      label: 'PPF & Detailing',
      imageSource: require('@assets/services/ppf_detailing_new.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'ppf-detailing',
    },
    {
      id: 'spare-parts',
      label: 'Spare Parts',
      imageSource: require('@assets/services/spare_parts_new.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'products',
      categoryId: '69de8a197f4ddefdad034e5c',
    },
    {
      id: 'battery-service',
      label: 'Battery',
      imageSource: require('@assets/services/battery_service_new.png'),
      backgroundColor: colors.cardBackground || '#FFFFFF',
      textColor: colors.text || '#000000',
      categoryType: 'services',
      categoryId: 'battery-service',
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
    } else if (button.id === 'vehicle-wash') {
      params.serviceType = 'car_wash';
    } else if (button.id === 'tire-service') {
      params.serviceType = 'tire_service';
    } else if (button.id === 'battery-service') {
      params.serviceType = 'battery_service';
    } else if (button.id === 'ppf-detailing') {
      params.serviceType = 'car_detailing';
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
      ...fontStyle(Fonts.Bold),
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
