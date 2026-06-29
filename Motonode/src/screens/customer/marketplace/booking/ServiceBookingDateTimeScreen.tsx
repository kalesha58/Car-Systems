import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { getServiceBookingDates, SERVICE_TIME_SLOTS } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingDateTime
>;

export function ServiceBookingDateTimeScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, updateBooking, getService } = useServiceBooking();
  const service = getService();
  const dates = getServiceBookingDates();

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
            {service.dealerName} • {service.duration}
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
                  backgroundColor: selected ? '#2563EB' : colors.card,
                  borderColor: selected ? '#2563EB' : colors.border,
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

      {SERVICE_TIME_SLOTS.map((group) => (
        <View key={group.period} style={styles.slotGroup}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{group.period}</Text>
          <View style={styles.slotRow}>
            {group.slots.map((slot) => {
              const selected = draft.timeSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[
                    styles.slotChip,
                    {
                      backgroundColor: selected ? '#EFF6FF' : colors.card,
                      borderColor: selected ? '#2563EB' : colors.border,
                    },
                  ]}
                  onPress={() => updateBooking({ timeSlot: slot })}
                >
                  <Text
                    style={[
                      styles.slotText,
                      { color: selected ? '#2563EB' : colors.textSecondary },
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
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
  slotGroup: { gap: 10 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
