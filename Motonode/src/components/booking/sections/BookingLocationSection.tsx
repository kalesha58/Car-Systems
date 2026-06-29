import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingSectionCard } from '@components/booking/sections/BookingSectionCard';
import type { ServiceWorkshop } from '@data/mockData';
import { useColors } from '@hooks/useColors';

const WORKSHOP_IMAGE =
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&auto=format&fit=crop&q=80';

interface BookingLocationSectionProps {
  workshop: ServiceWorkshop | undefined;
  locationType: 'workshop' | 'pickup';
  onPress?: () => void;
}

export function BookingLocationSection({
  workshop,
  locationType,
  onPress,
}: BookingLocationSectionProps) {
  const colors = useColors();

  if (!workshop) {
    return (
      <BookingSectionCard title="Select Location" onChange={onPress}>
        <Pressable style={styles.emptyRow} onPress={onPress}>
          <Feather name="map-pin" size={20} color="#2563EB" />
          <Text style={styles.emptyText}>Choose service location</Text>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>
      </BookingSectionCard>
    );
  }

  return (
    <BookingSectionCard title="Select Location" onChange={onPress}>
      <Pressable style={styles.row} onPress={onPress}>
        <Image source={{ uri: WORKSHOP_IMAGE }} style={styles.image} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{workshop.name}</Text>
          <Text style={[styles.addr, { color: colors.textSecondary }]} numberOfLines={2}>
            {workshop.address}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="star" size={11} color="#F59E0B" />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {workshop.rating} • {workshop.distance} away
            </Text>
            {locationType === 'pickup' && (
              <View style={styles.pickupBadge}>
                <Text style={styles.pickupText}>Pick & Drop</Text>
              </View>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
      </Pressable>
    </BookingSectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 64, height: 48, borderRadius: 10 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  addr: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  meta: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  pickupBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  pickupText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  emptyText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2563EB' },
});
