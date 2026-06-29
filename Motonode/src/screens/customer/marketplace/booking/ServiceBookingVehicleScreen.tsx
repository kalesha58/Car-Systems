import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { GARAGE_VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingVehicle
>;

export function ServiceBookingVehicleScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, updateBooking } = useServiceBooking();

  const vehicles = draft.vehicleLocked
    ? GARAGE_VEHICLES.filter((v) => v.id === draft.vehicleId)
    : GARAGE_VEHICLES;

  return (
    <BookingFlowLayout
      title={draft.vehicleLocked ? 'Your Vehicle' : 'Select Vehicle'}
      step={2}
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate(CustomerStackRoutes.ServiceBookingLocation)}
      continueDisabled={!draft.vehicleId}
    >
      {draft.vehicleLocked && (
        <Text style={[styles.lockedHint, { color: colors.textSecondary }]}>
          Booking service for your garage vehicle
        </Text>
      )}

      {vehicles.map((vehicle) => {
        const selected = draft.vehicleId === vehicle.id;
        return (
          <Pressable
            key={vehicle.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: selected ? '#2563EB' : colors.border,
              },
            ]}
            onPress={() => {
              if (!draft.vehicleLocked) {
                updateBooking({ vehicleId: vehicle.id });
              }
            }}
            disabled={draft.vehicleLocked}
          >
            <Image source={{ uri: vehicle.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {vehicle.brand} {vehicle.name}
              </Text>
              <Text style={[styles.plate, { color: colors.primary }]}>{vehicle.regNumber}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {vehicle.year} • {vehicle.fuel}
              </Text>
            </View>
            {draft.vehicleLocked ? (
              <Feather name="check-circle" size={20} color="#2563EB" />
            ) : (
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
            )}
          </Pressable>
        );
      })}

      {!draft.vehicleLocked && (
        <Pressable
          style={[styles.addBtn, { borderColor: colors.border }]}
          onPress={() => lightHaptic()}
        >
          <Feather name="plus" size={16} color="#2563EB" />
          <Text style={styles.addText}>Add New Vehicle</Text>
        </Pressable>
      )}
    </BookingFlowLayout>
  );
}

const styles = StyleSheet.create({
  lockedHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
  },
  image: { width: 72, height: 52, borderRadius: 8 },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  plate: { fontSize: 11, fontFamily: 'Inter_700Bold', marginTop: 2 },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#2563EB' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
});
