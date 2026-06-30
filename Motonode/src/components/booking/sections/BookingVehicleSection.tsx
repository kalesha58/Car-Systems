import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingSectionCard } from '@components/booking/sections/BookingSectionCard';
import type { UserVehicle } from '../../../types/userVehicle';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';

interface BookingVehicleSectionProps {
  vehicle: UserVehicle | undefined;
  locked?: boolean;
  onPress?: () => void;
}

export function BookingVehicleSection({ vehicle, locked, onPress }: BookingVehicleSectionProps) {
  const colors = useColors();

  if (!vehicle) {
    return (
      <BookingSectionCard title="Select Vehicle" onChange={onPress}>
        <Pressable style={styles.emptyRow} onPress={onPress}>
          <Feather name="plus-circle" size={20} color={colors.icon} />
          <Text style={styles.emptyText}>Choose a vehicle</Text>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>
      </BookingSectionCard>
    );
  }

  const imageUri = vehicle.images?.[0];

  return (
    <BookingSectionCard
      title={locked ? 'Your Vehicle' : 'Select Vehicle'}
      onChange={locked ? undefined : onPress}
    >
      <Pressable style={styles.row} onPress={locked ? undefined : onPress} disabled={locked}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Feather name="truck" size={16} color={colors.icon} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text style={styles.plate}>{vehicle.numberPlate}</Text>
          {vehicle.year ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{vehicle.year}</Text>
          ) : null}
        </View>
        {locked ? (
          <Feather name="check-circle" size={20} color={colors.icon} />
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
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  plate: { fontSize: 11, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  emptyText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: themeLight.textSecondary },
});
