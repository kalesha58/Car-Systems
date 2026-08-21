import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingSectionCard } from '@components/booking/sections/BookingSectionCard';
import type { ServiceLocationInfo } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';

interface BookingLocationSectionProps {
  location: ServiceLocationInfo | undefined;
  locationType: 'workshop' | 'pickup';
  onPress?: () => void;
}

export function BookingLocationSection({
  location,
  locationType,
  onPress,
}: BookingLocationSectionProps) {
  const colors = useColors();

  if (!location) {
    return (
      <BookingSectionCard title="Select Location" onChange={onPress}>
        <Pressable style={styles.emptyRow} onPress={onPress}>
          <Feather name="map-pin" size={20} color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Choose service location</Text>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>
      </BookingSectionCard>
    );
  }

  return (
    <BookingSectionCard title="Select Location" onChange={onPress}>
      <Pressable style={styles.row} onPress={onPress}>
        <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
          <Feather name="map-pin" size={18} color={colors.icon} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{location.name}</Text>
          <Text style={[styles.addr, { color: colors.textSecondary }]} numberOfLines={2}>
            {location.address}
          </Text>
          {locationType === 'pickup' && (
            <View style={[styles.pickupBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.pickupText, { color: colors.textSecondary }]}>Home Service</Text>
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
      </Pressable>
    </BookingSectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 64,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  addr: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  pickupBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  pickupText: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  emptyText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
});
