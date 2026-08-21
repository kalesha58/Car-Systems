import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

export type BookingMasterStep = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: 'Booking' },
  { num: 2, label: 'Review' },
  { num: 3, label: 'Payment' },
  { num: 4, label: 'Confirmation' },
] as const;

interface BookingMasterStepBarProps {
  current: BookingMasterStep;
}

export function BookingMasterStepBar({ current }: BookingMasterStepBarProps) {
  const colors = useColors();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card }]}>
      {STEPS.map((step, idx) => {
        const done = step.num < current;
        const active = step.num === current;
        return (
          <React.Fragment key={step.num}>
            <View style={styles.item}>
              <View
                style={[
                  styles.circle,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  (done || active) && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                {done ? (
                  <Feather name="check" size={12} color={colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.num,
                      { color: colors.textTertiary },
                      active && { color: colors.white },
                    ]}
                  >
                    {step.num}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: colors.textTertiary },
                  active && { color: colors.textPrimary, fontFamily: 'Inter_700Bold' },
                ]}
              >
                {step.label}
              </Text>
            </View>
            {idx < STEPS.length - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: colors.border },
                  done && { backgroundColor: colors.primary },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  item: { alignItems: 'center', gap: 6, minWidth: 56 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  line: { flex: 1, height: 2, marginBottom: 18, marginHorizontal: 4 },
});
