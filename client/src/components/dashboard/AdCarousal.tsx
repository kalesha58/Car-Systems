import {View, StyleSheet, Image, ScrollView, useWindowDimensions} from 'react-native';
import React, {FC, useRef, useEffect} from 'react';
import ScalePress from '@components/ui/ScalePress';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

interface CarouselItemProps {
  item: any;
  index: number;
  scrollX: SharedValue<number>;
  carouselWidth: number;
  carouselHeight: number;
  horizontalPadding: number;
}

const CarouselItem: FC<CarouselItemProps> = ({
  item,
  index,
  scrollX,
  carouselWidth,
  carouselHeight,
  horizontalPadding,
}) => {
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
      <ScalePress style={styles.imageContainer}>
        <Image source={item} style={styles.img} />
      </ScalePress>
    </Animated.View>
  );
};

const AdCarousal: FC<{adData: any}> = ({adData}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const {width} = useWindowDimensions();
  const horizontalPadding = 20;
  const carouselWidth = width - horizontalPadding * 2;
  const carouselHeight = carouselWidth * 0.5;
  const currentIndex = useRef(0);

  useEffect(() => {
    if (adData && adData.length > 0) {
      const interval = setInterval(() => {
        currentIndex.current = (currentIndex.current + 1) % adData.length;
        scrollViewRef.current?.scrollTo({
          x: currentIndex.current * carouselWidth,
          animated: true,
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [adData, carouselWidth]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX + horizontalPadding;
    currentIndex.current = Math.round(offsetX / carouselWidth);
  };

  if (!adData || adData.length === 0) {
    return null;
  }

  const snapOffsets = adData.map((_: any, index: number) => 
    index * carouselWidth
  );

  return (
    <View style={[styles.container, {marginVertical: 20}]}>
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
        {adData.map((item: any, index: number) => (
          <CarouselItem
            key={index}
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
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 20,
  },
});
export default AdCarousal;
