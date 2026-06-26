import React, { FC, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import {
  getDealerServiceBookings,
  IServiceBooking,
  updateServiceBookingStatus,
  ServiceBookingStatus,
} from '@service/serviceBookingService';
import { useTranslation } from 'react-i18next';
import { useToast } from '@hooks/useToast';
import { BASE_URL } from '@service/config';
import { tokenStorage } from '@state/storage';

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

  const handleDownloadInvoice = async (bookingId: string) => {
    const token = tokenStorage.getString('accessToken');
    if (!token) return;
    const url = `${BASE_URL}/invoices/service/${bookingId}?token=${token}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error opening service receipt:', error);
    }
  };

  // Rejection modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

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
      showError(
        error?.response?.data?.message ||
          t('dealer.failedToAcceptBooking') ||
          'Failed to accept booking',
      );
    } finally {
      setUpdating(null);
    }
  };

  const openRejectModal = (bookingId: string) => {
    setRejectingBookingId(bookingId);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingBookingId) return;
    if (!rejectionReason.trim()) {
      showError(t('dealer.rejectionReasonRequired') || 'Please enter a rejection reason');
      return;
    }
    try {
      setUpdating(rejectingBookingId);
      setRejectModalVisible(false);
      await updateServiceBookingStatus(rejectingBookingId, {
        status: 'cancelled',
        rejectionReason: rejectionReason.trim(),
      });
      showSuccess(t('dealer.bookingRejected') || 'Booking rejected');
      fetchBookings();
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          t('dealer.failedToRejectBooking') ||
          'Failed to reject booking',
      );
    } finally {
      setUpdating(null);
      setRejectingBookingId(null);
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
        return '#3b82f6';
      case 'scheduled':
        return '#10b981';
      case 'in_progress':
        return '#f59e0b';
      case 'awaiting':
        return '#ef4444';
      case 'completed':
        return '#6b7280';
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
      ...fontStyle(Fonts.SemiBold),
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
      ...fontStyle(Fonts.Medium),
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
      ...fontStyle(Fonts.SemiBold),
      color: theme.text,
      marginBottom: 4,
    },
    vehicleInfo: {
      fontSize: RFValue(12),
      ...fontStyle(Fonts.Regular),
      color: theme.textSecondary,
      marginBottom: 2,
    },
    serviceRequest: {
      fontSize: RFValue(12),
      ...fontStyle(Fonts.Regular),
      color: theme.textSecondary,
    },
    bookingDate: {
      fontSize: RFValue(11),
      ...fontStyle(Fonts.Regular),
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
      ...fontStyle(Fonts.SemiBold),
      color: theme.white || '#FFFFFF',
    },
    rejectButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: '#ef4444',
    },
    rejectButtonText: {
      fontSize: RFValue(11),
      ...fontStyle(Fonts.SemiBold),
      color: '#FFFFFF',
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: RFValue(10),
      ...fontStyle(Fonts.Medium),
    },
    emptyState: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: RFValue(12),
      ...fontStyle(Fonts.Regular),
      color: theme.textSecondary,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalTitle: {
      fontSize: RFValue(16),
      ...fontStyle(Fonts.Bold),
      color: theme.text,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: RFValue(12),
      ...fontStyle(Fonts.Regular),
      color: theme.textSecondary,
      marginBottom: 16,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.border || '#ccc',
      borderRadius: 8,
      padding: 12,
      fontSize: RFValue(13),
      ...fontStyle(Fonts.Regular),
      color: theme.text,
      backgroundColor: theme.backgroundSecondary,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border || '#ccc',
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: RFValue(13),
      ...fontStyle(Fonts.Medium),
      color: theme.text,
    },
    modalConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#ef4444',
      alignItems: 'center',
    },
    modalConfirmText: {
      fontSize: RFValue(13),
      ...fontStyle(Fonts.SemiBold),
      color: '#FFFFFF',
    },
  });

  const tabs: { key: BookingTab; label: string }[] = [
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
              {tab.label}
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
                  {booking.customerName || t('dealer.customer') || 'Customer'}{' '}
                  {booking.vehicleName ? `(${booking.vehicleName})` : ''}
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
                  {booking.status === 'new'
                    ? t('dealer.new') || 'New'
                    : booking.status === 'scheduled'
                    ? t('dealer.scheduled') || 'Scheduled'
                    : booking.status === 'in_progress'
                    ? t('dealer.inProgress') || 'In Progress'
                    : booking.status === 'awaiting'
                    ? t('dealer.awaiting') || 'Awaiting'
                    : booking.status === 'completed'
                    ? t('dealer.completed') || 'Completed'
                    : booking.status.replace('_', ' ').toUpperCase()}
                </CustomText>
              </View>
            </View>
            {activeTab === 'new' ? (
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
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => openRejectModal(booking.id)}
                  disabled={updating === booking.id}>
                  <CustomText style={styles.rejectButtonText}>
                    {t('dealer.reject') || 'Reject'}
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: theme.primary,
                  }}
                  onPress={() => handleDownloadInvoice(booking.id)}>
                  <CustomText style={styles.acceptButtonText}>
                    Receipt
                  </CustomText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: theme.primary,
                  }}
                  onPress={() => handleDownloadInvoice(booking.id)}>
                  <CustomText style={styles.acceptButtonText}>
                    Download Receipt
                  </CustomText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContainer}>
            <CustomText style={styles.modalTitle}>
              {t('dealer.rejectBooking') || 'Reject Booking'}
            </CustomText>
            <CustomText style={styles.modalSubtitle}>
              {t('dealer.rejectBookingSubtitle') ||
                'Please provide a reason for rejecting this booking. The customer will be notified.'}
            </CustomText>
            <TextInput
              style={styles.modalInput}
              placeholder={t('dealer.rejectionReasonPlaceholder') || 'e.g. Fully booked on this date'}
              placeholderTextColor={theme.textSecondary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              maxLength={300}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}>
                <CustomText style={styles.modalCancelText}>
                  {t('dealer.cancel') || 'Cancel'}
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleRejectConfirm}>
                <CustomText style={styles.modalConfirmText}>
                  {t('dealer.confirmReject') || 'Confirm Reject'}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ServiceBookingsCard;
