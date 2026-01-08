import {View, StyleSheet, ScrollView, useWindowDimensions} from 'react-native';
import React, {FC, useRef, useEffect} from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import {useTheme} from '@hooks/useTheme';

export interface DiscountBannerItem {
  id: string;
  title: string;
  discountText: string;
  subtitle?: string;
  backgroundColor: string;
  textColor: string;
  image?: any;
}

interface BannerItemProps {
  item: DiscountBannerItem;
  index: number;
  scrollX: SharedValue<number>;
  carouselWidth: number;
  carouselHeight: number;
  horizontalPadding: number;
}

const BannerItem: FC<BannerItemProps> = ({
  item,
  index,
  scrollX,
  carouselWidth,
  carouselHeight,
  horizontalPadding,
}) => {
  const {colors} = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * carouselWidth + horizontalPadding,
      index * carouselWidth + horizontalPadding,
      (index + 1) * carouselWidth + horizontalPadding,
    ];
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.94, 1, 0.94],
      'clamp',
    );
    return {
      transform: [{scale}],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: carouselWidth,
          height: carouselHeight,
        },
        animatedStyle,
      ]}>
      <View
        style={[
          styles.bannerContainer,
          {
            backgroundColor: item.backgroundColor,
            borderRadius: 12,
          },
        ]}>
        <View style={styles.bannerContent}>
          <View style={styles.textContainer}>
            <CustomText
              style={[
                styles.discountText,
                {
                  color: item.textColor,
                },
              ]}
              fontFamily={Fonts.Bold}>
              {item.discountText}
            </CustomText>
            {item.title && (
              <CustomText
                style={[
                  styles.titleText,
                  {
                    color: item.textColor,
                  },
                ]}
                fontFamily={Fonts.SemiBold}>
                {item.title}
              </CustomText>
            )}
            {item.subtitle && (
              <CustomText
                style={[
                  styles.subtitleText,
                  {
                    color: item.textColor,
                    opacity: 0.9,
                  },
                ]}
                fontFamily={Fonts.Medium}>
                {item.subtitle}
              </CustomText>
            )}
          </View>
          {item.image && (
            <View style={styles.imageContainer}>
              {typeof item.image === 'number' ? (
                <View style={styles.placeholderImage}>
                  <CustomText
                    style={[
                      styles.imagePlaceholder,
                      {color: item.textColor, opacity: 0.3},
                    ]}>
                    🎁
                  </CustomText>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

interface DiscountBannerCarouselProps {
  bannerData: DiscountBannerItem[];
}

const DiscountBannerCarousel: FC<DiscountBannerCarouselProps> = ({
  bannerData,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const {width} = useWindowDimensions();
  const horizontalPadding = 20;
  const carouselWidth = width - horizontalPadding * 2;
  const carouselHeight = carouselWidth * 0.18; // Very compact height
  const currentIndex = useRef(0);

  useEffect(() => {
    if (bannerData && bannerData.length > 0) {
      const interval = setInterval(() => {
        currentIndex.current = (currentIndex.current + 1) % bannerData.length;
        scrollViewRef.current?.scrollTo({
          x: currentIndex.current * carouselWidth,
          animated: true,
        });
      }, 3500); // 3.5 second intervals

      return () => clearInterval(interval);
    }
  }, [bannerData, carouselWidth]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX + horizontalPadding;
    currentIndex.current = Math.round(offsetX / carouselWidth);
  };

  if (!bannerData || bannerData.length === 0) {
    return null;
  }

  const snapOffsets = bannerData.map((_: any, index: number) =>
    index * carouselWidth,
  );

  return (
    <View style={[styles.container, {marginVertical: 6}]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}>
        {bannerData.map((item: DiscountBannerItem, index: number) => (
          <BannerItem
            key={item.id || index}
            item={item}
            index={index}
            scrollX={scrollX}
            carouselWidth={carouselWidth}
            carouselHeight={carouselHeight}
            horizontalPadding={horizontalPadding}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  bannerContainer: {
    width: '100%',
    height: '100%',
    padding: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  discountText: {
    fontSize: RFValue(16),
    marginBottom: 2,
    lineHeight: RFValue(20),
    letterSpacing: -0.2,
  },
  titleText: {
    fontSize: RFValue(11),
    marginBottom: 1,
    lineHeight: RFValue(14),
    letterSpacing: 0.05,
  },
  subtitleText: {
    fontSize: RFValue(9),
    lineHeight: RFValue(12),
    letterSpacing: 0.02,
  },
  imageContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.15,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: RFValue(24),
  },
});

export default DiscountBannerCarousel;

