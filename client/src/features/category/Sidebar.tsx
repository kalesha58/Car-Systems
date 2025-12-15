import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, {FC, useEffect, useRef} from 'react';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {screenWidth, screenHeight} from '@utils/Scaling';
import type {ICategoryItem} from '../../types/category/ICategoryItem';
import type {SharedValue} from 'react-native-reanimated';
import {useTheme} from '@hooks/useTheme';

interface SidebarProps {
  selectedCategory: ICategoryItem | null;
  categories: ICategoryItem[];
  onCategoryPress: (category: ICategoryItem) => void;
  categoryCounts?: Record<string, number>;
}

interface CategoryItemProps {
  category: ICategoryItem;
  index: number;
  isSelected: boolean;
  animatedValue: SharedValue<number>;
  onPress: () => void;
  categoryCounts?: Record<string, number>;
}

const CategoryItem: FC<CategoryItemProps> = ({
  category,
  index,
  isSelected,
  animatedValue,
  onPress,
  categoryCounts = {},
}) => {
  const {colors} = useTheme();
  const scale = useSharedValue(isSelected ? 1.1 : 1);
  const opacity = useSharedValue(isSelected ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.1 : 1, {damping: 15});
    opacity.value = withTiming(isSelected ? 1 : 0.7, {duration: 200});
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('all categories') || name.includes('all')) return 'apps';
    if (name.includes('product')) return 'cube';
    if (name.includes('vehicle') || name.includes('car')) return 'car-sport';
    if (name.includes('service')) return 'construct';
    if (name.includes('accessor')) return 'sparkles';
    return 'grid';
  };

  const itemStyles = StyleSheet.create({
    categoryButton: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginVertical: 4,
      marginHorizontal: 6,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      minHeight: 90,
      backgroundColor: isSelected ? Colors.secondary + '15' : 'transparent',
      borderWidth: isSelected ? 2 : 0,
      borderColor: isSelected ? Colors.secondary : 'transparent',
      shadowColor: isSelected ? Colors.secondary : '#000',
      shadowOffset: {width: 0, height: isSelected ? 4 : 2},
      shadowOpacity: isSelected ? 0.3 : 0.1,
      shadowRadius: isSelected ? 8 : 4,
      elevation: isSelected ? 6 : 2,
    },
    imageContainer: {
      width: screenWidth * 0.12,
      height: screenWidth * 0.12,
      borderRadius: screenWidth * 0.06,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isSelected
        ? Colors.secondary + '25'
        : colors.backgroundSecondary,
      marginBottom: 8,
      overflow: 'hidden',
      borderWidth: isSelected ? 2 : 0,
      borderColor: Colors.secondary,
    },
    image: {
      width: '85%',
      height: '85%',
      resizeMode: 'contain',
    },
    iconContainer: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      alignItems: 'center',
      width: '100%',
    },
    categoryName: {
      fontSize: RFValue(9),
      textAlign: 'center',
      marginBottom: 4,
      maxWidth: '100%',
    },
    countBadge: {
      minWidth: 24,
      height: 20,
      borderRadius: 10,
      backgroundColor: isSelected ? Colors.secondary : colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: isSelected ? 1 : 0,
      borderColor: Colors.secondary,
    },
    countText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Bold,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={itemStyles.categoryButton}
      onPress={onPress}>
      <Animated.View style={[itemStyles.imageContainer, animatedStyle]}>
        {category?.image ? (
          typeof category.image === 'number' ? (
            <Animated.Image
              source={category.image}
              style={itemStyles.image}
              resizeMode="contain"
            />
          ) : typeof category.image === 'string' && category.image.trim() !== '' ? (
            <Animated.Image
              source={{uri: category.image}}
              style={itemStyles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={itemStyles.iconContainer}>
              <Icon
                name={getCategoryIcon(category.name)}
                size={RFValue(24)}
                color={isSelected ? Colors.secondary : colors.text}
              />
            </View>
          )
        ) : (
          <View style={itemStyles.iconContainer}>
            <Icon
              name={getCategoryIcon(category.name)}
              size={RFValue(24)}
              color={isSelected ? Colors.secondary : colors.text}
            />
          </View>
        )}
      </Animated.View>

      <View style={itemStyles.textContainer}>
        <CustomText
          fontSize={RFValue(9)}
          fontFamily={isSelected ? Fonts.SemiBold : Fonts.Medium}
          numberOfLines={2}
          style={[
            itemStyles.categoryName,
            {
              color: isSelected ? Colors.secondary : colors.text,
            },
          ]}>
          {category?.name}
        </CustomText>
        {categoryCounts[category._id] !== undefined && (
          <View style={itemStyles.countBadge}>
            <CustomText
              fontSize={RFValue(8)}
              fontFamily={Fonts.Bold}
              style={[
                itemStyles.countText,
                {
                  color: isSelected ? '#fff' : colors.text,
                },
              ]}>
              {categoryCounts[category._id]}
            </CustomText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const Sidebar: FC<SidebarProps> = ({
  selectedCategory,
  categories,
  onCategoryPress,
  categoryCounts = {},
}) => {
  const {colors} = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorPosition = useSharedValue(0);

  const animatedValue0 = useSharedValue(0);
  const animatedValue1 = useSharedValue(0);
  const animatedValue2 = useSharedValue(0);
  const animatedValue3 = useSharedValue(0);
  const animatedValue4 = useSharedValue(0);
  const animatedValue5 = useSharedValue(0);
  const animatedValue6 = useSharedValue(0);
  const animatedValue7 = useSharedValue(0);
  const animatedValue8 = useSharedValue(0);
  const animatedValue9 = useSharedValue(0);
  const animatedValue10 = useSharedValue(0);
  const animatedValue11 = useSharedValue(0);
  const animatedValue12 = useSharedValue(0);
  const animatedValue13 = useSharedValue(0);
  const animatedValue14 = useSharedValue(0);
  const animatedValue15 = useSharedValue(0);
  const animatedValue16 = useSharedValue(0);
  const animatedValue17 = useSharedValue(0);
  const animatedValue18 = useSharedValue(0);
  const animatedValue19 = useSharedValue(0);

  const animatedValues = [
    animatedValue0,
    animatedValue1,
    animatedValue2,
    animatedValue3,
    animatedValue4,
    animatedValue5,
    animatedValue6,
    animatedValue7,
    animatedValue8,
    animatedValue9,
    animatedValue10,
    animatedValue11,
    animatedValue12,
    animatedValue13,
    animatedValue14,
    animatedValue15,
    animatedValue16,
    animatedValue17,
    animatedValue18,
    animatedValue19,
  ];

  useEffect(() => {
    if (!categories || categories.length === 0) {
      return;
    }

    let targetIndex = -1;

    categories.forEach((category: ICategoryItem, index: number) => {
      if (animatedValues[index]) {
        const isSelected = selectedCategory?._id === category?._id;
        animatedValues[index].value = withTiming(isSelected ? 2 : -15, {
          duration: 500,
        });
        if (isSelected) targetIndex = index;
      }
    });

    if (targetIndex !== -1) {
      const itemHeight = 98; // Updated height based on new design
      indicatorPosition.value = withTiming(targetIndex * itemHeight, {duration: 500});
      runOnJS(() => {
        scrollViewRef.current?.scrollTo({
          y: targetIndex * itemHeight,
          animated: true,
        });
      });
    }
  }, [selectedCategory, categories, animatedValues]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{translateY: indicatorPosition.value}],
  }));

  const styles = StyleSheet.create({
    sideBar: {
      width: screenWidth * 0.22,
      maxWidth: 90,
      backgroundColor: colors.cardBackground,
      borderRightWidth: 1,
      borderRightColor: colors.border + '40',
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: {width: 2, height: 0},
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    indicator: {
      position: 'absolute',
      right: 0,
      width: 4,
      height: 90,
      backgroundColor: Colors.secondary,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
      shadowColor: Colors.secondary,
      shadowOffset: {width: -2, height: 0},
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 4,
    },
  });

  return (
    <View style={styles.sideBar}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          paddingVertical: 8,
          paddingBottom: screenHeight * 0.1,
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        <View>
          {categories?.map((category: ICategoryItem, index: number) => (
            <CategoryItem
              key={category._id || index}
              category={category}
              index={index}
              isSelected={selectedCategory?._id === category?._id}
              animatedValue={animatedValues[index]}
              onPress={() => onCategoryPress(category)}
              categoryCounts={categoryCounts}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Sidebar;
