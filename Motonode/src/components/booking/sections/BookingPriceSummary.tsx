import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@hooks/useColors';

interface BookingPriceSummaryProps {
  serviceAmount: number;
  addonsAmount: number;
  addonsCount: number;
  platformFee: number;
  couponDiscount: number;
  total: number;
}

export function BookingPriceSummary({
  serviceAmount,
  addonsAmount,
  addonsCount,
  platformFee,
  couponDiscount,
  total,
}: BookingPriceSummaryProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Price Details</Text>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Service Charge</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          ₹{serviceAmount.toLocaleString('en-IN')}
        </Text>
      </View>

      {addonsCount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Add-on Services ({addonsCount})
          </Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            ₹{addonsAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Platform Fee</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>₹{platformFee}</Text>
      </View>

      {couponDiscount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: '#10B981' }]}>Coupon Discount</Text>
          <Text style={[styles.value, { color: '#10B981' }]}>
            -₹{couponDiscount.toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      <View style={[styles.divider, { borderColor: colors.border }]} />

      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Amount</Text>
        <Text style={[styles.totalValue, { color: colors.textPrimary }]}>₹{total.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  value: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  divider: {
    borderStyle: 'dashed',
    borderTopWidth: 1,
    marginVertical: 4,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
});
