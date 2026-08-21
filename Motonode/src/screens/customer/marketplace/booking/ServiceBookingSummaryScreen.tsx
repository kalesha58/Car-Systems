import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { BookingFlowShell } from '@components/booking/BookingFlowShell';
import { BookingPriceSummary } from '@components/booking/sections/BookingPriceSummary';
import { BookingTrustFooter } from '@components/booking/sections/BookingTrustFooter';
import { ServiceSummaryCard } from '@components/booking/sections/ServiceSummaryCard';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingSummary
>;

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.reviewRow}>
      <View style={[styles.reviewIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={14} color={colors.icon} />
      </View>
      <View style={styles.reviewBody}>
        <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export function ServiceBookingSummaryScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, getService, getVehicle, getLocation, getTotals } = useServiceBooking();

  const service = getService();
  const vehicle = getVehicle();
  const location = getLocation();
  const totals = getTotals();

  const dateLabel = draft.date
    ? new Date(draft.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  if (!service) {
    return null;
  }

  return (
    <BookingFlowShell
      title="Review Booking"
      step={2}
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate(CustomerStackRoutes.ServiceBookingPayment)}
      continueLabel="Proceed to Payment"
      footerExtra={<BookingTrustFooter />}
    >
      <ServiceSummaryCard service={service} />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Booking Details</Text>
        <ReviewRow icon="calendar" label="Date & Time" value={`${dateLabel}, ${draft.timeSlot}`} />
        <ReviewRow
          icon="truck"
          label="Vehicle"
          value={vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.numberPlate})` : '—'}
        />
        <ReviewRow
          icon="map-pin"
          label="Location"
          value={
            draft.locationType === 'pickup'
              ? `Home Service • ${location?.address ?? ''}`
              : location?.name ?? '—'
          }
        />
      </View>

      <BookingPriceSummary
        serviceAmount={totals.serviceAmount}
        addonsAmount={0}
        addonsCount={0}
        platformFee={totals.platformFee}
        couponDiscount={totals.couponDiscount}
        total={totals.total}
      />
    </BookingFlowShell>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 14 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  reviewRow: { flexDirection: 'row', gap: 12 },
  reviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBody: { flex: 1 },
  reviewLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  reviewValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
});
