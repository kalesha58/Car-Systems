import React, {useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import {goBack} from '@utils/NavigationUtils';
import {useTheme} from '@hooks/useTheme';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {useCollapsibleContext} from '@r0b0t3d/react-native-collapsible';

interface IProductImageCarouselProps {
  images: string[];
  scrollY?: Animated.SharedValue<number>;
}

const ProductImageCarousel: React.FC<IProductImageCarouselProps> = ({
  images,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const carouselHeight = Dimensions.get('window').height * 0.5;
  const {colors} = useTheme();
  const {scrollY} = useCollapsibleContext();

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

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      width: screenWidth,
      height: carouselHeight,
    },
    image: {
      width: screenWidth,
      height: carouselHeight,
    },
    pagination: {
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeDot: {
      width: 20,
      backgroundColor: Colors.secondary,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    actionButton: {
      position: 'absolute',
      bottom: 80,
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    actionButtonLeft: {
      left: 16,
    },
    actionButtonRight: {
      right: 16,
    },
    topRightIcons: {
      position: 'absolute',
      top: 50,
      right: 16,
      flexDirection: 'row',
      gap: 12,
      zIndex: 10,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (images.length === 1) {
    return (
      <Animated.View style={[styles.container, carouselAnimatedStyle]}>
        <Image
          source={{uri: images[0]}}
          style={styles.image}
          resizeMode="cover"
        />
        <Pressable onPress={() => goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={RFValue(20)} color={colors.text} />
        </Pressable>
        <View style={styles.topRightIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search" size={RFValue(20)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="share-outline" size={RFValue(20)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonLeft]}>
          <Icon name="star" size={RFValue(20)} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonRight]}>
          <Icon name="restaurant-outline" size={RFValue(20)} color="#fff" />
        </TouchableOpacity>
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
            source={{uri: imageUri}}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      <Pressable onPress={() => goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={RFValue(20)} color={colors.text} />
      </Pressable>
      <View style={styles.topRightIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="search" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="share-outline" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.actionButton, styles.actionButtonLeft]}>
        <Icon name="star" size={RFValue(20)} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.actionButtonRight]}>
        <Icon name="restaurant-outline" size={RFValue(20)} color="#fff" />
      </TouchableOpacity>
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

