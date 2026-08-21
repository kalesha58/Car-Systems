import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingPickerSheet } from '@components/booking/pickers/BookingPickerSheet';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

const POLICY_SECTIONS = [
  {
    icon: 'clock' as const,
    title: 'Free cancellation',
    body: 'Cancel at least 24 hours before your scheduled slot for a full refund of the service charge. Platform fees are non-refundable.',
  },
  {
    icon: 'percent' as const,
    title: 'Late cancellation',
    body: 'Cancellations made less than 24 hours before the slot are eligible for a 50% refund of the service charge.',
  },
  {
    icon: 'slash' as const,
    title: 'No-show',
    body: 'If you miss the appointment without cancelling, the booking is marked as a no-show and the amount paid is not refunded.',
  },
  {
    icon: 'calendar' as const,
    title: 'Reschedule',
    body: 'You can reschedule once at no extra cost up to 12 hours before the slot, subject to workshop availability.',
  },
  {
    icon: 'help-circle' as const,
    title: 'How to cancel',
    body: 'Open My Bookings, select this booking, and tap Cancel. Refunds are credited to the original payment method within 5–7 business days.',
  },
];

export function BookingTrustFooter() {
  const colors = useColors();
  const [policyVisible, setPolicyVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={[styles.secureBanner, { backgroundColor: colors.muted }]}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={[styles.secureText, { color: colors.textSecondary }]}>
          <Text style={[styles.secureBold, { color: colors.textPrimary }]}>Secure Booking: </Text>
          Your data is protected & secure.
        </Text>
      </View>
      <Pressable
        style={styles.policyRow}
        accessibilityRole="button"
        accessibilityLabel="View cancellation policy"
        onPress={() => {
          lightHaptic();
          setPolicyVisible(true);
        }}
      >
        <Feather name="file-text" size={14} color={colors.icon} />
        <Text style={[styles.policyText, { color: colors.textPrimary }]}>View Cancellation Policy</Text>
      </Pressable>

      <BookingPickerSheet
        visible={policyVisible}
        title="Cancellation Policy"
        onClose={() => setPolicyVisible(false)}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Please read these terms before you continue. They apply to workshop and home-service bookings on Motonode.
        </Text>
        {POLICY_SECTIONS.map((section) => (
          <View
            key={section.title}
            style={[styles.policyCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <View style={[styles.policyIcon, { backgroundColor: colors.card }]}>
              <Feather name={section.icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.policyBody}>
              <Text style={[styles.policyTitle, { color: colors.textPrimary }]}>{section.title}</Text>
              <Text style={[styles.policyBodyText, { color: colors.textSecondary }]}>{section.body}</Text>
            </View>
          </View>
        ))}
        <Pressable
          style={[styles.gotItBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            lightHaptic();
            setPolicyVisible(false);
          }}
        >
          <Text style={[styles.gotItText, { color: colors.primaryForeground }]}>Got it</Text>
        </Pressable>
      </BookingPickerSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  secureText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  secureBold: { fontFamily: 'Inter_700Bold' },
  policyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  policyText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  intro: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 4 },
  policyCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  policyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyBody: { flex: 1, gap: 4 },
  policyTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  policyBodyText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  gotItBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  gotItText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
