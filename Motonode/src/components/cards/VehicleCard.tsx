import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { cardShadow } from '@utils/shadows';
import type { IDealerVehicle } from '@app-types/vehicle';
import { getVehicleDisplayName } from '@utils/displayMappers';

interface VehicleCardProps {
  vehicle: IDealerVehicle;
  style?: object;
  onNavigate?: () => void;
}

export function VehicleCard({ vehicle, style, onNavigate }: VehicleCardProps) {
  const colors = useColors();
  const imageUri = vehicle.images?.[0] || '';
  const typeLabel = vehicle.vehicleType === 'Bike' ? 'Bike' : 'Car';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 },
        style,
      ]}
      onPress={onNavigate}
    >
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      <View style={[styles.typeBadge, { backgroundColor: colors.primarySubtle }]}>
        <Text style={[styles.typeText, { color: colors.textSecondary }]}>{typeLabel}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.brand, { color: colors.textSecondary }]}>{vehicle.brand}</Text>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {getVehicleDisplayName(vehicle)}
        </Text>
        <View style={styles.specs}>
          {vehicle.fuelType ? (
            <View style={styles.specItem}>
              <Feather name="droplet" size={11} color={colors.textTertiary} />
              <Text style={[styles.specText, { color: colors.textSecondary }]}>{vehicle.fuelType}</Text>
            </View>
          ) : null}
          {vehicle.mileage != null ? (
            <View style={styles.specItem}>
              <Feather name="trending-up" size={11} color={colors.textTertiary} />
              <Text style={[styles.specText, { color: colors.textSecondary }]}>
                {vehicle.mileage} km
              </Text>
            </View>
          ) : null}
          <View style={styles.specItem}>
            <Feather name="calendar" size={11} color={colors.textTertiary} />
            <Text style={[styles.specText, { color: colors.textSecondary }]}>{vehicle.year}</Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <View />
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            ₹{(vehicle.price / 100000).toFixed(2)}L
          </Text>
        </View>
        {vehicle.dealer?.businessName ? (
          <Text style={[styles.dealer, { color: colors.textTertiary }]} numberOfLines={1}>
            {vehicle.dealer.businessName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', width: 200 },
  image: { width: '100%', height: 130 },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  info: { padding: 12 },
  brand: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 2, marginBottom: 8 },
  specs: { flexDirection: 'row', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  specText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  price: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  dealer: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
