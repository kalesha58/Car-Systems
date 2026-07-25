import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';

import { useDealer } from '@context/DealerContext';
import { lightHaptic } from '@utils/haptics';

interface BannerCarouselProps {
  onAiPress?: () => void;
  onPromoPress?: () => void;
  onTestDrivePress?: () => void;
}

interface BannerItem {
  id: string;
  type: 'ai' | 'promo' | 'testDrive' | 'custom';
  title: string;
  subtitle: string;
  description: string;
  colors: string[];
  icon: string;
  customImage?: string | null;
}

export function BannerCarousel({ onAiPress, onPromoPress, onTestDrivePress }: BannerCarouselProps) {
  const { businessProfile } = useDealer();
  const [activeIndex, setActiveIndex] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const flatListRef = useRef<FlatList<BannerItem>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isWeb = Platform.OS === 'web';
  const screenWidth =
    isWeb && measuredWidth > 0 ? measuredWidth : Dimensions.get('window').width - 32;
  const bannerHeight = isWeb ? 170 : 130;

  const banners: BannerItem[] = [
    {
      id: 'b1',
      type: 'ai',
      title: 'AI Assistant',
      subtitle: 'Your Automotive Companion',
      description: 'Diagnose issues, find parts, book services & more',
      colors: ['#B0000F', '#FF1A1A'],
      icon: 'cpu',
    },
    {
      id: 'b2',
      type: 'promo',
      title: 'Motonode Mega Sale',
      subtitle: 'Flat 15% OFF on Lubricants',
      description: 'Use coupon HUB10 on Castrol & Motul items',
      colors: ['#059669', '#10B981'],
      icon: 'percent',
    },
    {
      id: 'b3',
      type: 'testDrive',
      title: 'Book Test Drives',
      subtitle: 'Try Electric Vehicles today!',
      description: 'Zero cost test ride for Nexon EV Max & Duke 390',
      colors: ['#7C3AED', '#8B5CF6'],
      icon: 'navigation',
    },
  ];

  if (businessProfile?.storeBanner) {
    banners.push({
      id: 'b_custom',
      type: 'custom',
      title: businessProfile.businessName || 'Your Store Banner',
      subtitle: 'Official Dealer Store',
      description: 'Browse genuine products directly from our warehouse',
      colors: ['#475569', '#64748B'],
      icon: 'briefcase',
      customImage: businessProfile.storeBanner,
    });
  }

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex, banners.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handlePressItem = (item: BannerItem) => {
    lightHaptic();
    if (item.type === 'ai') {
      onAiPress?.();
    } else if (item.type === 'testDrive') {
      onTestDrivePress?.();
    } else {
      onPromoPress?.();
    }
  };

  const ctaLabel = (type: BannerItem['type']) => {
    if (!isWeb) {
      return type === 'ai' ? 'Chat' : type === 'testDrive' ? 'Book' : 'View';
    }
    return type === 'ai'
      ? 'Try AI Assistant'
      : type === 'testDrive'
        ? 'Book Now'
        : 'View Offer';
  };

  return (
    <View
      style={styles.container}
      onLayout={e => {
        if (isWeb) {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - measuredWidth) > 1) {
            setMeasuredWidth(w);
          }
        }
      }}
    >
      {screenWidth > 0 ? (
        <FlatList
          ref={flatListRef}
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: handleScroll,
          })}
          keyExtractor={item => item.id}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.bannerWrapper, { width: screenWidth }]}
              onPress={() => handlePressItem(item)}
            >
              {item.customImage ? (
                <View style={[styles.bannerCard, { height: bannerHeight }]}>
                  <Image
                    source={{ uri: item.customImage }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <View style={styles.customImageOverlay}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                </View>
              ) : (
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bannerCard, { height: bannerHeight }]}
                >
                  <View style={[styles.content, isWeb && styles.contentWeb]}>
                    <View style={styles.iconContainer}>
                      <Feather name={item.icon as 'cpu'} size={isWeb ? 32 : 28} color="#fff" />
                    </View>
                    <View style={styles.text}>
                      <Text style={[styles.title, isWeb && styles.titleWeb]}>{item.title}</Text>
                      <Text style={[styles.subtitle, isWeb && styles.subtitleWeb]}>
                        {item.subtitle}
                      </Text>
                      <Text style={[styles.description, isWeb && styles.descriptionWeb]}>
                        {item.description}
                      </Text>
                      {isWeb ? (
                        <View style={styles.actionBtnWeb}>
                          <Text style={[styles.actionBtnTextWeb, { color: item.colors[0] }]}>
                            {ctaLabel(item.type)}
                          </Text>
                          <Feather name="chevron-right" size={14} color={item.colors[0]} />
                        </View>
                      ) : null}
                    </View>
                    {!isWeb ? (
                      <View style={styles.actionBtn}>
                        <Text style={[styles.actionBtnText, { color: item.colors[0] }]}>
                          {ctaLabel(item.type)}
                        </Text>
                        <Feather name="chevron-right" size={14} color={item.colors[0]} />
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              )}
            </Pressable>
          )}
        />
      ) : null}

      <View style={styles.pagination}>
        {banners.map((_, idx) => {
          const isActive = idx === activeIndex;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                isActive
                  ? { backgroundColor: '#E60012', width: 16 }
                  : { backgroundColor: '#CBD5E1', width: 6 },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
    width: '100%',
  },
  bannerWrapper: {
    paddingRight: 0,
  },
  bannerCard: {
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
  },
  customImageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  contentWeb: {
    paddingHorizontal: 28,
    paddingVertical: 22,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  titleWeb: { fontSize: 22 },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  subtitleWeb: { fontSize: 14, marginTop: 2 },
  description: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: 'Inter_400Regular' },
  descriptionWeb: { fontSize: 13, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  actionBtnWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  actionBtnTextWeb: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
