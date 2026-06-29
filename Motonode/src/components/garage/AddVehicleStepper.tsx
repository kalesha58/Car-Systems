import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

const STEPS = [
  { key: 1, label: 'Vehicle Info' },
  { key: 2, label: 'Documents' },
  { key: 3, label: 'Review' },
  { key: 4, label: 'Complete' },
] as const;

interface AddVehicleStepperProps {
  currentStep: number;
}

export function AddVehicleStepper({ currentStep }: AddVehicleStepperProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  isCompleted && { backgroundColor: colors.muted, borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                  isUpcoming && { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {isCompleted ? (
                  <Feather name="check" size={12} color={colors.textPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      { color: isActive ? colors.primaryForeground : colors.textTertiary },
                    ]}
                  >
                    {stepNumber}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.primary : colors.textTertiary,
                    fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    borderColor: isCompleted ? colors.primary : colors.border,
                    borderStyle: isCompleted ? 'solid' : 'dotted',
                  },
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
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
  },
  connector: {
    width: 16,
    borderTopWidth: 1.5,
    marginTop: 14,
  },
});
