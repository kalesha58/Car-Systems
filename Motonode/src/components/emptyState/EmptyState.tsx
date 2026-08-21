import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { useColors } from '@hooks/useColors';
import { typography } from '@theme/typography';

interface EmptyStateProps {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } satisfies ViewStyle,
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  } satisfies TextStyle,
  message: {
    marginTop: 8,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  } satisfies TextStyle,
});
