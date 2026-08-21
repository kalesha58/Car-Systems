import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  { num: 1, label: 'Date' },
  { num: 2, label: 'Vehicle' },
  { num: 3, label: 'Location' },
  { num: 4, label: 'Add-ons' },
  { num: 5, label: 'Summary' },
  { num: 6, label: 'Payment' },
] as const;

interface BookingStepBarProps {
  current: BookingStep;
}

export function BookingStepBar({ current }: BookingStepBarProps) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
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
                  done && { backgroundColor: colors.primary, borderColor: colors.primary },
                  active && { borderColor: colors.primary },
                ]}
              >
                {done ? (
                  <Feather name="check" size={12} color={colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.num,
                      { color: colors.textTertiary },
                      active && { color: colors.textPrimary },
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
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  item: { alignItems: 'center', gap: 4, minWidth: 44 },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  line: { flex: 1, height: 2, marginBottom: 14, marginHorizontal: 2 },
});
