import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated as RNAnimated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { resetAndNavigate } from '@utils/NavigationUtils';
import { NoticeHeight, screenHeight } from '@utils/Scaling';
import NoticeAnimation from './NoticeAnimation';
import Visuals from './Visuals';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import {
  getDealerOrderStats,
  getDealerOrders,
  getDealerProducts,
  getDealerVehicles,
  getBusinessRegistrationByUserId,
  getBookings,
  IBusinessRegistration,
} from '@service/dealerService';
import { IDealer, IBooking } from '../../types/dealer/IDealer';
import { IOrderData } from '../../types/order/IOrder';
import { IProduct } from '../../types/product/IProduct';
import { IDealerVehicle } from '../../types/vehicle/IVehicle';
import Header from '@components/common/Header/Header';
import Loader from '@components/common/Loader/Loader';
import SkeletonLoader, { DashboardSkeleton, DashboardContentSkeleton } from '@components/common/Skeleton/SkeletonLoader';
import EmptyState from '@components/common/EmptyState/EmptyState';
import StatCard from '@components/common/StatCard/StatCard';
import ProfitCard from '@components/common/ProfitCard/ProfitCard';
import WelcomeHeader from '@components/common/WelcomeHeader/WelcomeHeader';
import { useTranslation } from 'react-i18next';
import {
  formatCurrency,
  calculateGrowth,
  calculateAverageOrderValue,
  calculateConversionRate,
  calculateCancellationRate,
} from '@utils/analytics';
import AnimatedHeader from './AnimatedHeader';
import StickySearchBar from './StickySearchBar';
import AdCarousal from '@components/dashboard/AdCarousal';
import { adData } from '@utils/dummyData';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';
import LottieView from 'lottie-react-native';
import {
  CollapsibleContainer,
  CollapsibleScrollView,
  useCollapsibleContext,
  CollapsibleHeaderContainer,
  withCollapsibleContext,
} from '@r0b0t3d/react-native-collapsible';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import withLiveOrder from '@features/delivery/withLiveOrder';
import CustomerEnquiriesCard from '@components/dashboard/CustomerEnquiriesCard';
import ServiceBookingsCard from '@components/dashboard/ServiceBookingsCard';
import WorkshopTasksCard from '@components/dashboard/WorkshopTasksCard';
import VehicleWashBookingsCard from '@components/dashboard/VehicleWashBookingsCard';
import StationOpenToggle from '@components/dashboard/StationOpenToggle';
import DealerInventorySection from '@components/dashboard/DealerInventorySection';

const NOTICE_HEIGHT = -(NoticeHeight + 12);

