import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { GarageVehicle } from '@data/mockData';
import { GARAGE_VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';

interface BookingVehiclePickerProps {
  selectedId: string;
  locked?: boolean;
  onSelect: (id: string) => void;
}

export function BookingVehiclePicker({ selectedId, locked, onSelect }: BookingVehiclePickerProps) {
  const colors = useColors();
  const vehicles = locked
    ? GARAGE_VEHICLES.filter((v) => v.id === selectedId)
    : GARAGE_VEHICLES;

  return (
    <View style={styles.wrap}>
      {vehicles.map((vehicle) => {
        const selected = selectedId === vehicle.id;
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
            onPress={() => !locked && onSelect(vehicle.id)}
            disabled={locked}
          >
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
            {selected && <Feather name="check-circle" size={20} color={colors.icon} />}
          </Pressable>
        );
      })}

      {!locked && (
        <Pressable style={[styles.addBtn, { borderColor: colors.border }]}>
          <Feather name="plus" size={16} color={colors.icon} />
          <Text style={styles.addText}>Add New Vehicle</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
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
  plate: { fontSize: 11, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary, marginTop: 2 },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
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
