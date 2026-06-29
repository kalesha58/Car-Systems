import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** YYYY-MM-DD */
  selectedDate?: string;
  /** YYYY-MM-DD */
  onDateSelect: (date: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value?: string): Date | null {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export function formatDateDisplay(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function DatePickerSheet({
  visible,
  onClose,
  title = 'Select Date',
  selectedDate,
  onDateSelect,
  minimumDate,
  maximumDate,
}: DatePickerSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const maxHeight = Dimensions.get('window').height * 0.75;

  const minDate = useMemo(() => {
    const d = minimumDate ? new Date(minimumDate) : new Date(1990, 0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minimumDate]);

  const maxDate = useMemo(() => {
    const d = maximumDate ? new Date(maximumDate) : new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, [maximumDate]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const initial = parseIsoDate(selectedDate) ?? new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  useEffect(() => {
    if (!visible) return;
    const initial = parseIsoDate(selectedDate) ?? new Date();
    setCurrentMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
  }, [visible, selectedDate]);

  const monthLabel = currentMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const isDateDisabled = (date: Date) => {
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    const max = new Date(maxDate);
    max.setHours(0, 0, 0, 0);
    return check < min || check > max;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return toIsoDate(date) === selectedDate;
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isDateDisabled(date)) return;
    lightHaptic();
    onDateSelect(toIsoDate(date));
    onClose();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    lightHaptic();
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return next;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + 16,
              maxHeight,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.monthNav}>
            <Pressable style={styles.navBtn} onPress={() => navigateMonth('prev')}>
              <Feather name="chevron-left" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.monthText, { color: colors.textPrimary }]}>{monthLabel}</Text>
            <Pressable style={styles.navBtn} onPress={() => navigateMonth('next')}>
              <Feather name="chevron-right" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={[styles.weekDay, { color: colors.textTertiary }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {emptyDays.map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}
            {days.map((day) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);

              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayCell,
                    selected && { backgroundColor: colors.primary },
                    disabled && styles.dayDisabled,
                  ]}
                  onPress={() => handleDateSelect(day)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: selected
                          ? colors.primaryForeground
                          : disabled
                            ? colors.textTertiary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
