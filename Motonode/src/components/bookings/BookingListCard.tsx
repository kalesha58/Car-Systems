import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingCardFooter } from '@components/bookings/BookingCardFooter';
import { BookingProgressStepper } from '@components/bookings/BookingProgressStepper';
import {
  getStatusColor,
  getStatusLabel,
  type CustomerBooking,
} from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface BookingListCardProps {
  booking: CustomerBooking;
  onPress: () => void;
}

export function BookingListCard({ booking, onPress }: BookingListCardProps) {
  const colors = useColors();
  const statusColor = getStatusColor(booking.status);
  const title =
    booking.type === 'test_drive'
      ? `Test Drive — ${booking.vehicleBrand} ${booking.vehicleName}`
      : booking.serviceName ?? 'Service Booking';

  const dateLabel = booking.date
    ? new Date(booking.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const vehicleMeta = booking.vehicleReg
    ? `${booking.vehicleBrand} ${booking.vehicleName} • ${booking.vehicleReg}${booking.vehicleYear ? ` • ${booking.vehicleYear}` : ''}${booking.vehicleFuel ? ` • ${booking.vehicleFuel}` : ''}`
    : `${booking.vehicleBrand ?? ''} ${booking.vehicleName ?? ''}`.trim();

  const locationLine =
    booking.type === 'test_drive'
      ? booking.dealerName ?? 'Dealer showroom'
      : `${booking.workshopName ?? ''}${booking.workshopAddress ? `, ${booking.workshopAddress}` : ''}${booking.workshopDistance ? ` • ${booking.workshopDistance} away` : ''}`;

  const handleCopyId = () => {
    lightHaptic();
    Alert.alert('Copied', `Booking ID ${booking.id} copied to clipboard.`);
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(booking.status)}
          </Text>
        </View>
        <Pressable style={styles.idRow} onPress={handleCopyId}>
          <Text style={[styles.idText, { color: colors.textTertiary }]}>
            Booking ID: {booking.id}
          </Text>
          <Feather name="copy" size={12} color={colors.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.bodyRow}>
        {booking.vehicleImage ? (
          <Image source={{ uri: booking.vehicleImage }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Feather name="truck" size={20} color="#94A3B8" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>
          {vehicleMeta ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={2}>
              {vehicleMeta}
            </Text>
          ) : null}
          <View style={styles.iconRow}>
            <Feather name="calendar" size={12} color="#2563EB" />
            <Text style={[styles.iconText, { color: colors.textSecondary }]}>
              {dateLabel} • {booking.timeSlot}
            </Text>
          </View>
          <View style={styles.iconRow}>
            <Feather name="map-pin" size={12} color="#2563EB" />
            <Text style={[styles.iconText, { color: colors.textSecondary }]} numberOfLines={2}>
              {locationLine}
            </Text>
          </View>
        </View>
        <View style={styles.priceCol}>
          {booking.total > 0 && (
            <Text style={[styles.price, { color: colors.textPrimary }]}>
              ₹{booking.total.toLocaleString('en-IN')}
            </Text>
          )}
          <View style={styles.viewRow}>
            <Text style={styles.viewText}>View Details</Text>
            <Feather name="chevron-right" size={12} color="#2563EB" />
          </View>
        </View>
      </View>

      <BookingProgressStepper steps={booking.timeline} compact />

      <BookingCardFooter booking={booking} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  idText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  bodyRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: { width: 72, height: 56, borderRadius: 10 },
  thumbPlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 18 },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  iconRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },
  iconText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  priceCol: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
});
