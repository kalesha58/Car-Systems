import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { useColors } from '@hooks/useColors';
import { typography } from '@theme/typography';

interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
}

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  } satisfies TextStyle,
  subtitle: {
    marginTop: 8,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  } satisfies TextStyle,
});
