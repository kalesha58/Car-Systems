import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { GarageVehicle } from '@data/mockData';

interface GarageCardProps {
  vehicle: GarageVehicle;
  onPress?: () => void;
}

export function GarageCard({ vehicle, onPress }: GarageCardProps) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
      ]}
      onPress={onPress}
    >
      <Image source={{ uri: vehicle.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {vehicle.brand} {vehicle.name}
            </Text>
            <Text style={[styles.regNumber, { color: colors.primary }]}>{vehicle.regNumber}</Text>
          </View>
          <View style={[styles.yearBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.year, { color: colors.textSecondary }]}>{vehicle.year}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Feather name="activity" size={14} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {vehicle.kmsDriven.toLocaleString('en-IN')} km
            </Text>
          </View>
          <View style={styles.stat}>
            <Feather name="tool" size={14} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.textSecondary }]} numberOfLines={1}>
              Service: {vehicle.nextService}
            </Text>
          </View>
          <View style={styles.stat}>
            <Feather name="shield" size={14} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.textSecondary }]} numberOfLines={1}>
              {vehicle.insurance}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Feather name="tool" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Book Service</Text>
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
  actionBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
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
