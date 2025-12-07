import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Animated as RNAnimated, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@hooks/useTheme';
import {useAuthStore} from '@state/authStore';
import {NoticeHeight, screenHeight} from '@utils/Scaling';
import NoticeAnimation from './NoticeAnimation';
import Visuals from './Visuals';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {
  getDealerOrderStats,
  getDealerOrders,
  getDealerProducts,
  getDealerVehicles,
  getBusinessRegistrationByUserId,
  getBookings,
} from '@service/dealerService';
import {IDealer, IBooking} from '../../types/dealer/IDealer';
import {IOrderData} from '../../types/order/IOrder';
import {IProduct} from '../../types/product/IProduct';
import {IDealerVehicle} from '../../types/vehicle/IVehicle';
import Header from '@components/common/Header/Header';
import Loader from '@components/common/Loader/Loader';
import SkeletonLoader, {DashboardSkeleton} from '@components/common/Skeleton/SkeletonLoader';
import EmptyState from '@components/common/EmptyState/EmptyState';
import StatCard from '@components/common/StatCard/StatCard';
import ProfitCard from '@components/common/ProfitCard/ProfitCard';
import WelcomeHeader from '@components/common/WelcomeHeader/WelcomeHeader';
import FloatingChatButton from '@components/common/FloatingChatButton/FloatingChatButton';
import {useTranslation} from 'react-i18next';
import {
  formatCurrency,
  calculateGrowth,
} from '@utils/analytics';
import AnimatedHeader from './AnimatedHeader';
import StickySearchBar from './StickySearchBar';
import AdCarousal from '@components/dashboard/AdCarousal';
import {adData} from '@utils/dummyData';
import {
  CollapsibleContainer,
  CollapsibleScrollView,
  useCollapsibleContext,
  CollapsibleHeaderContainer,
  withCollapsibleContext,
} from '@r0b0t3d/react-native-collapsible';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import withLiveOrder from '@features/delivery/withLiveOrder';

const NOTICE_HEIGHT = -(NoticeHeight + 12);

