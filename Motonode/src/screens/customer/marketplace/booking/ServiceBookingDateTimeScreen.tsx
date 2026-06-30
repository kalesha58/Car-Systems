import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import { getBookingDateOptions, formatSlotTime } from '@utils/bookingMappers';
import { getServiceDurationLabel } from '@utils/displayMappers';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingDateTime
>;

export function ServiceBookingDateTimeScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, updateBooking, getService, slots, slotsLoading, loadSlots } = useServiceBooking();
  const service = getService();
  const dates = getBookingDateOptions();

  useEffect(() => {
    if (draft.date) {
      loadSlots(draft.date);
    }
  }, [draft.date, draft.locationType, loadSlots]);

  const selectSlot = (slotId: string, startTime: string) => {
    updateBooking({ slotId, timeSlot: formatSlotTime(startTime) });
  };

  return (
    <BookingFlowLayout
      title="Select Date & Time"
      step={1}
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate(CustomerStackRoutes.ServiceBookingVehicle)}
      continueDisabled={!draft.date || !draft.timeSlot}
    >
      {service && (
        <View style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service.name}</Text>
          <Text style={[styles.serviceMeta, { color: colors.textSecondary }]}>
            {service.dealer?.businessName ?? 'Dealer'} • {getServiceDurationLabel(service)}
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
        {dates.map((d) => {
          const selected = draft.date === d.value;
          return (
            <Pressable
              key={d.value}
              style={[
                styles.dateChip,
                {
                  backgroundColor: selected ? '#E60012' : colors.card,
                  borderColor: selected ? '#E60012' : colors.border,
                },
              ]}
              onPress={() => updateBooking({ date: d.value })}
            >
              <Text style={[styles.dateText, { color: selected ? '#fff' : colors.textPrimary }]}>
                {d.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Slots</Text>
      {slotsLoading ? (
        <ActivityIndicator color="#E60012" style={{ marginVertical: 16 }} />
      ) : slots.length === 0 ? (
        <Text style={[styles.emptySlots, { color: colors.textSecondary }]}>
          No slots available for this date
        </Text>
      ) : (
        <View style={styles.slotRow}>
          {slots.map((slot) => {
            const selected = draft.slotId === slot.id;
            return (
              <Pressable
                key={slot.id}
                style={[
                  styles.slotChip,
                  {
                    backgroundColor: selected ? '#F2F2F2' : colors.card,
                    borderColor: selected ? '#E60012' : colors.border,
                  },
                ]}
                onPress={() => selectSlot(slot.id, slot.startTime)}
              >
                <Text
                  style={[styles.slotText, { color: selected ? '#E60012' : colors.textSecondary }]}
                >
                  {formatSlotTime(slot.startTime)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </BookingFlowLayout>
  );
}

const styles = StyleSheet.create({
  serviceCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  serviceName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  serviceMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  dateRow: { gap: 8, paddingVertical: 4 },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 64,
    alignItems: 'center',
  },
  dateText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  emptySlots: { fontSize: 12, fontFamily: 'Inter_400Regular', paddingVertical: 12 },
});
