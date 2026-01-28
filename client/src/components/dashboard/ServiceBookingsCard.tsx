import React, { FC, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import { getDealerServiceBookings, IServiceBooking, updateServiceBookingStatus, ServiceBookingStatus } from '@service/serviceBookingService';
import { useTranslation } from 'react-i18next';
import { useToast } from '@hooks/useToast';

interface ServiceBookingsCardProps {
  limit?: number;
}

type BookingTab = 'new' | 'scheduled' | 'in_progress' | 'awaiting';

const ServiceBookingsCard: FC<ServiceBookingsCardProps> = ({ limit = 5 }) => {
  const { colors: theme } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<BookingTab>('new');
  const [bookings, setBookings] = useState<IServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const statusMap: Record<BookingTab, ServiceBookingStatus> = {
        new: 'new',
        scheduled: 'scheduled',
        in_progress: 'in_progress',
        awaiting: 'awaiting',
      };
      const result = await getDealerServiceBookings({ status: statusMap[activeTab], limit });
      setBookings(result.bookings || []);
    } catch (error) {
      console.error('Error fetching service bookings:', error);
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('dealer.today') || 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('dealer.tomorrow') || 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getStatusColor = (status: ServiceBookingStatus): string => {
    switch (status) {
      case 'new':
        return '#3b82f6'; // blue
      case 'scheduled':
        return '#10b981'; // green
      case 'in_progress':
        return '#f59e0b'; // amber
      case 'awaiting':
        return '#ef4444'; // red
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
    serviceRequest: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
    },
    bookingDate: {
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

  const tabs: { key: BookingTab; label: string; count?: number }[] = [
    { key: 'new', label: t('dealer.new') || 'New' },
    { key: 'scheduled', label: t('dealer.scheduled') || 'Scheduled' },
    { key: 'in_progress', label: t('dealer.inProgress') || 'In Progress' },
    { key: 'awaiting', label: t('dealer.awaiting') || 'Awaiting' },
  ];

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <IconIonicons name="document-text-outline" size={RFValue(20)} color={theme.text} />
            <CustomText style={styles.title}>
              {t('dealer.serviceBookings') || 'Service Bookings'}
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
          <IconIonicons name="document-text-outline" size={RFValue(20)} color={theme.text} />
          <CustomText style={styles.title}>
            {t('dealer.serviceBookings') || 'Service Bookings'}
          </CustomText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}>
            <CustomText style={[styles.tabText, activeTab === tab.key ? styles.activeTabText : {}]}>
              {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
            </CustomText>
          </TouchableOpacity>
        ))}
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
                  {booking.customerName || t('dealer.customer') || 'Customer'} {booking.vehicleName ? `(${booking.vehicleName})` : ''}
                </CustomText>
                <CustomText style={styles.serviceRequest}>
                  {t('dealer.request') || 'Request'}: {booking.serviceRequest}
                </CustomText>
                <CustomText style={styles.bookingDate}>
                  {t('dealer.bookingDate') || 'Booking Date'}: {formatDate(booking.bookingDate)}
                  {booking.bookingTime && ` ${booking.bookingTime}`}
                </CustomText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                <CustomText style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {booking.status === 'new' ? t('dealer.new') || 'New' :
                   booking.status === 'scheduled' ? t('dealer.scheduled') || 'Scheduled' :
                   booking.status === 'in_progress' ? t('dealer.inProgress') || 'In Progress' :
                   booking.status === 'awaiting' ? t('dealer.awaiting') || 'Awaiting' :
                   booking.status === 'completed' ? t('dealer.completed') || 'Completed' :
                   booking.status.replace('_', ' ').toUpperCase()}
                </CustomText>
              </View>
            </View>
            {activeTab === 'new' && (
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

export default ServiceBookingsCard;
