import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@hooks/useColors';

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

export function SectionHeader({ title, onViewAll }: SectionHeaderProps) {
  const colors = useColors();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.container, isWeb && styles.containerWeb]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll}>
          <Text style={[styles.viewAll, { color: colors.link }]}>View all</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  containerWeb: {
    marginBottom: 10,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  viewAll: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
