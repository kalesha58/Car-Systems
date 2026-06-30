import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { IUserVehicle } from '@app-types/vehicle';

interface GarageCardProps {
  vehicle: IUserVehicle;
  onPress?: () => void;
}

export function GarageCard({ vehicle, onPress }: GarageCardProps) {
  const colors = useColors();
  const imageUri = vehicle.images?.[0] || '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
      ]}
      onPress={onPress}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
          <Feather name="truck" size={32} color={colors.icon} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {vehicle.brand} {vehicle.model}
            </Text>
            <Text style={[styles.regNumber, { color: colors.textSecondary }]}>
              {vehicle.numberPlate}
            </Text>
          </View>
          {vehicle.year ? (
            <View style={[styles.yearBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.year, { color: colors.textSecondary }]}>{vehicle.year}</Text>
            </View>
          ) : null}
        </View>
        {vehicle.color ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Feather name="droplet" size={14} color={colors.icon} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{vehicle.color}</Text>
              </View>
            </View>
          </>
        ) : null}
        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Feather name="tool" size={14} color={colors.primaryForeground} />
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Book Service</Text>
          </Pressable>
          <Pressable style={[styles.actionBtnOutline, { borderColor: colors.border }]}>
            <Feather name="file-text" size={14} color={colors.textSecondary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.textSecondary }]}>
              Documents
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 16 },
  image: { width: '100%', height: 160 },
  info: { padding: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  name: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  regNumber: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  yearBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  year: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginBottom: 12 },
  stats: { gap: 8, marginBottom: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statValue: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnOutlineText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
