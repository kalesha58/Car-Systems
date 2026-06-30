import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';
import { lightHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingVehicle
>;

export function ServiceBookingVehicleScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, updateBooking, vehicles, serviceLoading } = useServiceBooking();

  const list = draft.vehicleLocked
    ? vehicles.filter((v) => v.id === draft.vehicleId)
    : vehicles;

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

      {serviceLoading ? (
        <ActivityIndicator color="#E60012" style={{ marginVertical: 24 }} />
      ) : list.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No vehicles in your garage. Add a vehicle first.
        </Text>
      ) : (
        list.map((vehicle) => {
          const selected = draft.vehicleId === vehicle.id;
          const imageUri = vehicle.images?.[0];
          return (
            <Pressable
              key={vehicle.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: selected ? '#E60012' : colors.border,
                },
              ]}
              onPress={() => {
                if (!draft.vehicleLocked) {
                  updateBooking({ vehicleId: vehicle.id });
                }
              }}
              disabled={draft.vehicleLocked}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Feather name="truck" size={20} color={colors.icon} />
                </View>
              )}
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text style={[styles.plate, { color: colors.primary }]}>{vehicle.numberPlate}</Text>
                {vehicle.year ? (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{vehicle.year}</Text>
                ) : null}
              </View>
              {draft.vehicleLocked ? (
                <Feather name="check-circle" size={20} color={colors.icon} />
              ) : (
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              )}
            </Pressable>
          );
        })
      )}

      {!draft.vehicleLocked && (
        <Pressable
          style={[styles.addBtn, { borderColor: colors.border }]}
          onPress={() => lightHaptic()}
        >
          <Feather name="plus" size={16} color={colors.icon} />
          <Text style={styles.addText}>Add New Vehicle</Text>
        </Pressable>
      )}
    </BookingFlowLayout>
  );
}

const styles = StyleSheet.create({
  lockedHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
  },
  image: { width: 72, height: 52, borderRadius: 8 },
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  radioSelected: { borderColor: '#E60012' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E60012' },
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
  addText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: themeLight.textSecondary },
});
