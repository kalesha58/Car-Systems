import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { useColors } from '@hooks/useColors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

interface DealerCardProps {
  name: string;
  location: string;
}

export function DealerCard({ name, location }: DealerCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
      <Text style={[styles.location, { color: colors.textSecondary }]}>{location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  } satisfies ViewStyle,
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  } satisfies TextStyle,
  location: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
  } satisfies TextStyle,
});
