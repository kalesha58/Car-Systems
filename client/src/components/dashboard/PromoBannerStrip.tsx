import React, {FC, useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewToken,
} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {navigate} from '@utils/NavigationUtils';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
// matches the paddingHorizontal:20 in Content.tsx's section view
const CARD_WIDTH = SCREEN_WIDTH - 40;
const AUTO_SCROLL_MS = 3500;

interface Banner {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  backgroundColor: string;
  onPress: () => void;
}

const BANNERS: Banner[] = [
  {
    id: 'doorstep',
    emoji: '🔧',
    title: 'Doorstep Car Service',
    subtitle: 'Expert mechanics at your door —\nno garage visit needed',
    cta: 'Book Now',
    backgroundColor: '#1565C0',
    onPress: () =>
      navigate('Category', {
        screen: 'ProductCategories',
        params: {
          initialCategoryId: 'car-service',
          initialCategoryType: 'services',
          serviceType: 'car_automobile',
          vehicleType: 'Car',
        },
      }),
  },
  {
    id: 'ppf',
    emoji: '✨',
    title: 'Premium PPF & Detailing',
    subtitle: 'Ceramic coating & paint protection\nstarting from ₹999',
    cta: 'Explore',
    backgroundColor: '#6A1B9A',
    onPress: () =>
      navigate('Category', {
        screen: 'ProductCategories',
        params: {
          initialCategoryId: 'ppf-detailing',
          initialCategoryType: 'services',
          serviceType: 'car_detailing',
        },
      }),
  },
  {
    id: 'tyre',
    emoji: '🛞',
    title: 'Tyre Puncture? We\'re Near',
    subtitle: 'Roadside tyre fix in 15 mins —\nanytime, anywhere',
    cta: 'Get Help',
    backgroundColor: '#BF360C',
    onPress: () =>
      navigate('Category', {
        screen: 'ProductCategories',
        params: {
          initialCategoryId: 'all-services',
          initialCategoryType: 'services',
          serviceType: 'tire_service',
        },
      }),
  },
];

const PromoBannerStrip: FC = () => {
  const {colors} = useTheme();
  const flatListRef = useRef<FlatList<Banner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIndexRef = useRef(0);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % BANNERS.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      flatListRef.current?.scrollToIndex({index: next, animated: true});
    }, AUTO_SCROLL_MS);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoScroll]);

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        activeIndexRef.current = viewableItems[0].index!;
        setActiveIndex(viewableItems[0].index!);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleScrollBeginDrag = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const styles = StyleSheet.create({
    wrapper: {
      marginVertical: 6,
    },
    card: {
      width: CARD_WIDTH,
      height: 112,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 14,
      overflow: 'hidden',
    },
    emojiCircle: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: 'rgba(255,255,255,0.18)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    emoji: {
      fontSize: RFValue(28),
    },
    textBlock: {
      flex: 1,
    },
    title: {
      color: '#FFFFFF',
      marginBottom: 3,
      letterSpacing: 0.2,
    },
    subtitle: {
      color: 'rgba(255,255,255,0.80)',
      lineHeight: RFValue(13),
      marginBottom: 10,
    },
    ctaPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.40)',
    },
    ctaText: {
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      gap: 5,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
  });

  const renderBanner = ({item}: {item: Banner}) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={item.onPress}
      style={{width: CARD_WIDTH}}>
      <View style={[styles.card, {backgroundColor: item.backgroundColor}]}>
        <View style={styles.emojiCircle}>
          <CustomText style={styles.emoji}>{item.emoji}</CustomText>
        </View>
        <View style={styles.textBlock}>
          <CustomText
            variant="h6"
            fontFamily={Fonts.Bold}
            style={styles.title}
            numberOfLines={1}>
            {item.title}
          </CustomText>
          <CustomText
            variant="h9"
            fontFamily={Fonts.Regular}
            style={styles.subtitle}
            numberOfLines={2}>
            {item.subtitle}
          </CustomText>
          <View style={styles.ctaPill}>
            <CustomText
              variant="h9"
              fontFamily={Fonts.SemiBold}
              style={styles.ctaText}>
              {item.cta} →
            </CustomText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        renderItem={renderBanner}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={startAutoScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
      />
      {/* Pager dots */}
      <View style={styles.dotsRow}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === activeIndex ? 20 : 6,
                backgroundColor:
                  i === activeIndex
                    ? colors.primary || '#1976D2'
                    : colors.textSecondary || '#AAAAAA',
                opacity: i === activeIndex ? 1 : 0.4,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default PromoBannerStrip;
