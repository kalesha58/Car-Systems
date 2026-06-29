import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@hooks/useColors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
