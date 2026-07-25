import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Share,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { BookingCardFooter } from '@components/bookings/BookingCardFooter';
import { BookingProgressStepper } from '@components/bookings/BookingProgressStepper';
import { BookingSupportBanner } from '@components/bookings/BookingSupportBanner';
import { ChromeHeader } from '@components/common';
import { CustomerStackRoutes } from '@constants/routes';
import { useBookings } from '@context/index';
import { getStatusColor, getStatusLabel } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import { InAppBrowserModal } from '@components/common/InAppBrowserModal';
import { getString, StorageKeys } from '@storage/index';
import { API_BASE_URL } from '@config/env';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.BookingDetail
>;

export function BookingDetailScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { bookingId } = route.params;
  const { getBookingById, loadBookings, cancelBooking } = useBookings();
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');

  const handleShareInvoice = async () => {
    if (!booking) return;
    lightHaptic();
    try {
      const token = await getString(StorageKeys.ACCESS_TOKEN);
      const url = `${API_BASE_URL}/invoices/service/${booking.id}?token=${token}`;
      
      await Share.share({
        message: `Service Invoice link: ${url}`,
        title: `Invoice - ${booking.id}`,
      });
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert('Share Failed', 'Unable to share invoice link.');
    }
  };

  const handleViewInvoice = async () => {
    if (!booking) return;
    lightHaptic();
    try {
      const token = await getString(StorageKeys.ACCESS_TOKEN);
      const url = `${API_BASE_URL}/invoices/service/${booking.id}?token=${token}`;
      setInvoiceUrl(url);
      setInvoiceModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Unable to retrieve access token.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const booking = getBookingById(bookingId);

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader style={styles.header} contentPad={8}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.iconBtn} />
        </ChromeHeader>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Booking not found
          </Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const dateLabel = booking.date
    ? new Date(booking.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const title =
    booking.type === 'test_drive'
      ? `Test Drive — ${booking.vehicleBrand} ${booking.vehicleName}`
      : booking.serviceName ?? 'Service Booking';

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await cancelBooking(bookingId, booking.type);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>My Booking</Text>
        <View style={styles.iconBtn} />
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.idRow}>
          <View>
            <Text style={[styles.idLabel, { color: colors.textSecondary }]}>Booking ID</Text>
            <Text style={[styles.idValue, { color: colors.textPrimary }]}>{booking.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(booking.status)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            {booking.vehicleImage && (
              <Image source={{ uri: booking.vehicleImage }} style={styles.thumb} />
            )}
            <View style={styles.cardInfo}>
              <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{title}</Text>
              {booking.vehicleReg && (
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {booking.vehicleBrand} {booking.vehicleName} • {booking.vehicleReg}
                </Text>
              )}
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {dateLabel} • {booking.timeSlot}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {booking.workshopName ?? booking.dealerName}
              </Text>
            </View>
            {booking.total > 0 && (
              <Text style={[styles.price, { color: colors.textPrimary }]}>
                ₹{booking.total.toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        </View>

        {booking.type === 'service' && (booking.paymentStatus === 'paid' || booking.status === 'completed') && (
          <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.invoiceHeader}>
              <Feather name="file-text" size={20} color={colors.primary} />
              <View style={styles.invoiceInfo}>
                <Text style={[styles.invoiceTitle, { color: colors.textPrimary }]}>Service Invoice</Text>
                <Text style={[styles.invoiceSubtitle, { color: colors.textSecondary }]}>Download or share service booking invoice</Text>
              </View>
            </View>
            <View style={styles.invoiceActions}>
              <Pressable
                style={[styles.invoiceBtn, { backgroundColor: colors.muted }]}
                onPress={handleShareInvoice}
              >
                <Feather name="share-2" size={16} color={colors.textPrimary} />
                <Text style={[styles.invoiceBtnText, { color: colors.textPrimary }]}>Share</Text>
              </Pressable>
              <Pressable
                style={[styles.invoiceBtn, { backgroundColor: colors.primary }]}
                onPress={handleViewInvoice}
              >
                <Feather name="download" size={16} color="#ffffff" />
                <Text style={[styles.invoiceBtnText, { color: '#ffffff' }]}>Download</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Booking Status</Text>
        <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BookingProgressStepper steps={booking.timeline} />
        </View>

        {booking.addonNames && booking.addonNames.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Add-ons</Text>
            {booking.addonNames.map((name) => (
              <Text key={name} style={[styles.meta, { color: colors.textSecondary }]}>
                • {name}
              </Text>
            ))}
          </View>
        )}

        <BookingCardFooter booking={booking} />

        <BookingSupportBanner />

        {(booking.status === 'upcoming' ||
          booking.status === 'confirmed' ||
          booking.status === 'pending') && (
          <Pressable
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={() => {
              lightHaptic();
              handleCancel();
            }}
          >
            <Text style={styles.cancelText}>Cancel Booking</Text>
          </Pressable>
        )}
      </ScrollView>

      <InAppBrowserModal
        visible={invoiceModalVisible}
        url={invoiceUrl}
        onClose={() => setInvoiceModalVisible(false)}
        title="Service Invoice"
        orderId={booking ? String(booking.id) : 'invoice'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  content: { padding: 16, gap: 14 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  idValue: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: { width: 72, height: 56, borderRadius: 10 },
  cardInfo: { flex: 1, gap: 4 },
  serviceName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  price: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  timelineCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cancelBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
  invoiceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  invoiceSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  invoiceBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
});
