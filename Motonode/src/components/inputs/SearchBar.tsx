import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { themeLight as colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

export function SearchBar(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={styles.input}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  } satisfies TextStyle,
});
