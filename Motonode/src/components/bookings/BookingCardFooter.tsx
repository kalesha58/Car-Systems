import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { CustomerBooking } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface BookingCardFooterProps {
  booking: CustomerBooking;
}

export function BookingCardFooter({ booking }: BookingCardFooterProps) {
  const colors = useColors();

  const handleCall = () => {
    lightHaptic();
    Alert.alert('Call Workshop', `Calling ${booking.workshopName ?? booking.dealerName ?? 'dealer'}…`);
  };

  const handleDirections = () => {
    lightHaptic();
    Alert.alert('Directions', `Opening maps for ${booking.workshopAddress ?? 'dealer location'}…`);
  };

  if (booking.status === 'upcoming' || booking.status === 'confirmed' || booking.status === 'pending') {
    return (
      <View style={[styles.upcomingFooter, { backgroundColor: colors.muted }]}>
        <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
          {booking.type === 'test_drive'
            ? `Test drive scheduled at ${booking.timeSlot}`
            : `Estimated arrival at workshop: ${booking.timeSlot}`}
        </Text>
        <View style={styles.btnRow}>
          <Pressable
            style={[styles.outlineBtn, { borderColor: colors.primary, backgroundColor: colors.card }]}
            onPress={handleCall}
          >
            <Feather name="phone" size={12} color={colors.primary} />
            <Text style={[styles.outlineText, { color: colors.primary }]}>Call Workshop</Text>
          </Pressable>
          <Pressable style={[styles.solidBtn, { backgroundColor: colors.primary }]} onPress={handleDirections}>
            <Feather name="navigation" size={12} color={colors.primaryForeground} />
            <Text style={[styles.solidText, { color: colors.primaryForeground }]}>Get Directions</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (booking.status === 'in_progress') {
    return (
      <View style={[styles.progressFooter, { backgroundColor: colors.muted }]}>
        <Text style={[styles.progressHint, { color: colors.textSecondary }]}>
          {booking.type === 'test_drive'
            ? 'Your test drive is in progress'
            : 'Our team is working on your car'}
        </Text>
        <Pressable
          style={[styles.outlineBtn, { borderColor: colors.primary, backgroundColor: colors.card }]}
          onPress={handleCall}
        >
          <Feather name="phone" size={12} color={colors.primary} />
          <Text style={[styles.outlineText, { color: colors.primary }]}>Call Workshop</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  upcomingFooter: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  footerHint: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  btnRow: { flexDirection: 'row', gap: 8 },
  progressFooter: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  progressHint: { flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  outlineText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  solidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  solidText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
