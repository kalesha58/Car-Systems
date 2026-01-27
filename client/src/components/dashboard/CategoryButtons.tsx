import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { navigate } from '@utils/NavigationUtils';

interface CategoryButton {
  id: string;
  label: string;
  icon: string;
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
      icon: 'car-sport',
      backgroundColor: '#FFD700', // Yellow like "Pay" button
      textColor: '#000000',
      categoryType: 'services',
      categoryId: 'all-services',
    },
    {
      id: 'bike-service',
      label: 'Bike Service',
      icon: 'bicycle',
      backgroundColor: '#90EE90', // Light Green like "Fresh" button
      textColor: '#000000',
      categoryType: 'services',
      categoryId: 'all-services',
    },
    {
      id: 'car-wash',
      label: 'Car Wash',
      icon: 'water',
      backgroundColor: '#87CEEB', // Sky Blue like "MX Player" button
      textColor: '#000000',
      categoryType: 'services',
      categoryId: 'all-services',
    },
    {
      id: 'tire-service',
      label: 'Tire Service',
      icon: 'disc',
      backgroundColor: '#FFB6C1', // Light Pink like "Bazaar" button
      textColor: '#000000',
      categoryType: 'services',
      categoryId: 'all-services',
    },
    {
      id: 'battery-service',
      label: 'Battery',
      icon: 'battery-charging',
      backgroundColor: '#F0E68C', // Light Green/Cream like "Pharmacy" button
      textColor: '#000000',
      categoryType: 'services',
      categoryId: 'all-services',
    },
  ];

  const handleCategoryPress = (button: CategoryButton) => {
    navigate('Category', {
      screen: 'ProductCategories',
      params: {
        initialCategoryId: button.categoryId || `all-${button.categoryType}`,
        initialCategoryType: button.categoryType,
      },
    });
  };

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: 'transparent',
    },
    scrollView: {
      paddingHorizontal: 5,
    },
    button: {
      marginRight: 10,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      width: 85,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    buttonContent: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    iconContainer: {
      marginBottom: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: RFValue(10),
      fontFamily: Fonts.SemiBold,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}>
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
                <Icon
                  name={button.icon}
                  size={RFValue(28)}
                  color={button.textColor}
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
