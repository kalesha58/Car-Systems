import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import React, { FC, useEffect, useMemo, useState } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { navigate } from '@utils/NavigationUtils';
import { useTranslation } from 'react-i18next';
import { buildServiceNavigationParams } from '../../config/serviceCategoryConfig';
import { getDropdownOptions } from '@service/dropdownService';

interface CategoryButton {
  id: string;
  label: string;
  imageSource: ImageSourcePropType;
  backgroundColor: string;
  textColor: string;
  categoryType: 'products' | 'vehicles' | 'services';
  categoryId?: string;
}

const isSparePartsLabel = (label: string) => /^spare\s*parts$/i.test(label.trim());

const CategoryButtons: FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [sparePartsCategoryId, setSparePartsCategoryId] = useState<string | undefined>();

  useEffect(() => {
    const loadSparePartsCategory = async () => {
      try {
        const dropdown = await getDropdownOptions();
        const spareParts = dropdown.categories?.find(c => isSparePartsLabel(c.label));
        if (spareParts?.value) {
          setSparePartsCategoryId(spareParts.value);
        }
      } catch {
        setSparePartsCategoryId(undefined);
      }
    };
    loadSparePartsCategory();
  }, []);

  const categoryButtons: CategoryButton[] = useMemo(
    () => [
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
        id: 'test-drive-request',
        label: t('store.testDriveRequest'),
        imageSource: require('@assets/images/All-Vehicles.jpeg'),
        backgroundColor: colors.cardBackground || '#FFFFFF',
        textColor: colors.text || '#000000',
        categoryType: 'vehicles',
        categoryId: 'all-vehicles',
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
        categoryId: sparePartsCategoryId,
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
    ],
    [colors.cardBackground, colors.text, sparePartsCategoryId, t],
  );

  const handleCategoryPress = (button: CategoryButton) => {
    if (button.id === 'test-drive-request') {
      navigate('Category', {
        screen: 'ProductCategories',
        params: {
          initialCategoryId: 'all-vehicles',
          initialCategoryType: 'vehicles',
          allowTestDriveOnly: true,
          screenTitle: t('store.testDriveRequestTitle'),
        },
      });
      return;
    }

    if (button.categoryType === 'services' && button.categoryId) {
      navigate('Category', {
        screen: 'ProductCategories',
        params: buildServiceNavigationParams(button.categoryId),
      });
      return;
    }

    if (button.categoryType === 'products' && button.categoryId) {
      navigate('Category', {
        screen: 'ProductCategories',
        params: {
          initialCategoryId: button.categoryId,
          initialCategoryType: 'products',
        },
      });
      return;
    }

    navigate('Category', {
      screen: 'ProductCategories',
      params: {
        initialCategoryId: `all-${button.categoryType}`,
        initialCategoryType: button.categoryType,
      },
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
            activeOpacity={0.8}
            disabled={button.id === 'spare-parts' && !button.categoryId}>
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
