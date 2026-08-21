import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { UserVehicle } from '../../../types/userVehicle';
import { useColors } from '@hooks/useColors';

interface BookingVehiclePickerProps {
  vehicles: UserVehicle[];
  selectedId: string;
  locked?: boolean;
  onSelect: (id: string) => void;
}

export function BookingVehiclePicker({
  vehicles,
  selectedId,
  locked,
  onSelect,
}: BookingVehiclePickerProps) {
  const colors = useColors();
  const list = locked ? vehicles.filter((v) => v.id === selectedId) : vehicles;

  return (
    <View style={styles.wrap}>
      {list.map((vehicle) => {
        const selected = selectedId === vehicle.id;
        const imageUri = vehicle.images?.[0];
        return (
          <Pressable
            key={vehicle.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => !locked && onSelect(vehicle.id)}
            disabled={locked}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
                <Feather name="truck" size={16} color={colors.icon} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text style={[styles.plate, { color: colors.textSecondary }]}>{vehicle.numberPlate}</Text>
              {vehicle.year ? (
                <Text style={[styles.meta, { color: colors.textSecondary }]}>{vehicle.year}</Text>
              ) : null}
            </View>
            {selected && <Feather name="check-circle" size={20} color={colors.icon} />}
          </Pressable>
        );
      })}

      {!locked && (
        <Pressable style={[styles.addBtn, { borderColor: colors.border }]}>
          <Feather name="plus" size={16} color={colors.icon} />
          <Text style={[styles.addText, { color: colors.textSecondary }]}>Add New Vehicle</Text>
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
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  plate: { fontSize: 11, fontFamily: 'Inter_700Bold', marginTop: 2 },
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
  addText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
