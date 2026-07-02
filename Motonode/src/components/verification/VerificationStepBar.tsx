import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@hooks/useColors';
import { typography } from '@theme/typography';

interface VerificationStepBarProps {
  steps: string[];
  activeIndex: number;
}

export function VerificationStepBar({ steps, activeIndex }: VerificationStepBarProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;

        return (
          <View key={step} style={styles.stepWrap}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isComplete || isActive ? '#E60012' : colors.border,
                },
              ]}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? '#E60012' : colors.textTertiary,
                  fontWeight: isActive
                    ? typography.fontWeight.semibold
                    : typography.fontWeight.medium,
                },
              ]}
            >
              {step}
            </Text>
            {index < steps.length - 1 ? (
              <View
                style={[
                  styles.line,
                  { backgroundColor: isComplete ? '#E60012' : colors.border },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  stepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  label: {
    fontSize: typography.fontSize.xs,
  },
  line: {
    width: 24,
    height: 2,
    marginHorizontal: 6,
    borderRadius: 1,
  },
});
