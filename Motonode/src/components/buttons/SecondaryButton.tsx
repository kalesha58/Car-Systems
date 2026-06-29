import {
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@hooks/useColors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

interface SecondaryButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  style?: StyleProp<ViewStyle>;
}

export function SecondaryButton({ label, style, ...props }: SecondaryButtonProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
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
          color: colors.textPrimary,
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
