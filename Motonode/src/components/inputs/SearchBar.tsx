import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { useColors } from '@hooks/useColors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

export function SearchBar(props: TextInputProps) {
  const colors = useColors();

  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={[
        styles.input,
        {
          borderColor: colors.border,
          color: colors.textPrimary,
          backgroundColor: colors.card,
        },
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.fontSize.md,
  } satisfies TextStyle,
});
