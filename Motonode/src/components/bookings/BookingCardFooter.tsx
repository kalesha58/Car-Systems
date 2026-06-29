import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { CustomerBooking } from '@data/bookingsData';
import { themeLight } from '@theme/colors';
import { lightHaptic } from '@utils/haptics';

interface BookingCardFooterProps {
  booking: CustomerBooking;
}

export function BookingCardFooter({ booking }: BookingCardFooterProps) {
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
      <View style={styles.upcomingFooter}>
        <Text style={styles.footerHint}>
          {booking.type === 'test_drive'
            ? `Test drive scheduled at ${booking.timeSlot}`
            : `Estimated arrival at workshop: ${booking.timeSlot}`}
        </Text>
        <View style={styles.btnRow}>
          <Pressable style={styles.outlineBtn} onPress={handleCall}>
            <Feather name="phone" size={12} color="#E60012" />
            <Text style={styles.outlineText}>Call Workshop</Text>
          </Pressable>
          <Pressable style={styles.solidBtn} onPress={handleDirections}>
            <Feather name="navigation" size={12} color="#fff" />
            <Text style={styles.solidText}>Get Directions</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (booking.status === 'in_progress') {
    return (
      <View style={styles.progressFooter}>
        <Text style={styles.progressHint}>
          {booking.type === 'test_drive'
            ? 'Your test drive is in progress'
            : 'Our team is working on your car'}
        </Text>
        <Pressable style={styles.outlineBtn} onPress={handleCall}>
          <Feather name="phone" size={12} color="#E60012" />
          <Text style={styles.outlineText}>Call Workshop</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  upcomingFooter: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  footerHint: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#166534' },
  btnRow: { flexDirection: 'row', gap: 8 },
  progressFooter: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  progressHint: { flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium', color: themeLight.textSecondary },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E60012',
    backgroundColor: '#fff',
  },
  outlineText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: themeLight.link },
  solidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E60012',
  },
  solidText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
