import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { BookingStatus } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';

const STEPS = [
  { key: 'requested', label: 'Requested', icon: 'file-text' as const },
  { key: 'accepted', label: 'Accepted', icon: 'check-circle' as const },
  { key: 'in_progress', label: 'In Progress', icon: 'tool' as const },
  { key: 'completed', label: 'Completed', icon: 'flag' as const },
];

function stepIndexForStatus(status: BookingStatus): number {
  if (status === 'upcoming' || status === 'pending') return 0;
  if (status === 'confirmed') return 1;
  if (status === 'in_progress') return 2;
  if (status === 'completed') return 3;
  return 0;
}

interface DealerBookingStepperProps {
  status: BookingStatus;
  dateTimeLabel?: string;
}

export function DealerBookingStepper({ status, dateTimeLabel }: DealerBookingStepperProps) {
  const colors = useColors();
  const activeIdx = stepIndexForStatus(status);
  const isCancelled = status === 'cancelled' || status === 'rejected';

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        {STEPS.map((step, idx) => {
          const done = idx < activeIdx || (status === 'completed' && idx <= 3);
          const active = idx === activeIdx && !isCancelled;
          const pending = idx > activeIdx || isCancelled;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.circle,
                    done && styles.circleDone,
                    active && styles.circleActive,
                    pending && !done && styles.circlePending,
                  ]}
                >
                  <Feather
                    name={step.icon}
                    size={14}
                    color={done || active ? '#fff' : '#94A3B8'}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: active ? '#E60012' : done ? '#10B981' : colors.textSecondary },
                  ]}
                >
                  {step.label}
                </Text>
                {idx === 0 && dateTimeLabel ? (
                  <Text style={[styles.stepDate, { color: colors.textTertiary }]} numberOfLines={2}>
                    {dateTimeLabel}
                  </Text>
                ) : (
                  <Text style={[styles.stepDate, { color: colors.textTertiary }]}>
                    {done ? 'Done' : active ? 'Active' : 'Pending'}
                  </Text>
                )}
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.line, done && styles.lineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  stepCol: { flex: 1, alignItems: 'center', gap: 4 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  circleActive: { backgroundColor: '#E60012', borderColor: '#E60012' },
  circlePending: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  stepLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  stepDate: { fontSize: 8, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 11 },
  line: {
    width: 16,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 16,
  },
  lineDone: { backgroundColor: '#10B981' },
});
