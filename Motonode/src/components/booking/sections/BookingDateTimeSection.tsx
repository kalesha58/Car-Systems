import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookingSectionCard } from '@components/booking/sections/BookingSectionCard';
import { getServiceBookingDates, SERVICE_TIME_SLOTS } from '@data/mockData';
import { useColors } from '@hooks/useColors';

interface BookingDateTimeSectionProps {
  date: string;
  timeSlot: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function BookingDateTimeSection({
  date,
  timeSlot,
  onDateChange,
  onTimeChange,
  expanded = true,
  onToggleExpand,
}: BookingDateTimeSectionProps) {
  const colors = useColors();
  const dates = getServiceBookingDates(7);

  const visibleSlots = useMemo(() => {
    const all = SERVICE_TIME_SLOTS.flatMap((g) => g.slots);
    return expanded ? all : all.slice(0, 5);
  }, [expanded]);

  const hasMore = SERVICE_TIME_SLOTS.flatMap((g) => g.slots).length > 5;

  return (
    <BookingSectionCard
      title="Select Date & Time"
      onChange={onToggleExpand}
      changeLabel={expanded ? 'Less' : 'More'}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
        {dates.map((d, index) => {
          const selected = date === d.value;
          const dayLabel =
            index === 0
              ? 'Today'
              : index === 1
                ? 'Tomorrow'
                : new Date(d.value).toLocaleDateString('en-IN', { weekday: 'short' });
          return (
            <Pressable
              key={d.value}
              style={[
                styles.dateChip,
                {
                  backgroundColor: selected ? '#2563EB' : '#F1F5F9',
                  borderColor: selected ? '#2563EB' : '#E2E8F0',
                },
              ]}
              onPress={() => onDateChange(d.value)}
            >
              <Text style={[styles.dateDay, { color: selected ? '#fff' : colors.textSecondary }]}>
                {dayLabel}
              </Text>
              <Text style={[styles.dateNum, { color: selected ? '#fff' : colors.textPrimary }]}>
                {new Date(d.value).getDate()}
              </Text>
              <Text style={[styles.dateMonth, { color: selected ? '#fff' : colors.textSecondary }]}>
                {new Date(d.value).toLocaleDateString('en-IN', { month: 'short' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
        {visibleSlots.map((slot) => {
          const selected = timeSlot === slot;
          return (
            <Pressable
              key={slot}
              style={[
                styles.timeChip,
                {
                  backgroundColor: selected ? '#2563EB' : '#F1F5F9',
                  borderColor: selected ? '#2563EB' : '#E2E8F0',
                },
              ]}
              onPress={() => onTimeChange(slot)}
            >
              <Text style={[styles.timeText, { color: selected ? '#fff' : colors.textPrimary }]}>
                {slot}
              </Text>
            </Pressable>
          );
        })}
        {hasMore && onToggleExpand && (
          <Pressable style={styles.moreChip} onPress={onToggleExpand}>
            <Text style={styles.moreText}>{expanded ? 'Less' : 'More'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </BookingSectionCard>
  );
}

const styles = StyleSheet.create({
  dateRow: { gap: 8 },
  dateChip: {
    width: 56,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  dateDay: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  dateNum: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  dateMonth: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  timeRow: { gap: 8 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  timeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  moreChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  moreText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
});
