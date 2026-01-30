import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDealerTestDrives } from '@service/testDriveService';
import { getDealerPreBookings } from '@service/preBookingService';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { screenWidth } from '@utils/Scaling';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '@components/common/EmptyState/EmptyState';
import { ITestDrive } from '../../types/testDrive/ITestDrive';
import { IPreBooking } from '../../types/preBooking/IPreBooking';
import { useToast } from '@hooks/useToast';
import { useBusinessRegistration } from '@hooks/useBusinessRegistration';

const QuickActionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors: theme } = useTheme();
  const { t } = useTranslation();
  const { showError } = useToast();
  const { businessRegistration } = useBusinessRegistration();
  const [activeTab, setActiveTab] = useState<'test-drive' | 'upcoming-bookings' | 'pre-bookings'>('test-drive');
  const [testDrives, setTestDrives] = useState<ITestDrive[]>([]);
  const [preBookings, setPreBookings] = useState<IPreBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<ScrollView>(null);
  const initializedStatusRef = useRef<string | null>(null);

  // Prevent any banners from showing on this screen
  // No banner rendering logic - banners are not needed on Drive section

  const tabOrder = useMemo(() => ['test-drive', 'upcoming-bookings', 'pre-bookings'] as const, []);
  const activeIndex = useMemo(() => tabOrder.indexOf(activeTab), [activeTab, tabOrder]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [testDrivesData, preBookingsData] = await Promise.all([
        getDealerTestDrives({ limit: 100 }),
        getDealerPreBookings({ limit: 100 }),
      ]);

      if (testDrivesData.success && testDrivesData.Response) {
        setTestDrives(testDrivesData.Response.testDrives || []);
      }

      if (preBookingsData.success && preBookingsData.Response) {
        setPreBookings(preBookingsData.Response.preBookings || []);
      }
    } catch (error: any) {
      // Suppress errors related to pending registration approval - no need to show banner/toast
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const isPendingApprovalError = 
        errorMessage.toLowerCase().includes('pending') ||
        errorMessage.toLowerCase().includes('wait for approval') ||
        errorMessage.toLowerCase().includes('admin approval') ||
        error?.response?.status === 403;
      
      // Only show error if it's not related to pending approval
      if (!isPendingApprovalError) {
        showError(errorMessage || 'Failed to load data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  // Initialize data based on registration status (only once per status change)
  useEffect(() => {
    const registrationStatus = businessRegistration?.status;
    const statusKey = `${registrationStatus || 'none'}`;
    
    // Only initialize if status has changed or hasn't been initialized yet
    if (initializedStatusRef.current === statusKey) return;
    
    if (registrationStatus === 'pending') {
      // For pending status, just set empty arrays - no need to fetch or show errors
      // Only set if not already empty to avoid unnecessary re-renders
      setTestDrives(prev => prev.length === 0 ? prev : []);
      setPreBookings(prev => prev.length === 0 ? prev : []);
      setLoading(false);
      initializedStatusRef.current = statusKey;
    } else if (registrationStatus === 'approved' || !businessRegistration) {
      // For approved or no registration, fetch data
      fetchData();
      initializedStatusRef.current = statusKey;
    }
  }, [businessRegistration?.status, fetchData]);

  // Only refetch on focus if registration is approved
  useFocusEffect(
    useCallback(() => {
      if (businessRegistration?.status === 'approved') {
        fetchData();
      }
    }, [fetchData, businessRegistration?.status]),
  );

  const scrollToTab = useCallback(
    (tab: (typeof tabOrder)[number]) => {
      const index = tabOrder.indexOf(tab);
      if (index < 0) return;
      setActiveTab(tab);
      pagerRef.current?.scrollTo({ x: index * screenWidth, y: 0, animated: true });
    },
    [tabOrder],
  );

  const onPagerMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      if (index >= 0 && index < tabOrder.length) {
        setActiveTab(tabOrder[index]);
      }
    },
    [tabOrder],
  );

  // Get upcoming bookings (test drives + pre-bookings)
  const upcomingBookings = useMemo(() => {
    const upcomingTestDrives = testDrives.filter(
      (td) => ['pending', 'approved'].includes(td.status) && new Date(td.preferredDate) >= new Date(),
    );
    const upcomingPreBookings = preBookings.filter(
      (pb) => ['pending', 'confirmed'].includes(pb.status) && new Date(pb.bookingDate) >= new Date(),
    );
    return [...upcomingTestDrives, ...upcomingPreBookings].sort((a, b) => {
      const dateA = 'preferredDate' in a ? new Date(a.preferredDate) : new Date(a.bookingDate);
      const dateB = 'preferredDate' in b ? new Date(b.preferredDate) : new Date(b.bookingDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [testDrives, preBookings]);

  const getStatusColor = (status: string, type: 'test-drive' | 'pre-booking') => {
    if (type === 'test-drive') {
      switch (status) {
        case 'approved':
          return theme.success || '#4CAF50';
        case 'rejected':
          return theme.error || '#f44336';
        case 'completed':
          return theme.secondary || '#2196F3';
        case 'cancelled':
          return theme.textSecondary || '#757575';
        default:
          return theme.warning || '#FF9800';
      }
    } else {
      switch (status) {
        case 'confirmed':
          return theme.success || '#4CAF50';
        case 'cancelled':
          return theme.error || '#f44336';
        default:
          return theme.warning || '#FF9800';
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingVertical: 12,
      gap: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 8,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabText: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: theme.textSecondary,
    },
    pager: {
      flex: 1,
    },
    listContent: {
      padding: 16,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.SemiBold,
      color: '#FFFFFF',
    },
    vehicleInfo: {
      marginBottom: 8,
    },
    dateTime: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
  });

  const renderTestDriveItem = ({ item }: { item: ITestDrive }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => (navigation as any).navigate('TestDriveManagement')}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
          {t('dealer.testDriveRequest') || 'Test Drive Request'}
        </CustomText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, 'test-drive') }]}>
          <CustomText style={styles.statusText}>{item.status.toUpperCase()}</CustomText>
        </View>
      </View>
      <View style={styles.vehicleInfo}>
        <CustomText variant="h8" style={{ color: theme.textSecondary }}>
          {t('dealer.vehicleId') || 'Vehicle ID'}: {item.vehicleId.slice(0, 8)}...
        </CustomText>
      </View>
      <View style={styles.dateTime}>
        <Icon name="calendar-outline" size={RFValue(16)} color={theme.textSecondary} />
        <CustomText variant="h8" style={{ color: theme.textSecondary, marginLeft: 8 }}>
          {new Date(item.preferredDate).toLocaleDateString()} {t('dealer.at') || 'at'} {item.preferredTime}
        </CustomText>
      </View>
      {item.notes && (
        <CustomText variant="h8" style={{ color: theme.textSecondary, marginTop: 8 }}>
          {t('dealer.notes') || 'Notes'}: {item.notes}
        </CustomText>
      )}
    </TouchableOpacity>
  );

  const renderPreBookingItem = ({ item }: { item: IPreBooking }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => (navigation as any).navigate('PreBookingManagement')}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
          {t('dealer.preBookingRequest') || 'Pre-Booking Request'}
        </CustomText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, 'pre-booking') }]}>
          <CustomText style={styles.statusText}>{item.status.toUpperCase()}</CustomText>
        </View>
      </View>
      <View style={styles.vehicleInfo}>
        <CustomText variant="h8" style={{ color: theme.textSecondary }}>
          {t('dealer.vehicleId') || 'Vehicle ID'}: {item.vehicleId.slice(0, 8)}...
        </CustomText>
      </View>
      <View style={styles.dateTime}>
        <Icon name="calendar-outline" size={RFValue(16)} color={theme.textSecondary} />
        <CustomText variant="h8" style={{ color: theme.textSecondary, marginLeft: 8 }}>
          {new Date(item.bookingDate).toLocaleDateString()}
        </CustomText>
      </View>
      {item.notes && (
        <CustomText variant="h8" style={{ color: theme.textSecondary, marginTop: 8 }}>
          {t('dealer.notes') || 'Notes'}: {item.notes}
        </CustomText>
      )}
    </TouchableOpacity>
  );

  const renderUpcomingBookingItem = ({ item }: { item: ITestDrive | IPreBooking }) => {
    if ('preferredDate' in item) {
      return renderTestDriveItem({ item: item as ITestDrive });
    } else {
      return renderPreBookingItem({ item: item as IPreBooking });
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={t('dealer.quickActions') || 'Quick Actions'} />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'test-drive' && { backgroundColor: theme.secondary + '20', borderBottomColor: theme.secondary },
          ]}
          onPress={() => scrollToTab('test-drive')}>
          <Icon
            name="car-sport-outline"
            size={RFValue(16)}
            color={activeTab === 'test-drive' ? theme.secondary : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{ color: activeTab === 'test-drive' ? theme.secondary : theme.textSecondary }}
            numberOfLines={1}>
            {t('dealer.testDrive') || 'Test Drive'}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming-bookings' && { backgroundColor: theme.secondary + '20', borderBottomColor: theme.secondary },
          ]}
          onPress={() => scrollToTab('upcoming-bookings')}>
          <Icon
            name="calendar-outline"
            size={RFValue(16)}
            color={activeTab === 'upcoming-bookings' ? theme.secondary : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{ color: activeTab === 'upcoming-bookings' ? theme.secondary : theme.textSecondary }}
            numberOfLines={1}>
            {t('dealer.upcoming') || 'Upcoming'}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pre-bookings' && { backgroundColor: theme.secondary + '20', borderBottomColor: theme.secondary },
          ]}
          onPress={() => scrollToTab('pre-bookings')}>
          <Icon
            name="bookmark-outline"
            size={RFValue(16)}
            color={activeTab === 'pre-bookings' ? theme.secondary : theme.textSecondary}
          />
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={{ color: activeTab === 'pre-bookings' ? theme.secondary : theme.textSecondary }}
            numberOfLines={1}>
            {t('dealer.preBookings') || 'Pre-Bookings'}
          </CustomText>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerMomentumEnd}
        contentOffset={{ x: activeIndex * screenWidth, y: 0 }}
        style={styles.pager}>
        <View style={{ width: screenWidth }}>
          <FlatList
            data={testDrives}
            renderItem={renderTestDriveItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchData();
                }}
                tintColor={theme.secondary}
                colors={[theme.secondary]}
              />
            }
            ListEmptyComponent={
              activeTab === 'test-drive' ? (
                <EmptyState 
                  icon="car-outline" 
                  title={t('dealer.noTestDrives') || 'No Test Drives'} 
                  message={t('dealer.noTestDrivesMessage') || 'No test drive requests found'} 
                />
              ) : null
            }
          />
        </View>

        <View style={{ width: screenWidth }}>
          <FlatList
            data={upcomingBookings}
            renderItem={renderUpcomingBookingItem}
            keyExtractor={(item) => ('preferredDate' in item ? item.id : item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchData();
                }}
                tintColor={theme.secondary}
                colors={[theme.secondary]}
              />
            }
            ListEmptyComponent={
              activeTab === 'upcoming-bookings' ? (
                <EmptyState 
                  icon="calendar-outline" 
                  title={t('dealer.noUpcomingBookings') || 'No Upcoming Bookings'} 
                  message={t('dealer.noUpcomingBookingsMessage') || 'No upcoming bookings found'} 
                />
              ) : null
            }
          />
        </View>

        <View style={{ width: screenWidth }}>
          <FlatList
            data={preBookings}
            renderItem={renderPreBookingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchData();
                }}
                tintColor={theme.secondary}
                colors={[theme.secondary]}
              />
            }
            ListEmptyComponent={
              activeTab === 'pre-bookings' ? (
                <EmptyState 
                  icon="bookmark-outline" 
                  title={t('dealer.noPreBookings') || 'No Pre-Bookings'} 
                  message={t('dealer.noPreBookingsMessage') || 'No pre-booking requests found'} 
                />
              ) : null
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default QuickActionsScreen;

