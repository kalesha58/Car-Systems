import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingSectionCard } from '@components/booking/sections/BookingSectionCard';
import type { GarageVehicle } from '@data/mockData';
import { useColors } from '@hooks/useColors';

interface BookingVehicleSectionProps {
  vehicle: GarageVehicle | undefined;
  locked?: boolean;
  onPress?: () => void;
}

export function BookingVehicleSection({ vehicle, locked, onPress }: BookingVehicleSectionProps) {
  const colors = useColors();

  if (!vehicle) {
    return (
      <BookingSectionCard title="Select Vehicle" onChange={onPress}>
        <Pressable style={styles.emptyRow} onPress={onPress}>
          <Feather name="plus-circle" size={20} color="#2563EB" />
          <Text style={styles.emptyText}>Choose a vehicle</Text>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>
      </BookingSectionCard>
    );
  }

  return (
    <BookingSectionCard
      title={locked ? 'Your Vehicle' : 'Select Vehicle'}
      onChange={locked ? undefined : onPress}
    >
      <Pressable style={styles.row} onPress={locked ? undefined : onPress} disabled={locked}>
        <Image source={{ uri: vehicle.image }} style={styles.image} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {vehicle.brand} {vehicle.name}
          </Text>
          <Text style={styles.plate}>{vehicle.regNumber}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {vehicle.year} • {vehicle.fuel}
          </Text>
        </View>
        {locked ? (
          <Feather name="check-circle" size={20} color="#2563EB" />
        ) : (
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        )}
      </Pressable>
    </BookingSectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 64, height: 48, borderRadius: 10 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  plate: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#2563EB' },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  emptyText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2563EB' },
});
