import React, {FC, useRef, useEffect} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Image} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {screenWidth} from '@utils/Scaling';
import type {ICategoryItem} from '../../types/category/ICategoryItem';
import {useTheme} from '@hooks/useTheme';

interface CategoryTabsProps {
  selectedCategory: ICategoryItem | null;
  categories: ICategoryItem[];
  onCategoryPress: (category: ICategoryItem) => void;
  categoryCounts?: Record<string, number>;
}

const CategoryTabs: FC<CategoryTabsProps> = ({
  selectedCategory,
  categories,
  onCategoryPress,
  categoryCounts = {},
}) => {
  const {colors} = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const itemPositions = useRef<Record<number, number>>({});

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('all categories') || name.includes('all')) return 'apps';
    if (name.includes('product')) return 'cube';
    if (name.includes('vehicle') || name.includes('car')) return 'car-sport';
    if (name.includes('service')) return 'construct';
    if (name.includes('accessor')) return 'sparkles';
    return 'grid';
  };

  useEffect(() => {
    if (selectedCategory && scrollViewRef.current) {
      const selectedIndex = categories.findIndex(
        cat => cat._id === selectedCategory._id,
      );
      if (selectedIndex !== -1 && itemPositions.current[selectedIndex] !== undefined) {
        scrollViewRef.current.scrollTo({
          x: itemPositions.current[selectedIndex] - screenWidth * 0.1,
          animated: true,
        });
      }
    }
  }, [selectedCategory, categories]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 6,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    scrollView: {
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    categoryItem: {
      marginHorizontal: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.border,
      width: 130,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    },
    selectedCategoryItem: {
      backgroundColor: 'transparent',
      borderColor: Colors.secondary,
      shadowColor: Colors.secondary,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 4,
    },
    selectedIconContainer: {
      backgroundColor: 'transparent',
    },
    categoryImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      resizeMode: 'cover',
    },
    textContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    categoryName: {
      fontSize: RFValue(10),
      textAlign: 'center',
      marginBottom: 0,
      width: '100%',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}
        onLayout={() => {
          // Measure item positions for auto-scroll
        }}>
        {categories.map((category, index) => {
          const isSelected = selectedCategory?._id === category._id;
          const isAllCategories = category.name.toLowerCase().includes('all categories');
          const shouldShowGreenBackground = isSelected && !isAllCategories;

          return (
            <TouchableOpacity
              key={category._id || index}
              style={[
                styles.categoryItem,
                shouldShowGreenBackground && styles.selectedCategoryItem,
                isSelected && isAllCategories && {
                  borderColor: colors.border,
                },
              ]}
              onPress={() => onCategoryPress(category)}
              onLayout={event => {
                itemPositions.current[index] = event.nativeEvent.layout.x;
              }}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.iconContainer,
                  isSelected && styles.selectedIconContainer,
                ]}>
                {category?.image ? (
                  typeof category.image === 'number' ? (
                    <Image
                      source={category.image}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                  ) : typeof category.image === 'string' &&
                    category.image.trim() !== '' ? (
                    <Image
                      source={{uri: category.image}}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Icon
                      name={getCategoryIcon(category.name)}
                      size={RFValue(20)}
                      color={isSelected ? Colors.secondary : colors.text}
                    />
                  )
                ) : (
                  <Icon
                    name={getCategoryIcon(category.name)}
                    size={RFValue(16)}
                    color={isSelected ? Colors.secondary : colors.text}
                  />
                )}
              </View>

              <View style={styles.textContainer}>
                <CustomText
                  fontSize={RFValue(9)}
                  fontFamily={isSelected ? Fonts.SemiBold : Fonts.Medium}
                  numberOfLines={2}
                  style={[
                    styles.categoryName,
                    {
                      color: isSelected ? Colors.secondary : colors.text,
                    },
                  ]}>
                  {category.name}
                </CustomText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoryTabs;

