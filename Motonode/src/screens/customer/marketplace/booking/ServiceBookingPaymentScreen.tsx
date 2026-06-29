import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { BookingFlowShell } from '@components/booking/BookingFlowShell';
import { BookingPriceSummary } from '@components/booking/sections/BookingPriceSummary';
import { BookingTrustFooter } from '@components/booking/sections/BookingTrustFooter';
import { CustomerStackRoutes } from '@constants/routes';
import { useAuth, useBookings } from '@context/index';
import { useServiceBooking, type BookingPaymentMethod } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingPayment
>;

const PAYMENT_METHODS: {
  id: BookingPaymentMethod;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  iconColor: string;
  iconBg: string;
}[] = [
  { id: 'upi', label: 'UPI', subtitle: 'Pay using any UPI app', icon: 'smartphone', iconColor: '#F59E0B', iconBg: '#FEF3C7' },
  { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, Rupay', icon: 'credit-card', iconColor: '#E60012', iconBg: '#F2F2F2' },
  { id: 'netbanking', label: 'Net Banking', subtitle: 'All major banks supported', icon: 'home', iconColor: '#1E293B', iconBg: '#F1F5F9' },
  { id: 'wallet', label: 'Wallets', subtitle: 'Paytm, PhonePe, Amazon Pay', icon: 'briefcase', iconColor: '#7C3AED', iconBg: '#EDE9FE' },
];

export function ServiceBookingPaymentScreen({ navigation }: Props) {
  const colors = useColors();
  const { user } = useAuth();
  const { createServiceBooking } = useBookings();
  const { draft, updateBooking, confirmBooking, getService, getTotals } = useServiceBooking();
  const service = getService();
  const totals = getTotals();
  const [paying, setPaying] = useState(false);

  const handlePay = () => {
    if (paying) return;
    lightHaptic();
    setPaying(true);
    setTimeout(async () => {
      const bookingId = confirmBooking();
      await createServiceBooking({
        draft,
        bookingId,
        customerId: user?.id ?? 'u1',
        customerName: user?.name ?? 'Customer',
        customerPhone: user?.phone ?? '',
        total: totals.total,
      });
      setPaying(false);
      successHaptic();
      navigation.replace(CustomerStackRoutes.ServiceBookingConfirmed, { bookingId });
    }, 1500);
  };

  return (
    <BookingFlowShell
      title="Payment"
      step={3}
      onBack={() => navigation.goBack()}
      onContinue={handlePay}
      continueLabel={paying ? 'Processing…' : `Pay ₹${totals.total.toLocaleString('en-IN')}`}
      continueDisabled={paying}
      footerExtra={<BookingTrustFooter />}
    >
      <View style={styles.secureBanner}>
        <Feather name="shield" size={16} color={colors.icon} />
        <View>
          <Text style={styles.secureTitle}>100% Secure Payments</Text>
          <Text style={styles.secureSub}>Your payment information is safe with us.</Text>
        </View>
      </View>

      {service && (
        <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.summaryRow}>
            <Image source={{ uri: service.image }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{service.name}</Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{service.dealerName}</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Select Payment Method</Text>
      <View style={[styles.methodsCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {PAYMENT_METHODS.map((method, idx) => {
          const isSelected = draft.paymentMethod === method.id;
          return (
            <View key={method.id}>
              <Pressable
                style={styles.methodRow}
                onPress={() => {
                  lightHaptic();
                  updateBooking({ paymentMethod: method.id });
                }}
              >
                <View style={[styles.methodIcon, { backgroundColor: method.iconBg }]}>
                  <Feather name={method.icon} size={16} color={method.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
                  <Text style={[styles.methodSub, { color: colors.textTertiary }]}>{method.subtitle}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
              {idx < PAYMENT_METHODS.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>

      <BookingPriceSummary
        serviceAmount={totals.serviceAmount}
        addonsAmount={totals.addonsAmount}
        addonsCount={draft.selectedAddonIds.length}
        platformFee={totals.platformFee}
        couponDiscount={totals.couponDiscount}
        total={totals.total}
      />
    </BookingFlowShell>
  );
}

const styles = StyleSheet.create({
  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  secureTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E3A8A' },
  secureSub: { fontSize: 10, color: '#FF1A1A', marginTop: 1 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#E2E8F0' },
  itemName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  itemMeta: { fontSize: 11, marginTop: 2 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  methodsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  methodIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  methodSub: { fontSize: 10, marginTop: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#E60012' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E60012' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
});
