import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import type { LocationType } from '@context/ServiceBookingContext';
import { SERVICE_WORKSHOPS } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingLocation
>;

export function ServiceBookingLocationScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, updateBooking } = useServiceBooking();

  const setLocationType = (locationType: LocationType) => updateBooking({ locationType });

  return (
    <BookingFlowLayout
      title="Choose Location"
      step={3}
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate(CustomerStackRoutes.ServiceBookingAddons)}
      continueDisabled={!draft.workshopId}
    >
      <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
        {(['workshop', 'pickup'] as LocationType[]).map((type) => {
          const selected = draft.locationType === type;
          return (
            <Pressable
              key={type}
              style={[styles.toggleBtn, selected && styles.toggleBtnActive]}
              onPress={() => setLocationType(type)}
            >
              <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>
                {type === 'workshop' ? 'Workshop' : 'Pick & Drop'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.mapPlaceholder, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="map-pin" size={24} color="#2563EB" />
        <Text style={[styles.mapText, { color: colors.textSecondary }]}>
          {draft.locationType === 'pickup'
            ? 'Vehicle will be picked up from your location'
            : 'Service centers near you'}
        </Text>
      </View>

      {SERVICE_WORKSHOPS.map((workshop) => {
        const selected = draft.workshopId === workshop.id;
        return (
          <Pressable
            key={workshop.id}
            style={[
              styles.workshopCard,
              {
                backgroundColor: colors.card,
                borderColor: selected ? '#2563EB' : colors.border,
              },
            ]}
            onPress={() => updateBooking({ workshopId: workshop.id })}
          >
            <View style={styles.workshopInfo}>
              <Text style={[styles.workshopName, { color: colors.textPrimary }]}>
                {workshop.name}
              </Text>
              <Text style={[styles.workshopAddr, { color: colors.textSecondary }]}>
                {workshop.address}
              </Text>
              <View style={styles.workshopMeta}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {workshop.rating} • {workshop.distance}
                </Text>
              </View>
            </View>
            {selected && <Feather name="check-circle" size={20} color="#2563EB" />}
          </Pressable>
        );
      })}
    </BookingFlowLayout>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  toggleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  toggleTextActive: { color: '#ffffff' },
  mapPlaceholder: {
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  workshopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  workshopInfo: { flex: 1, gap: 4 },
  workshopName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  workshopAddr: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  workshopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
