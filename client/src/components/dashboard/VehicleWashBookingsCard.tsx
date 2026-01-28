import React, { FC, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import { getDealerServiceBookings, IServiceBooking, updateServiceBookingStatus } from '@service/serviceBookingService';
import { useTranslation } from 'react-i18next';
import { useToast } from '@hooks/useToast';

interface VehicleWashBookingsCardProps {
  limit?: number;
}

type WashTab = 'upcoming' | 'completed';

const VehicleWashBookingsCard: FC<VehicleWashBookingsCardProps> = ({ limit = 5 }) => {
  const { colors: theme } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<WashTab>('upcoming');
  const [bookings, setBookings] = useState<IServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      if (activeTab === 'upcoming') {
        // Get upcoming bookings (new, scheduled, in_progress) for today
        const [newBookings, scheduledBookings, inProgressBookings] = await Promise.all([
          getDealerServiceBookings({ status: 'new', date: today, limit: 10 }),
          getDealerServiceBookings({ status: 'scheduled', date: today, limit: 10 }),
          getDealerServiceBookings({ status: 'in_progress', date: today, limit: 10 }),
        ]);
        const allBookings = [
          ...newBookings.bookings,
          ...scheduledBookings.bookings,
          ...inProgressBookings.bookings,
        ];
        // Sort by booking time if available
        allBookings.sort((a, b) => {
          if (a.bookingTime && b.bookingTime) {
            return a.bookingTime.localeCompare(b.bookingTime);
          }
          return new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
        });
        setBookings(allBookings.slice(0, limit));
      } else {
        // Get completed bookings for today
        const result = await getDealerServiceBookings({ status: 'completed', date: today, limit });
        setBookings(result.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching wash bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, limit]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleAccept = async (bookingId: string) => {
    try {
      setUpdating(bookingId);
      await updateServiceBookingStatus(bookingId, { status: 'scheduled' });
      showSuccess(t('dealer.bookingAccepted') || 'Booking accepted');
      fetchBookings();
    } catch (error: any) {
      showError(error?.response?.data?.message || t('dealer.failedToAcceptBooking') || 'Failed to accept booking');
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (timeString?: string): string => {
    if (!timeString) return '';
    // Convert 24h to 12h format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new':
        return '#3b82f6'; // blue
      case 'scheduled':
        return '#10b981'; // green
      case 'in_progress':
        return '#f59e0b'; // amber
      case 'completed':
        return '#6b7280'; // gray
      default:
        return theme.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border || 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: theme.text,
    },
    tabsContainer: {
      flexDirection: 'row',
      marginBottom: 12,
      gap: 8,
    },
    tab: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.backgroundSecondary,
    },
    activeTab: {
      backgroundColor: theme.success,
    },
    tabText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Medium,
      color: theme.textSecondary,
    },
    activeTabText: {
      color: theme.white || '#FFFFFF',
    },
    bookingItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border || theme.backgroundSecondary,
    },
    lastBookingItem: {
      borderBottomWidth: 0,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    bookingInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: theme.text,
      marginBottom: 4,
    },
    vehicleInfo: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    serviceType: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
    },
    bookingTime: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
      marginTop: 4,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    acceptButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: theme.primary,
    },
    acceptButtonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: theme.white || '#FFFFFF',
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
    },
    emptyState: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <IconIonicons name="water-outline" size={RFValue(20)} color={theme.text} />
            <CustomText style={styles.title}>
              {t('dealer.todaysBookings') || "Today's Bookings"}
            </CustomText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <IconIonicons name="water-outline" size={RFValue(20)} color={theme.text} />
          <CustomText style={styles.title}>
            {t('dealer.todaysBookings') || "Today's Bookings"}
          </CustomText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}>
          <CustomText style={[styles.tabText, activeTab === 'upcoming' ? styles.activeTabText : {}]}>
            {t('dealer.upcoming') || 'Upcoming'} ({bookings.filter(b => activeTab === 'upcoming' || b.status !== 'completed').length})
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' ? styles.activeTab : {}]}
          onPress={() => setActiveTab('completed')}>
          <CustomText style={[styles.tabText, activeTab === 'completed' ? styles.activeTabText : {}]}>
            {t('dealer.completed') || 'Completed'} ({bookings.filter(b => activeTab === 'completed' || b.status === 'completed').length})
          </CustomText>
        </TouchableOpacity>
      </ScrollView>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <CustomText style={styles.emptyText}>
            {t('dealer.noBookings') || 'No bookings found'}
          </CustomText>
        </View>
      ) : (
        bookings.map((booking, index) => (
          <View
            key={booking.id}
            style={[
              styles.bookingItem,
              index === bookings.length - 1 && styles.lastBookingItem,
            ]}>
            <View style={styles.bookingHeader}>
              <View style={styles.bookingInfo}>
                <CustomText style={styles.customerName}>
                  {booking.customerName || t('dealer.customer') || 'Customer'} ({booking.vehicleName || booking.vehicleInfo?.brand || t('dealer.vehicle') || 'Vehicle'})
                </CustomText>
                <CustomText style={styles.serviceType}>
                  {t('dealer.service') || 'Service'}: {booking.serviceRequest}
                </CustomText>
                <CustomText style={styles.bookingTime}>
                  {t('dealer.bookingTime') || 'Booking Time'}: {formatTime(booking.bookingTime) || t('dealer.notAvailable') || 'N/A'}
                </CustomText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                <CustomText style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {booking.status === 'new' ? t('dealer.new') || 'New' :
                   booking.status === 'in_progress' ? t('dealer.inProgress') || 'In Progress' :
                   booking.status === 'completed' ? t('dealer.completed') || 'Completed' :
                   booking.status.toUpperCase()}
                </CustomText>
              </View>
            </View>
            {activeTab === 'upcoming' && booking.status === 'new' && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(booking.id)}
                  disabled={updating === booking.id}>
                  {updating === booking.id ? (
                    <ActivityIndicator size="small" color={theme.white || '#FFFFFF'} />
                  ) : (
                    <CustomText style={styles.acceptButtonText}>
                      {t('dealer.accept') || 'Accept'}
                    </CustomText>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
};

export default VehicleWashBookingsCard;
