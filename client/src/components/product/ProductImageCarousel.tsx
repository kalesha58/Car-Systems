import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Colors, Fonts } from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { goBack } from '@utils/NavigationUtils';
import { useTheme } from '@hooks/useTheme';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useCollapsibleContext } from '@r0b0t3d/react-native-collapsible';

interface IProductImageCarouselProps {
  images: string[];
  scrollY?: Animated.SharedValue<number>;
  productName?: string;
  productPrice?: number;
  productId?: string;
  isWishlisted: boolean;
  onWishlistPress: () => void;
}

const ProductImageCarousel: React.FC<IProductImageCarouselProps> = ({
  images,
  productName,
  productPrice,
  productId,
  isWishlisted,
  onWishlistPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;

  // Responsive carousel height
  const carouselHeight = isDesktop
    ? screenHeight * 0.6
    : isTablet
      ? screenHeight * 0.55
      : screenHeight * 0.5;

  const { colors } = useTheme();
  const { scrollY } = useCollapsibleContext();

  if (!images || images.length === 0) {
    return null;
  }

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentIndex(index);
  };

  const snapOffsets = images.map((_, index: number) => index * screenWidth);

  const carouselAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
    };
  });

  const getResponsiveValue = (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      width: screenWidth,
      height: carouselHeight,
    },
    image: {
      width: screenWidth,
      height: carouselHeight,
      resizeMode: 'cover',
    },
    pagination: {
      position: 'absolute',
      bottom: getResponsiveValue(16, 20, 24),
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: getResponsiveValue(6, 8, 10),
    },
    dot: {
      width: getResponsiveValue(6, 8, 10),
      height: getResponsiveValue(6, 8, 10),
      borderRadius: getResponsiveValue(3, 4, 5),
      backgroundColor: colors.text,
      opacity: 0.3,
    },
    activeDot: {
      width: getResponsiveValue(20, 24, 28),
      backgroundColor: Colors.secondary,
    },
    backButton: {
      position: 'absolute',
      top: getResponsiveValue(50, 60, 70),
      left: getResponsiveValue(16, 24, 32),
      width: getResponsiveValue(40, 48, 52),
      height: getResponsiveValue(40, 48, 52),
      borderRadius: getResponsiveValue(20, 24, 26),
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      opacity: 0.9,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    actionButton: {
      position: 'absolute',
      bottom: getResponsiveValue(80, 100, 120),
      width: getResponsiveValue(40, 48, 52),
      height: getResponsiveValue(40, 48, 52),
      borderRadius: getResponsiveValue(8, 10, 12),
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    actionButtonLeft: {
      left: getResponsiveValue(16, 24, 32),
    },
    actionButtonRight: {
      right: getResponsiveValue(16, 24, 32),
    },
    topRightIcons: {
      position: 'absolute',
      top: getResponsiveValue(50, 60, 70),
      right: getResponsiveValue(16, 24, 32),
      flexDirection: 'row',
      gap: getResponsiveValue(12, 16, 20),
      zIndex: 10,
    },
    iconButton: {
      width: getResponsiveValue(40, 48, 52),
      height: getResponsiveValue(40, 48, 52),
      borderRadius: getResponsiveValue(20, 24, 26),
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.9,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });

  if (images.length === 1) {
    return (
      <Animated.View style={[styles.container, carouselAnimatedStyle]}>
        <Image
          source={{ uri: images[0] }}
          style={styles.image}
          resizeMode="contain"
        />
        <Pressable onPress={() => goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={RFValue(getResponsiveValue(20, 24, 28))} color={colors.text} />
        </Pressable>
        <View style={styles.topRightIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={onWishlistPress}>
            <Icon
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={RFValue(getResponsiveValue(20, 24, 28))}
              color={isWishlisted ? colors.error : colors.text}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, carouselAnimatedStyle]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToOffsets={snapOffsets}
        snapToAlignment="start">
        {images.map((imageUri, index) => (
          <Image
            key={index}
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        ))}
      </ScrollView>
      <Pressable onPress={() => goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={RFValue(getResponsiveValue(20, 24, 28))} color={colors.text} />
      </Pressable>
      <View style={styles.topRightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={onWishlistPress}>
          <Icon
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={RFValue(getResponsiveValue(20, 24, 28))}
            color={isWishlisted ? colors.error : colors.text}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

export default ProductImageCarousel;

