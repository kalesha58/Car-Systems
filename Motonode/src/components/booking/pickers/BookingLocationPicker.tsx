import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { LocationType, ServiceLocationInfo } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';

interface BookingLocationPickerProps {
  location: ServiceLocationInfo | undefined;
  locationType: LocationType;
  homeServiceEnabled?: boolean;
  onSelectLocationType: (type: LocationType) => void;
}

export function BookingLocationPicker({
  location,
  locationType,
  homeServiceEnabled,
  onSelectLocationType,
}: BookingLocationPickerProps) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      {homeServiceEnabled && (
        <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
          {(['workshop', 'pickup'] as LocationType[]).map((type) => {
            const selected = locationType === type;
            return (
              <Pressable
                key={type}
                style={[
                  styles.toggleBtn,
                  selected && { backgroundColor: colors.primary },
                ]}
                onPress={() => onSelectLocationType(type)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: selected ? colors.primaryForeground : colors.textSecondary },
                  ]}
                >
                  {type === 'workshop' ? 'Workshop Visit' : 'Home Service'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {location && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{location.name}</Text>
            <Text style={[styles.addr, { color: colors.textSecondary }]}>{location.address}</Text>
          </View>
          <Feather name="check-circle" size={20} color={colors.icon} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  addr: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
});
