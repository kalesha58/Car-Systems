import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: number;
  color?: string;
}

export function StatCard({ label, value, icon, trend, color }: StatCardProps) {
  const colors = useColors();
  const cardColor = color || colors.primary;
  const isPositive = (trend ?? 0) >= 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: cardColor + '15' }]}>
        <Feather name={icon as React.ComponentProps<typeof Feather>['name']} size={20} color={cardColor} />
      </View>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {trend !== undefined && (
        <View style={styles.trendRow}>
          <Feather
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={12}
            color={isPositive ? colors.success : colors.destructive}
          />
          <Text
            style={[styles.trend, { color: isPositive ? colors.success : colors.destructive }]}
          >
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, minWidth: 100 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  label: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  trend: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