const DealerDashboard: React.FC = () => {
  const {colors: theme, isDark} = useTheme();
  const {t} = useTranslation('dealer');
  const navigation = useNavigation();
  const {user} = useAuthStore();
  const insets = useSafeAreaInsets();
  const noticePosition = useRef(new RNAnimated.Value(NOTICE_HEIGHT)).current;
  const {scrollY, expand} = useCollapsibleContext();
  const previousScroll = useRef<number>(0);

  const [dealer, setDealer] = useState<IDealer | undefined>(undefined);
  const [isLoadingDealer, setIsLoadingDealer] = useState(true);
  const [dealerError, setDealerError] = useState<Error | null>(null);
  const [orders, setOrders] = useState<IOrderData[]>([]);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchDealerData = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingDealer(false);
      return;
    }
    try {
      setIsLoadingDealer(true);
      setDealerError(null);
      const response = await getBusinessRegistrationByUserId(user.id);
      if (response) {
        const dealerData: IDealer = {
          id: response.id,
          businessName: response.businessName,
          name: user.name || '',
          email: user.email || '',
          phone: response.phone,
          address: response.address,
          status: response.status,
          approvalCode: response.approvalCode,
          createdAt: response.createdAt,
        };
        setDealer(dealerData);
      } else {
        setDealerError(new Error('Business registration not found'));
      }
    } catch (error) {
      setDealerError(error instanceof Error ? error : new Error('Failed to fetch dealer data'));
    } finally {
      setIsLoadingDealer(false);
    }
  }, [user?.id]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, ordersData, productsData, vehiclesData, bookingsData] = await Promise.all([
        getDealerOrderStats(),
        getDealerOrders({limit: 1000}),
        getDealerProducts({limit: 1000}),
        getDealerVehicles({limit: 1000}),
        getBookings(),
      ]);

      setOrderStats(statsData);
      setOrders(ordersData);
      setProducts(productsData.Response?.products || []);
      setVehicles(vehiclesData.Response?.vehicles || []);
      setBookings(bookingsData);
    } catch (error) {
      // Error handling - no fallback per rules
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDealerData();
  }, [fetchDealerData]);

  useEffect(() => {
    if (dealer) {
      fetchDashboardData();
    }
  }, [dealer, fetchDashboardData]);

  const dealerProductIds = useMemo(
    () => products?.filter((product) => product.dealerId === dealer?.id).map((p) => p.id) || [],
    [products, dealer?.id],
  );

  const dealerOrders = useMemo(
    () =>
      orders?.filter((order) => order.items.some((item) => dealerProductIds.includes(item.productId))) || [],
    [orders, dealerProductIds],
  );

  const dealerBookings = useMemo(
    () => bookings?.filter((booking) => booking.dealerId === dealer?.id) || [],
    [bookings, dealer?.id],
  );

  const totalProducts = useMemo(() => products?.length || 0, [products]);
  const totalRevenue = useMemo(() => orderStats?.totalRevenue || 0, [orderStats]);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return (
      dealerOrders
        ?.filter((order) => new Date(order.createdAt) >= startOfMonth)
        .reduce((sum, order) => sum + order.totalAmount, 0) || 0
    );
  }, [dealerOrders]);

  const previousMonthRevenue = useMemo(() => {
    const now = new Date();
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return (
      dealerOrders
        ?.filter(
          (order) =>
            new Date(order.createdAt) >= startOfPreviousMonth &&
            new Date(order.createdAt) <= endOfPreviousMonth,
        )
        .reduce((sum, order) => sum + order.totalAmount, 0) || 0
    );
  }, [dealerOrders]);

  const revenueGrowth = useMemo(
    () => calculateGrowth(monthlyRevenue, previousMonthRevenue),
    [monthlyRevenue, previousMonthRevenue],
  );

  const pendingOrdersCount = useMemo(() => orderStats?.pending || 0, [orderStats]);

  const handleMessagesPress = () => {
    // Navigate to messages screen
  };

  const handleViewAllOrders = () => {
    // Navigate to orders screen
  };

  if (isLoadingDealer) {
    return <DashboardSkeleton />;
  }

  if (dealerError || !dealer) {
    return (
      <View style={{flex: 1, backgroundColor: theme.background}}>
        <Header title={t('dashboard')} />
        <EmptyState title={t('errorLoadingDealer')} message={t('pleaseTryAgain')} icon="alert-circle" />
      </View>
    );
  }

  const currentDate = new Date().toISOString();

  const dynamicStyles = StyleSheet.create({
    backToTopButton: {
      position: 'absolute',
      alignSelf: 'center',
      top: Platform.OS === 'ios' ? screenHeight * 0.18 : 100,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.backgroundTertiary,
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

        <Animated.View style={[dynamicStyles.backToTopButton, backToTopStyle]}>
          <TouchableOpacity
            onPress={() => {
              scrollY.value = 0;
              expand();
            }}
            style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <IconIonicons
              name="arrow-up-circle-outline"
              color={theme.text}
              size={RFValue(12)}
            />
            <CustomText
              variant="h9"
              style={{color: theme.text}}
              fontFamily={Fonts.SemiBold}>
              Back to top
            </CustomText>
          </TouchableOpacity>
        </Animated.View>

        <CollapsibleContainer style={[styles.panelContainer, {marginTop: insets.top || 20}]}>
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
            <View style={styles.contentContainer}>
              <AdCarousal adData={adData} />

            {isLoading ? (
              <View style={styles.skeletonContainer}>
                <SkeletonLoader width="100%" height={120} borderRadius={12} style={{marginBottom: 12}} />
                <View style={styles.statsGrid}>
                  <SkeletonLoader width="31%" height={100} borderRadius={12} />
                  <SkeletonLoader width="31%" height={100} borderRadius={12} />
                  <SkeletonLoader width="31%" height={100} borderRadius={12} />
                </View>
              </View>
            ) : (
              <>
                <WelcomeHeader
                  businessName={dealer.businessName}
                  onMessagePress={handleMessagesPress}
                  hasNotifications={pendingOrdersCount > 0}
                />

                <ProfitCard
                  amount={totalRevenue}
                  label={t('profitAmount')}
                  growth={revenueGrowth}
                  growthLabel={t('fromPreviousWeek')}
                />

                <View style={styles.section}>
                  <View style={styles.statsGrid}>
                    <StatCard
                      icon="package"
                      value={totalProducts}
                      label={t('totalProducts')}
                      style={{width: '31%'}}
                    />
                    <StatCard
                      icon="trending-up"
                      value={formatCurrency(monthlyRevenue)}
                      label={t('monthlyIncome')}
                      trend={{
                        value: revenueGrowth,
                        isPositive: revenueGrowth >= 0,
                      }}
                      style={{width: '31%'}}
                    />
                    <StatCard
                      icon="shopping-bag"
                      value={orderStats?.total || 0}
                      label={t('totalOrders')}
                      style={{width: '31%'}}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </CollapsibleScrollView>
      </CollapsibleContainer>
      <FloatingChatButton />
      </>
    </NoticeAnimation>
  );
};

const styles = StyleSheet.create({
  panelContainer: {
    flex: 1,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 12,
    paddingTop: 0,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: RFValue(16),
    fontWeight: '700',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: RFValue(14),
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentSection: {
    marginTop: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: RFValue(14),
    fontWeight: '600',
    marginBottom: 4,
  },
  recentItemSubtitle: {
    fontSize: RFValue(12),
  },
  viewAllText: {
    fontSize: RFValue(14),
    fontWeight: '600',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: RFValue(14),
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: RFValue(12),
  },
  skeletonContainer: {
    marginBottom: 24,
  },
});

export default withLiveOrder(withCollapsibleContext(DealerDashboard));


