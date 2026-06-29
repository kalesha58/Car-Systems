import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@hooks/useColors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, style, ...props }: PrimaryButtonProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[
        {
          backgroundColor: colors.primary,
          paddingVertical: spacing.sm + 4,
          paddingHorizontal: spacing.lg,
          borderRadius: colors.radius.sm,
          alignItems: 'center',
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={{
          color: colors.primaryForeground,
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
