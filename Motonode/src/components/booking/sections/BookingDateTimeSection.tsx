import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookingSectionCard } from '@components/booking/sections/BookingSectionCard';
import type { IServiceSlot } from '../../../types/service';
import { useColors } from '@hooks/useColors';
import { getBookingDateOptions, formatSlotTime } from '@utils/bookingMappers';

interface BookingDateTimeSectionProps {
  date: string;
  timeSlot: string;
  slots: IServiceSlot[];
  slotsLoading?: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (slotId: string, startTime: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function BookingDateTimeSection({
  date,
  timeSlot,
  slots,
  slotsLoading,
  onDateChange,
  onTimeChange,
  expanded = true,
  onToggleExpand,
}: BookingDateTimeSectionProps) {
  const colors = useColors();
  const dates = getBookingDateOptions(7);

  const visibleSlots = useMemo(() => (expanded ? slots : slots.slice(0, 5)), [expanded, slots]);
  const hasMore = slots.length > 5;

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
                  backgroundColor: selected ? colors.primary : colors.muted,
                  borderColor: selected ? colors.primary : colors.border,
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

      {slotsLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : visibleSlots.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No slots available for this date
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
          {visibleSlots.map((slot) => {
            const label = formatSlotTime(slot.startTime);
            const selected = timeSlot === label;
            return (
              <Pressable
                key={slot.id}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => onTimeChange(slot.id, slot.startTime)}
              >
                <Text style={[styles.timeText, { color: selected ? '#fff' : colors.textPrimary }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
          {hasMore && onToggleExpand && (
            <Pressable
              style={[
                styles.moreChip,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={onToggleExpand}
            >
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                {expanded ? 'Less' : 'More'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}
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
    justifyContent: 'center',
  },
  moreText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 11, fontFamily: 'Inter_400Regular', paddingVertical: 8 },
});
