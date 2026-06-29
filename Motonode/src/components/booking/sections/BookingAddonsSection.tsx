import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingSectionCard } from '@components/booking/sections/BookingSectionCard';
import type { ServiceAddon } from '@data/mockData';
import { SERVICE_ADDONS } from '@data/mockData';
import { useColors } from '@hooks/useColors';

const ADDON_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  a1: 'wind',
  a2: 'layers',
  a3: 'droplet',
  a4: 'disc',
};

interface BookingAddonsSectionProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function BookingAddonsSection({ selectedIds, onToggle }: BookingAddonsSectionProps) {
  const colors = useColors();

  return (
    <BookingSectionCard title="Add-on Services (Optional)">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SERVICE_ADDONS.map((addon) => (
          <AddonChip
            key={addon.id}
            addon={addon}
            selected={selectedIds.includes(addon.id)}
            onPress={() => onToggle(addon.id)}
            colors={colors}
          />
        ))}
      </ScrollView>
    </BookingSectionCard>
  );
}

function AddonChip({
  addon,
  selected,
  onPress,
  colors,
}: {
  addon: ServiceAddon;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const icon = ADDON_ICONS[addon.id] ?? 'plus-circle';

  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: selected ? '#EFF6FF' : '#F8FAFC',
            borderColor: selected ? '#2563EB' : '#E2E8F0',
          },
        ]}
      >
        <Feather name={icon} size={20} color={selected ? '#2563EB' : colors.textSecondary} />
        {selected && (
          <View style={styles.checkBadge}>
            <Feather name="check" size={10} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.chipLabel, { color: colors.textPrimary }]} numberOfLines={2}>
        {addon.name}
      </Text>
      <Text style={styles.chipPrice}>₹{addon.price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 14, paddingVertical: 4 },
  chip: { width: 80, alignItems: 'center', gap: 6 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chipLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 13,
  },
  chipPrice: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#2563EB' },
});
