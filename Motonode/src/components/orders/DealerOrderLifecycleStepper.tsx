import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import {
  DEALER_ORDER_LIFECYCLE_STEPS,
  getDealerOrderStepIndex,
  isDealerOrderCancelled,
} from '@utils/displayMappers';

interface DealerOrderLifecycleStepperProps {
  status: string;
  placedAtLabel?: string;
}

export function DealerOrderLifecycleStepper({
  status,
  placedAtLabel,
}: DealerOrderLifecycleStepperProps) {
  const colors = useColors();
  const activeIdx = getDealerOrderStepIndex(status);
  const cancelled = isDealerOrderCancelled(status);
  const completed = activeIdx === DEALER_ORDER_LIFECYCLE_STEPS.length - 1;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Order progress</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {cancelled
          ? 'This order was cancelled'
          : completed
            ? 'All steps completed'
            : 'Complete each step to fulfil this order'}
      </Text>

      <View style={styles.timeline}>
        {DEALER_ORDER_LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = !cancelled && activeIdx > idx;
          const isActive = !cancelled && activeIdx === idx;
          const isPending = cancelled || activeIdx < idx;
          const isLast = idx === DEALER_ORDER_LIFECYCLE_STEPS.length - 1;

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View
                  style={[
                    styles.circle,
                    isDone && styles.circleDone,
                    isActive && styles.circleActive,
                    isPending && !isDone && styles.circlePending,
                    cancelled && styles.circleCancelled,
                  ]}
                >
                  {isDone ? (
                    <Feather name="check" size={14} color="#fff" />
                  ) : (
                    <Feather
                      name={step.icon}
                      size={14}
                      color={isActive ? '#fff' : cancelled ? '#94A3B8' : '#64748B'}
                    />
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.line,
                      isDone && styles.lineDone,
                      isActive && styles.lineActive,
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isActive
                          ? '#E60012'
                          : isDone
                            ? '#10B981'
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {isActive && !cancelled ? (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  ) : null}
                  {isDone ? (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  {step.description}
                </Text>
                {idx === 0 && placedAtLabel ? (
                  <Text style={[styles.stepMeta, { color: colors.textTertiary }]}>{placedAtLabel}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepRail: {
    alignItems: 'center',
    width: 32,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  circleDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  circleActive: {
    backgroundColor: '#E60012',
    borderColor: '#E60012',
  },
  circlePending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  circleCancelled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  lineDone: {
    backgroundColor: '#10B981',
  },
  lineActive: {
    backgroundColor: '#FECACA',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  stepDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    lineHeight: 17,
  },
  stepMeta: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  currentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#E60012',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  doneBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doneBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
});
