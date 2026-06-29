import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { themeLight as colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
}

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  } satisfies ViewStyle,
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  } satisfies TextStyle,
  subtitle: {
    marginTop: 8,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  } satisfies TextStyle,
});
