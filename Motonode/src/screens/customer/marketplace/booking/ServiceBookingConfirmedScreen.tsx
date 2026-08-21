import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { BookingMasterStepBar } from '@components/booking/BookingMasterStepBar';
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingConfirmed
>;

export function ServiceBookingConfirmedScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { bookingId } = route.params;

  const { getService, getVehicle, getLocation, draft, resetBooking } = useServiceBooking();
  const service = getService();
  const vehicle = getVehicle();
  const location = getLocation();

  const dateLabel = draft.date
    ? new Date(draft.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Confirmation</Text>
      </ChromeHeader>
      <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BookingMasterStepBar current={4} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
          <Feather name="check" size={36} color={colors.white} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Booking Confirmed!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your service has been booked successfully.
        </Text>

        <View style={[styles.idCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.idLabel, { color: colors.textSecondary }]}>Booking ID</Text>
          <View style={styles.idRow}>
            <Text style={[styles.idValue, { color: colors.textPrimary }]}>{bookingId}</Text>
            <Feather name="copy" size={16} color={colors.textTertiary} />
          </View>
        </View>

        <View style={[styles.recapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.recapTitle, { color: colors.textPrimary }]}>{service?.name}</Text>
          <Text style={[styles.recapLine, { color: colors.textSecondary }]}>
            {dateLabel} • {draft.timeSlot}
          </Text>
          <Text style={[styles.recapLine, { color: colors.textSecondary }]}>
            {vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}
          </Text>
          <Text style={[styles.recapLine, { color: colors.textSecondary }]}>
            {location?.name}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={() => {
            lightHaptic();
            navigation.replace(CustomerStackRoutes.BookingDetail, { bookingId });
          }}
        >
          <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>View Booking</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            lightHaptic();
            resetBooking();
            navigation.popToTop();
          }}
        >
          <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Go to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  topBar: { borderBottomWidth: 1 },
  content: { alignItems: 'center', padding: 24, paddingTop: 32, gap: 12 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 12 },
  idCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  idLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  idValue: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  recapCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  recapTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  recapLine: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
