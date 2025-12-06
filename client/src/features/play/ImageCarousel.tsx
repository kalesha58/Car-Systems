import React, {useState, useRef} from 'react';
import {View, StyleSheet, Image, Dimensions, ScrollView} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Colors} from '@utils/Constants';

interface IImageCarouselProps {
  images: string[];
  width?: number;
  height?: number;
}

const ImageCarousel: React.FC<IImageCarouselProps> = ({
  images,
  width,
  height,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const carouselWidth = width || screenWidth;
  const carouselHeight = height || Dimensions.get('window').height * 0.7;

  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <View style={[styles.container, {width: carouselWidth, height: carouselHeight}]}>
        <Image
          source={{uri: images[0]}}
          style={[styles.image, {width: carouselWidth, height: carouselHeight}]}
          resizeMode="cover"
        />
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / carouselWidth);
    setCurrentIndex(index);
  };

  const snapOffsets = images.map((_, index: number) => index * carouselWidth);

  return (
    <View style={[styles.container, {width: carouselWidth, height: carouselHeight}]}>
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
            style={[styles.image, {width: carouselWidth, height: carouselHeight}]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
});

export default ImageCarousel;

