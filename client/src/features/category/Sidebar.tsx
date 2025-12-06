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
} from 'react-native-reanimated';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import type {ICategoryItem} from '../../types/category/ICategoryItem';
import type {SharedValue} from 'react-native-reanimated';

export type CategoryType = 'products' | 'vehicles' | 'services';

interface SidebarProps {
  selectedCategory: ICategoryItem | null;
  categories: ICategoryItem[];
  onCategoryPress: (category: ICategoryItem) => void;
  selectedCategoryType?: CategoryType;
  onCategoryTypePress?: (type: CategoryType) => void;
}

interface CategoryItemProps {
  category: ICategoryItem;
  index: number;
  isSelected: boolean;
  animatedValue: SharedValue<number>;
  onPress: () => void;
}

const CategoryItem: FC<CategoryItemProps> = ({
  category,
  index,
  isSelected,
  animatedValue,
  onPress,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    bottom: animatedValue?.value ?? -15,
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.categoryButton}
      onPress={onPress}>
      <View
        style={[
          styles.imageContainer,
          isSelected && styles.selectedImageContainer,
        ]}>
        {category?.image ? (
          typeof category.image === 'number' ? (
            <Animated.Image
              source={category.image}
              style={[styles.image, animatedStyle]}
              resizeMode="contain"
            />
          ) : typeof category.image === 'string' && category.image.trim() !== '' ? (
            <Animated.Image
              source={{uri: category.image}}
              style={[styles.image, animatedStyle]}
              resizeMode="contain"
            />
          ) : (
            <Animated.View style={[styles.placeholderIcon, animatedStyle]} />
          )
        ) : (
          <Animated.View style={[styles.placeholderIcon, animatedStyle]} />
        )}
      </View>

      <CustomText fontSize={RFValue(7)} style={{textAlign: 'center'}}>
        {category?.name}
      </CustomText>
    </TouchableOpacity>
  );
};

const Sidebar: FC<SidebarProps> = ({
  selectedCategory,
  categories,
  onCategoryPress,
  selectedCategoryType = 'products',
  onCategoryTypePress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorPosition = useSharedValue(0);
  const maxCategories = 20;

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

  const categoryTypes: {type: CategoryType; label: string}[] = [
    {type: 'products', label: 'Products'},
    {type: 'vehicles', label: 'Vehicles'},
    {type: 'services', label: 'Services'},
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
      indicatorPosition.value = withTiming(targetIndex * 100, {duration: 500});
      runOnJS(() => {
        scrollViewRef.current?.scrollTo({
          y: targetIndex * 100,
          animated: true,
        });
      });
    }
  }, [selectedCategory, categories, animatedValues]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{translateY: indicatorPosition.value}],
  }));

  return (
    <View style={styles.sideBar}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{paddingBottom: 50}}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        <View style={styles.categoryTypesContainer}>
          {categoryTypes.map(({type, label}) => (
            <TouchableOpacity
              key={type}
              activeOpacity={1}
              style={[
                styles.categoryTypeButton,
                selectedCategoryType === type && styles.selectedCategoryTypeButton,
              ]}
              onPress={() => onCategoryTypePress?.(type)}>
              <CustomText
                fontSize={RFValue(8)}
                fontFamily={
                  selectedCategoryType === type ? Fonts.Medium : Fonts.Regular
                }
                style={[
                  styles.categoryTypeText,
                  ...(selectedCategoryType === type
                    ? [styles.selectedCategoryTypeText]
                    : []),
                ]}>
                {label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View>
          {categories?.map((category: ICategoryItem, index: number) => (
            <CategoryItem
              key={category._id || index}
              category={category}
              index={index}
              isSelected={selectedCategory?._id === category?._id}
              animatedValue={animatedValues[index]}
              onPress={() => onCategoryPress(category)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sideBar: {
    width: '24%',
    backgroundColor: '#fff',
    borderRightWidth: 0.8,
    borderRightColor: '#eee',
    position: 'relative',
  },
  categoryButton: {
    padding: 10,
    height: 100,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  indicator: {
    position: 'absolute',
    right: 0,
    width: 4,
    height: 80,
    top: 10,
    alignSelf: 'center',
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  image: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  imageContainer: {
    borderRadius: 100,
    height: '50%',
    marginBottom: 10,
    width: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F7',
    overflow: 'hidden',
  },
  selectedImageContainer: {
    backgroundColor: '#CFFFDB',
  },
  categoryTypesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 6,
  },
  selectedCategoryTypeButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  categoryTypeText: {
    textAlign: 'center',
  },
  selectedCategoryTypeText: {
    color: Colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  placeholderIcon: {
    width: '60%',
    height: '60%',
    backgroundColor: '#ddd',
    borderRadius: 50,
  },
});

export default Sidebar;
