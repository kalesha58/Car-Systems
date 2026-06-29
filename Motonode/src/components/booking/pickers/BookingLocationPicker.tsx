import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { LocationType } from '@context/ServiceBookingContext';
import { SERVICE_WORKSHOPS } from '@data/mockData';
import { useColors } from '@hooks/useColors';

interface BookingLocationPickerProps {
  workshopId: string;
  locationType: LocationType;
  onSelectWorkshop: (id: string) => void;
  onSelectLocationType: (type: LocationType) => void;
}

export function BookingLocationPicker({
  workshopId,
  locationType,
  onSelectWorkshop,
  onSelectLocationType,
}: BookingLocationPickerProps) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
        {(['workshop', 'pickup'] as LocationType[]).map((type) => {
          const selected = locationType === type;
          return (
            <Pressable
              key={type}
              style={[styles.toggleBtn, selected && styles.toggleBtnActive]}
              onPress={() => onSelectLocationType(type)}
            >
              <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>
                {type === 'workshop' ? 'Workshop Visit' : 'Pick & Drop'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {SERVICE_WORKSHOPS.map((workshop) => {
        const selected = workshopId === workshop.id;
        return (
          <Pressable
            key={workshop.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: selected ? '#E60012' : colors.border,
              },
            ]}
            onPress={() => onSelectWorkshop(workshop.id)}
          >
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{workshop.name}</Text>
              <Text style={[styles.addr, { color: colors.textSecondary }]}>{workshop.address}</Text>
              <View style={styles.metaRow}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {workshop.rating} • {workshop.distance}
                </Text>
              </View>
            </View>
            {selected && <Feather name="check-circle" size={20} color={colors.icon} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#E60012' },
  toggleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  toggleTextActive: { color: '#ffffff' },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
