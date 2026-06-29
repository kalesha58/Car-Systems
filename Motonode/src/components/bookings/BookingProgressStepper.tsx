import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { BookingTimelineStep } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';

interface BookingProgressStepperProps {
  steps: BookingTimelineStep[];
  compact?: boolean;
}

export function BookingProgressStepper({ steps, compact }: BookingProgressStepperProps) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      {steps.map((step, idx) => (
        <React.Fragment key={step.key}>
          <View style={[styles.stepItem, compact && styles.stepItemCompact]}>
            <View
              style={[
                styles.circle,
                step.completed && styles.circleDone,
                step.active && styles.circleActive,
              ]}
            >
              {step.completed ? (
                <Feather name="check" size={compact ? 10 : 12} color="#fff" />
              ) : step.active ? (
                <Feather
                  name={step.key === 'in_progress' ? 'tool' : 'circle'}
                  size={compact ? 10 : 12}
                  color="#fff"
                />
              ) : (
                <View style={styles.dot} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color: step.active ? '#E60012' : colors.textSecondary },
                step.completed && { color: '#10B981' },
              ]}
              numberOfLines={2}
            >
              {step.label}
            </Text>
            {step.dateLabel && (
              <Text style={[styles.dateLabel, { color: colors.textTertiary }]}>
                {step.dateLabel}
              </Text>
            )}
          </View>
          {idx < steps.length - 1 && (
            <View
              style={[
                styles.line,
                step.completed && styles.lineDone,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { flex: 1, alignItems: 'center', gap: 4, minWidth: 56 },
  stepItemCompact: { minWidth: 48 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  circleActive: { backgroundColor: '#E60012', borderColor: '#E60012' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  label: { fontSize: 9, fontFamily: 'Inter_500Medium', textAlign: 'center', lineHeight: 12 },
  dateLabel: { fontSize: 8, fontFamily: 'Inter_400Regular' },
  line: {
    width: 12,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 14,
  },
  lineDone: { backgroundColor: '#10B981' },
});
