import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

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
                  done && styles.circleDone,
                  active && styles.circleActive,
                ]}
              >
                {done ? (
                  <Feather name="check" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.num, active && styles.numActive]}>{step.num}</Text>
                )}
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{step.label}</Text>
            </View>
            {idx < STEPS.length - 1 && (
              <View style={[styles.line, done && styles.lineDone]} />
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
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  circleActive: { borderColor: '#2563EB' },
  num: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  numActive: { color: '#2563EB' },
  label: { fontSize: 9, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  labelActive: { color: '#2563EB', fontFamily: 'Inter_700Bold' },
  line: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginBottom: 14, marginHorizontal: 2 },
  lineDone: { backgroundColor: '#2563EB' },
});
