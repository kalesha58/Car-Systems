import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { BookingFilter } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

const FILTERS: { key: BookingFilter; label: string }[] = [
  { key: 'all', label: 'All Bookings' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

interface BookingStatusTabsProps {
  active: BookingFilter;
  onChange: (filter: BookingFilter) => void;
}

export function BookingStatusTabs({ active, onChange }: BookingStatusTabsProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((f) => {
        const selected = active === f.key;
        return (
          <Pressable
            key={f.key}
            style={styles.tabWrap}
            onPress={() => {
              lightHaptic();
              onChange(f.key);
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: selected ? '#E60012' : colors.textSecondary },
                selected && styles.tabTextActive,
              ]}
            >
              {f.label}
            </Text>
            {selected && <View style={styles.underline} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 16, paddingVertical: 4 },
  tabWrap: { alignItems: 'center', gap: 6, paddingBottom: 4 },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  tabTextActive: { fontFamily: 'Inter_700Bold' },
  underline: { height: 2, width: '100%', backgroundColor: '#E60012', borderRadius: 1 },
});
