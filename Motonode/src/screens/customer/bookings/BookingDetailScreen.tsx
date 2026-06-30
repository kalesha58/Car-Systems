import React, { useCallback } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { BookingCardFooter } from '@components/bookings/BookingCardFooter';
import { BookingProgressStepper } from '@components/bookings/BookingProgressStepper';
import { BookingSupportBanner } from '@components/bookings/BookingSupportBanner';
import { CustomerStackRoutes } from '@constants/routes';
import { useBookings } from '@context/index';
import { getStatusColor, getStatusLabel } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.BookingDetail
>;

export function BookingDetailScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { bookingId } = route.params;
  const { getBookingById, loadBookings, cancelBooking } = useBookings();

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const booking = getBookingById(bookingId);

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.iconBtn} />
        </View>
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
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card }]}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#0F172A" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Booking</Text>
        <View style={styles.iconBtn} />
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
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
});