const DealerDashboard: React.FC = () => {
  const { colors: theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const noticePosition = useRef(new RNAnimated.Value(NOTICE_HEIGHT)).current;
  const { scrollY, expand } = useCollapsibleContext();
  const previousScroll = useRef<number>(0);
  const seasonalTheme = useSeasonalTheme();

  const [dealer, setDealer] = useState<IDealer | undefined>(undefined);
  const [businessRegistration, setBusinessRegistration] = useState<IBusinessRegistration | null>(null);
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
    const opacity = withTiming(isScrollingUp ? 1 : 0, { duration: 300 });
    const translateY = withTiming(isScrollingUp ? 0 : 10, { duration: 300 });

    previousScroll.current = scrollY.value;

    return {
      opacity,
      transform: [{ translateY }],
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
        setBusinessRegistration(response);
      } else {
        // No registration found - allow dashboard to render with empty states
        setDealer(undefined);
        setBusinessRegistration(null);
      }
    } catch (error) {
      // Handle error but don't block dashboard rendering
      setDealerError(error instanceof Error ? error : new Error('Failed to fetch dealer data'));
      setDealer(undefined);
      setBusinessRegistration(null);
    } finally {
      setIsLoadingDealer(false);
    }
  }, [user?.id]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, ordersData, productsData, vehiclesData, bookingsData] = await Promise.all([
        getDealerOrderStats(),
        getDealerOrders({ limit: 1000 }),
        getDealerProducts({ limit: 1000 }),
        getDealerVehicles({ limit: 1000 }),
        getBookings(),
      ]);

      setOrderStats(statsData);
      setOrders(ordersData);
      setProducts(productsData.Response?.products || []);
      setVehicles(vehiclesData.Response?.vehicles || []);
      setBookings(bookingsData);
    } catch (error) {
      // Handle API errors gracefully - APIs will fail without approved registration
      // Set empty defaults so UI can still render with appropriate messages
      setOrderStats({ total: 0, totalRevenue: 0 });
      setOrders([]);
      setProducts([]);
      setVehicles([]);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDealerData();
  }, [fetchDealerData]);

  useEffect(() => {
    // Fetch dashboard data after dealer loading completes, but only if registration exists
    if (!isLoadingDealer && businessRegistration) {
      fetchDashboardData();
    }
  }, [isLoadingDealer, businessRegistration, fetchDashboardData]);

  // Redirect to business registration if no registration exists
  useEffect(() => {
    if (!isLoadingDealer && !businessRegistration && user?.id) {
      resetAndNavigate('BusinessRegistration');
    }
  }, [isLoadingDealer, businessRegistration, user?.id]);

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
  const totalVehicles = useMemo(() => vehicles?.length || 0, [vehicles]);
  const totalRevenue = useMemo(() => orderStats?.totalRevenue || 0, [orderStats]);

  const productCategoriesCount = useMemo(() => {
    if (!products || products.length === 0) return 0;
    const uniqueCategories = new Set(
      products.filter((p) => p.category).map((p) => p.category),
    );
    return uniqueCategories.size;
  }, [products]);

  const availableVehicles = useMemo(
    () => vehicles?.filter((v) => v.availability === 'available').length || 0,
    [vehicles],
  );

  const soldVehicles = useMemo(
    () => vehicles?.filter((v) => v.availability === 'sold').length || 0,
    [vehicles],
  );

  const totalSold = useMemo(() => soldVehicles || orderStats?.total || 0, [soldVehicles, orderStats]);

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

  const averageOrderValue = useMemo(
    () => calculateAverageOrderValue(dealerOrders, totalRevenue),
    [dealerOrders, totalRevenue],
  );

  const conversionRate = useMemo(
    () => calculateConversionRate(dealerOrders.length, dealerBookings.length),
    [dealerOrders.length, dealerBookings.length],
  );

  const cancellationRate = useMemo(
    () => calculateCancellationRate(orderStats?.cancelled || 0, orderStats?.total || 0),
    [orderStats],
  );

  const recentOrders = useMemo(
    () =>
      dealerOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [dealerOrders],
  );

  const recentBookings = useMemo(
    () =>
      dealerBookings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [dealerBookings],
  );

  const pendingOrdersCount = useMemo(() => orderStats?.pending || 0, [orderStats]);

  // Redirect to business registration only if no registration exists OR status is rejected
  // Allow access if registration exists (even if pending)
  useEffect(() => {
    if (!isLoadingDealer && user?.id) {
      if (!businessRegistration || (businessRegistration && businessRegistration.status === 'rejected')) {
        resetAndNavigate('BusinessRegistration');
      }
    }
  }, [isLoadingDealer, businessRegistration, user?.id]);

  const handleMessagesPress = () => {
    // Navigate to messages screen if available
    // (navigation as any).navigate('Messages');
  };

  const handleViewAllOrders = () => {
    (navigation as any).navigate('DealerTabs', { screen: 'Orders' });
  };

  if (isLoadingDealer) {
    return <DashboardSkeleton />;
  }

  // Don't render dashboard if no registration or rejected - will redirect
  if (!businessRegistration || (businessRegistration && businessRegistration.status === 'rejected')) {
    return <DashboardSkeleton />;
  }

  // Determine registration status for displaying appropriate messages

  // Determine business type for conditional rendering
  const businessType = businessRegistration?.type;
  const isAutomobileDealer = businessType === 'Automobile Showroom';
  const isBikeDealer = businessType === 'Bike Dealer';
  const isMechanicWorkshop = businessType === 'Mechanic Workshop';
  const isVehicleWash = businessType === 'Vehicle Wash Station';
  const registrationStatus = businessRegistration?.status || 'none';
  const showRejectedMessage = registrationStatus === 'rejected';
  const isApproved = registrationStatus === 'approved';

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
        <Visuals showOverlay={false} />

        <Animated.View style={[dynamicStyles.backToTopButton, backToTopStyle]}>
          <TouchableOpacity
            onPress={() => {
              scrollY.value = 0;
              expand();
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconIonicons
              name="arrow-up-circle-outline"
              color={theme.text}
              size={RFValue(12)}
            />
            <CustomText
              variant="h9"
              style={{ color: theme.text }}
              fontFamily={Fonts.SemiBold}>
              Back to top
            </CustomText>
          </TouchableOpacity>
        </Animated.View>

        <CollapsibleContainer style={[styles.panelContainer, { marginTop: insets.top || 20 }]}>
          <CollapsibleHeaderContainer containerStyle={styles.transparent}>
            <AnimatedHeader
              showNotice={() => {
                slideDown();
                const timeoutId = setTimeout(() => {
                  slideUp();
                }, 3500);
                return () => clearTimeout(timeoutId);
              }}
              title={dealer?.businessName || user?.name || ''}
              subtitle={dealer?.address || ''}
            />
            <StickySearchBar showCategoryButtons={false} />
            
            {/* Train Effect Below Search Bar */}
            {seasonalTheme.animations.overlay && (
              <View style={styles.trainEffectBelow}>
                <LottieView
                  autoPlay
                  loop
                  speed={1}
                  style={styles.trainAnimation}
                  source={seasonalTheme.animations.overlay}
                />
              </View>
            )}
            
          </CollapsibleHeaderContainer>

          <CollapsibleScrollView
            nestedScrollEnabled
            style={styles.panelContainer}
            showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              <AdCarousal adData={adData} />

              {isLoading ? (
                <View style={styles.skeletonContainer}>
                  <DashboardContentSkeleton />
                </View>
              ) : (
                <>
                  {/* Show registration status messages */}
                  {/* Pending approval banner removed - no need to show it */}
                  {showRejectedMessage && (
                    <View style={[styles.statusBanner, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
                      <CustomText style={[styles.statusBannerText, { color: '#991b1b' }]}>
                        {t('dealer.dealershipRejected') || 'Your business registration was rejected. Please update your registration to reapply.'}
                      </CustomText>
                      <TouchableOpacity
                        style={[styles.statusBannerButton, { backgroundColor: '#ef4444' }]}
                        onPress={() => (navigation as any).navigate('BusinessRegistration')}>
                        <CustomText style={styles.statusBannerButtonText}>
                          {t('dealer.updateRegistration') || 'Update Registration'}
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={{ height: 12 }} />

                  {/* Conditional rendering based on business type */}
                  {(isAutomobileDealer || isBikeDealer) && (
                    <>
                      {/* Customer Enquiries for Automobile/Bike Dealers */}
                      <CustomerEnquiriesCard limit={2} />

                      {/* Quick Actions Card - Navigate to QuickActionsScreen */}
                      <TouchableOpacity
                        style={[styles.section, { backgroundColor: theme.cardBackground, borderRadius: 12, padding: 16 }]}
                        onPress={() => (navigation as any).navigate('QuickActions')}>
                        <View style={styles.sectionHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <IconIonicons name="flash-outline" size={RFValue(20)} color={theme.text} />
                            <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={[styles.sectionTitle, { color: theme.text }]}>
                              {t('dealer.quickActions') || 'Quick Actions'}
                            </CustomText>
                          </View>
                          <IconIonicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                          <TouchableOpacity
                            style={{ flex: 1, backgroundColor: theme.primary + '20', padding: 12, borderRadius: 8 }}
                            onPress={() => (navigation as any).navigate('AddEditVehicle')}>
                            <IconIonicons name="add-circle-outline" size={RFValue(24)} color={theme.primary} />
                            <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={{ color: theme.text, marginTop: 8 }}>
                              {t('dealer.addNewCarDetails') || 'Add New Car Details'}
                            </CustomText>
                            <CustomText variant="h8" style={{ color: theme.textSecondary, marginTop: 4 }}>
                              {t('dealer.listNewVehicle') || 'List a new vehicle available for sale.'}
                            </CustomText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{ flex: 1, backgroundColor: theme.secondary + '20', padding: 12, borderRadius: 8 }}
                            onPress={() => (navigation as any).navigate('PreBookingManagement')}>
                            <IconIonicons name="calendar-outline" size={RFValue(24)} color={theme.secondary} />
                            <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={{ color: theme.text, marginTop: 8 }}>
                              {t('dealer.managePreBookings') || 'Manage Pre-Bookings'}
                            </CustomText>
                            <CustomText variant="h8" style={{ color: theme.textSecondary, marginTop: 4 }}>
                              {t('dealer.handleUpcomingLaunches') || 'Handle upcoming launches and pre-orders.'}
                            </CustomText>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>

                      {/* Upcoming Test Drives */}
                      <TouchableOpacity
                        style={[styles.section, { backgroundColor: theme.cardBackground, borderRadius: 12, padding: 16 }]}
                        onPress={() => (navigation as any).navigate('QuickActions', { initialTab: 'test-drive' })}>
                        <View style={styles.sectionHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <IconIonicons name="car-outline" size={RFValue(20)} color={theme.text} />
                            <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={[styles.sectionTitle, { color: theme.text }]}>
                              {t('dealer.upcomingTestDrives') || 'Upcoming Test Drives'}
                            </CustomText>
                          </View>
                          <IconIonicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Mechanic Workshop Dashboard */}
                  {isMechanicWorkshop && (
                    <>
                      <StationOpenToggle label={t('dealer.workshopOpen') || 'Workshop Open'} icon="construct-outline" />
                      <ServiceBookingsCard limit={5} />
                      <WorkshopTasksCard limit={3} />
                    </>
                  )}

                  {/* Vehicle Wash Dashboard */}
                  {isVehicleWash && (
                    <>
                      <StationOpenToggle label={t('dealer.stationOpen') || 'Station Open'} icon="storefront-outline" />
                      <VehicleWashBookingsCard limit={5} />
                    </>
                  )}

                  <ProfitCard
                    amount={totalRevenue}
                    label={t('dealer.profitAmount')}
                    growth={revenueGrowth}
                    growthLabel={t('dealer.fromPreviousWeek')}
                  />

                  {/* Order Statistics */}
                  <View style={styles.section}>
                    <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={[styles.sectionTitle, { color: theme.text }]}>
                      {t('dealer.orders') || 'Orders'}
                    </CustomText>
                    <View style={styles.statsGrid}>
                      <StatCard
                        icon="receipt-outline"
                        value={orderStats?.total || 0}
                        label={t('dealer.totalOrders') || 'Total Orders'}
                        style={{ width: '48%' }}
                      />
                      <StatCard
                        icon="cash-outline"
                        value={formatCurrency(averageOrderValue)}
                        label={t('dealer.averageOrderValue') || 'Average Order Value'}
                        style={{ width: '48%' }}
                      />
                      <StatCard
                        icon="trending-up-outline"
                        value={`${conversionRate.toFixed(1)}%`}
                        label={t('dealer.conversionRate') || 'Conversion Rate'}
                        style={{ width: '48%' }}
                      />
                      <StatCard
                        icon="close-circle-outline"
                        value={`${cancellationRate.toFixed(1)}%`}
                        label={t('dealer.cancellationRate') || 'Cancellation Rate'}
                        style={{ width: '48%' }}
                      />
                    </View>
                  </View>

                  {/* Recent Activity */}
                  {(recentOrders.length > 0 || recentBookings.length > 0) && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={[styles.sectionTitle, { color: theme.text }]}>
                          {t('dealer.recentActivity') || 'Recent Activity'}
                        </CustomText>
                        <TouchableOpacity onPress={handleViewAllOrders}>
                          <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={[styles.viewAllText, { color: theme.secondary }]}>
                            {t('dealer.viewAll') || 'View All'}
                          </CustomText>
                        </TouchableOpacity>
                      </View>

                      {recentOrders.length > 0 && (
                        <View style={styles.recentSection}>
                          <CustomText variant="h6" fontFamily={Fonts.Medium} style={[styles.subsectionTitle, { color: theme.textSecondary }]}>
                            {t('dealer.recentOrders') || 'Recent Orders'}
                          </CustomText>
                          {recentOrders.map((order) => (
                            <TouchableOpacity
                              key={order.id}
                              style={[styles.recentItem, { backgroundColor: theme.cardBackground }]}
                              onPress={handleViewAllOrders}>
                              <View style={styles.recentItemContent}>
                                <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={[styles.recentItemTitle, { color: theme.text }]}>
                                  {t('dealer.orderNumber') || 'Order'}: {order.id.slice(0, 8)}
                                </CustomText>
                                <CustomText variant="h8" style={[styles.recentItemSubtitle, { color: theme.textSecondary }]}>
                                  {formatCurrency(order.totalAmount)} • {order.status}
                                </CustomText>
                              </View>
                              <IconIonicons name="chevron-forward" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {recentBookings.length > 0 && (
                        <View style={styles.recentSection}>
                          <CustomText variant="h6" fontFamily={Fonts.Medium} style={[styles.subsectionTitle, { color: theme.textSecondary }]}>
                            {t('dealer.recentBookings') || 'Recent Bookings'}
                          </CustomText>
                          {recentBookings.map((booking) => (
                            <TouchableOpacity
                              key={booking.id}
                              style={[styles.recentItem, { backgroundColor: theme.cardBackground }]}>
                              <View style={styles.recentItemContent}>
                                <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={[styles.recentItemTitle, { color: theme.text }]}>
                                  {booking.serviceName || 'Service Booking'}
                                </CustomText>
                                <CustomText variant="h8" style={[styles.recentItemSubtitle, { color: theme.textSecondary }]}>
                                  {new Date(booking.createdAt).toLocaleDateString()} • {booking.status}
                                </CustomText>
                              </View>
                              <IconIonicons name="chevron-forward" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Inventory Section - Conditionally show based on business type */}
                  {((isAutomobileDealer || isBikeDealer) && (vehicles.length > 0 || products.length > 0)) && (
                    <DealerInventorySection products={products} vehicles={vehicles} services={[]} />
                  )}
                  {isMechanicWorkshop && (
                    <View style={styles.section}>
                      <TouchableOpacity onPress={() => (navigation as any).navigate('DealerTabs', { screen: 'Inventory' })}>
                        <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={[styles.sectionTitle, { color: theme.text }]}>
                          {t('dealer.inventory') || 'Inventory'} - {t('dealer.services') || 'Services'}
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  )}
                  {isVehicleWash && (
                    <View style={styles.section}>
                      <TouchableOpacity onPress={() => (navigation as any).navigate('DealerTabs', { screen: 'Inventory' })}>
                        <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={[styles.sectionTitle, { color: theme.text }]}>
                          {t('dealer.inventory') || 'Inventory'} - {t('dealer.services') || 'Services'}
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Quick Insights */}
                  {pendingOrdersCount > 0 && (
                    <View style={styles.section}>
                      <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={[styles.sectionTitle, { color: theme.text }]}>
                        {t('dealer.quickInsights') || 'Quick Insights'}
                      </CustomText>
                      <View style={[styles.insightCard, { backgroundColor: theme.warning + '20' }]}>
                        <IconIonicons name="alert-circle" size={24} color={theme.warning} />
                        <View style={styles.insightContent}>
                          <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={[styles.insightTitle, { color: theme.text }]}>
                            {t('dealer.pendingActions') || 'Pending Actions'}
                          </CustomText>
                          <CustomText variant="h8" style={[styles.insightText, { color: theme.textSecondary }]}>
                            {pendingOrdersCount} {t('dealer.pendingOrders') || 'pending orders'} require your attention
                          </CustomText>
                        </View>
                      </View>
                    </View>
                  )}

                </>
              )}
            </View>
          </CollapsibleScrollView>
        </CollapsibleContainer>
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
  statusBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  statusBannerText: {
    fontSize: RFValue(13),
    fontFamily: Fonts.Medium,
    marginBottom: 12,
    lineHeight: RFValue(18),
  },
  statusBannerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBannerButtonText: {
    color: '#fff',
    fontSize: RFValue(13),
    fontFamily: Fonts.SemiBold,
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
  trainEffectBelow: {
    width: '100%',
    height: 150,
    position: 'relative',
    marginTop: -20,
    marginBottom: -16,
    zIndex: 3,
  },
  trainAnimation: {
    width: '100%',
    height: '100%',
  },
});

export default withLiveOrder(withCollapsibleContext(DealerDashboard));
