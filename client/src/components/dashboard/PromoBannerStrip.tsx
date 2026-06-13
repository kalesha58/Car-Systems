import React, {FC, useRef, useEffect, useState, useCallback, useMemo} from 'react';
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
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';
import {useAppConfigStore} from '@state/appConfigStore';
import {IStoreBannerItem} from '@types/storeBanners';
import {navigateFromBannerLink} from '@utils/bannerNavigation';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SIDE_INSET = 20;
const BANNER_GAP = 12;
const CARD_WIDTH = SCREEN_WIDTH - SIDE_INSET * 2 - 24;
const ITEM_WIDTH = CARD_WIDTH + BANNER_GAP;

interface BannerRow extends IStoreBannerItem {
  onPress: () => void;
}

const PromoBannerStrip: FC = () => {
  const {colors} = useTheme();
  const storeBanners = useAppConfigStore(state => state.storeBanners);
  const flatListRef = useRef<FlatList<BannerRow>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIndexRef = useRef(0);

  const banners = useMemo<BannerRow[]>(() => {
    if (!storeBanners.enabled) {
      return [];
    }

    return [...storeBanners.items]
      .filter(item => item.enabled)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item => ({
        ...item,
        onPress: () => navigateFromBannerLink(item.link),
      }));
  }, [storeBanners]);

  const autoScrollMs = storeBanners.autoScrollMs || 3500;

  const startAutoScroll = useCallback(() => {
    if (banners.length <= 1) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % banners.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      flatListRef.current?.scrollToIndex({index: next, animated: true});
    }, autoScrollMs);
  }, [autoScrollMs, banners.length]);

  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);
    startAutoScroll();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startAutoScroll, banners]);

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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const styles = StyleSheet.create({
    wrapper: {
      marginVertical: 6,
    },
    bannerItem: {
      width: ITEM_WIDTH,
      paddingRight: BANNER_GAP,
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
    listContent: {
      paddingHorizontal: SIDE_INSET,
    },
  });

  const renderBanner = ({item}: {item: BannerRow}) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={item.onPress}
      style={styles.bannerItem}>
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

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={startAutoScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
      />
      <View style={styles.dotsRow}>
        {banners.map((_, i) => (
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
