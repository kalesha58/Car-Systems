import {
  View,
  Text,
  StyleSheet,
  Animated as RNAnimated,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {NoticeHeight, screenHeight} from '@utils/Scaling';
import {
  CollapsibleContainer,
  CollapsibleScrollView,
  useCollapsibleContext,
  CollapsibleHeaderContainer,
  withCollapsibleContext,
} from '@r0b0t3d/react-native-collapsible';
import Geolocation from '@react-native-community/geolocation';
import {reverseGeocode} from '@service/mapService';
import {useAuthStore} from '@state/authStore';
import NoticeAnimation from './NoticeAnimation';
import Visuals from './Visuals';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import AnimatedHeader from './AnimatedHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Content from '@components/dashboard/Content';
import StickySearchBar from './StickySearchBar';
import withCart from '../../features/cart/WithCart';
import withLiveStatus from '@features/map/withLiveStatus';
import {useTheme} from '@hooks/useTheme';

const NOTICE_HEIGHT = -(NoticeHeight + 12);

const ProductDashboard = () => {
  const {user, setUser} = useAuthStore();
  const noticePosition = useRef(new RNAnimated.Value(NOTICE_HEIGHT)).current;
  const insets = useSafeAreaInsets();
  const {scrollY, expand} = useCollapsibleContext();
  const previousScroll = useRef<number>(0);
  const {colors} = useTheme();

  const backToTopStyle = useAnimatedStyle(() => {
    const isScrollingUp =
      scrollY.value < previousScroll.current && scrollY.value > 180;
    const opacity = withTiming(isScrollingUp ? 1 : 0, {duration: 300});
    const translateY = withTiming(isScrollingUp ? 0 : 10, {duration: 300});

    previousScroll.current = scrollY.value;

    return {
      opacity,
      transform: [{translateY}],
    };
  });

  const slideUp = () => {
    RNAnimated.timing(noticePosition, {
      toValue: NOTICE_HEIGHT,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  };

  const slideDown = () => {
    RNAnimated.timing(noticePosition, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    slideDown();
    const timeoutId = setTimeout(() => {
      slideUp();
    }, 3500);
    return () => clearTimeout(timeoutId);
  }, []);

  const styles = StyleSheet.create({
    panelContainer: {
      flex: 1,
    },
    transparent: {
      backgroundColor: 'transparent',
    },
    backToTopButton: {
      position: 'absolute',
      alignSelf: 'center',
      top: Platform.OS === 'ios' ? screenHeight * 0.18 : 100,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      zIndex: 999,
    },
  });

  return (
    <NoticeAnimation noticePosition={noticePosition}>
      <>
        <Visuals />

        <Animated.View style={[styles.backToTopButton, backToTopStyle]}>
          <TouchableOpacity
            onPress={() => {
              scrollY.value = 0;
              expand();
            }}
            style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Icon
              name="arrow-up-circle-outline"
              color={colors.text}
              size={RFValue(12)}
            />
            <CustomText
              variant="h9"
              style={{color: colors.text}}
              fontFamily={Fonts.SemiBold}>
              Back to top
            </CustomText>
          </TouchableOpacity>
        </Animated.View>

        <CollapsibleContainer
          style={[styles.panelContainer, {marginTop: insets.top || 20}]}>
          <CollapsibleHeaderContainer containerStyle={styles.transparent}>
            <AnimatedHeader
              showNotice={() => {
                slideDown();
                const timeoutId = setTimeout(() => {
                  slideUp();
                }, 3500);
                return () => clearTimeout(timeoutId);
              }}
            />
            <StickySearchBar />
          </CollapsibleHeaderContainer>

          <CollapsibleScrollView
            nestedScrollEnabled
            style={styles.panelContainer}
            showsVerticalScrollIndicator={false}>
            <Content />

            <View style={{backgroundColor: colors.backgroundSecondary, padding: 20}}>
              <CustomText
                fontSize={RFValue(32)}
                fontFamily={Fonts.Bold}
                style={{opacity: 0.2}}>
                Car Connect 🚗
              </CustomText>
              <CustomText
                fontFamily={Fonts.Bold}
                style={{marginTop: 10, paddingBottom: 100, opacity: 0.2}}>
                Trust Us ❤️ 
              </CustomText>
            </View>
          </CollapsibleScrollView>
        </CollapsibleContainer>
      </>
    </NoticeAnimation>
  );
};

export default withLiveStatus(
  withCart(withCollapsibleContext(ProductDashboard)),
);
