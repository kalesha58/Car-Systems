import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';

import { lightHaptic } from '@utils/haptics';

export type DealerBannerAction =
  | 'orders'
  | 'inventory'
  | 'add_product'
  | 'service_bookings'
  | 'bank'
  | 'drive';

interface DealerBannerItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  colors: string[];
  icon: string;
  action: DealerBannerAction;
  cta: string;
}

const DEALER_BANNERS: DealerBannerItem[] = [
  {
    id: 'first_order',
    title: '10% Off First Order',
    subtitle: 'Win new customers faster',
    description: 'Offer 10% on a buyer’s first order to boost conversions',
    colors: ['#B0000F', '#FF1A1A'],
    icon: 'percent',
    action: 'orders',
    cta: 'View Orders',
  },
  {
    id: 'weekend_sale',
    title: 'Weekend Flash Sale',
    subtitle: 'Move slow-moving stock',
    description: 'Highlight spare parts & accessories with limited-time deals',
    colors: ['#059669', '#10B981'],
    icon: 'tag',
    action: 'inventory',
    cta: 'Inventory',
  },
  {
    id: 'fast_payout',
    title: 'Fast Payouts',
    subtitle: 'Get paid in 2 business days',
    description: 'Link your bank & UPI to receive settlements on time',
    colors: ['#1D4ED8', '#3B82F6'],
    icon: 'credit-card',
    action: 'bank',
    cta: 'Bank Setup',
  },
  {
    id: 'service_growth',
    title: 'Grow Service Bookings',
    subtitle: 'More bookings, more revenue',
    description: 'Accept pending service requests and keep customers coming back',
    colors: ['#7C3AED', '#8B5CF6'],
    icon: 'tool',
    action: 'service_bookings',
    cta: 'Bookings',
  },
  {
    id: 'test_drive',
    title: 'Promote Test Drives',
    subtitle: 'Turn interest into sales',
    description: 'Offer test drives on top vehicles and close deals faster',
    colors: ['#D97706', '#F59E0B'],
    icon: 'navigation',
    action: 'drive',
    cta: 'Test Drives',
  },
];

interface DealerBannerCarouselProps {
  onAction?: (action: DealerBannerAction) => void;
}

export function DealerBannerCarousel({ onAction }: DealerBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<DealerBannerItem>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width - 32;

  useEffect(() => {
    if (DEALER_BANNERS.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % DEALER_BANNERS.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={DEALER_BANNERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
          listener: handleScroll,
        })}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.bannerWrapper, { width: screenWidth }]}
            onPress={() => {
              lightHaptic();
              onAction?.(item.action);
            }}
          >
            <LinearGradient
              colors={item.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerCard}
            >
              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  <Feather name={item.icon as 'percent'} size={28} color="#fff" />
                </View>
                <View style={styles.text}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
                <View style={styles.actionBtn}>
                  <Text style={[styles.actionBtnText, { color: item.colors[0] }]}>{item.cta}</Text>
                  <Feather name="chevron-right" size={14} color={item.colors[0]} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        )}
      />

      <View style={styles.pagination}>
        {DEALER_BANNERS.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === activeIndex
                ? { backgroundColor: '#E60012', width: 16 }
                : { backgroundColor: '#CBD5E1', width: 6 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  bannerWrapper: {
    paddingRight: 4,
  },
  bannerCard: {
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  description: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: 'Inter_400Regular' },
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
