import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

interface BookingSectionCardProps {
  title: string;
  onChange?: () => void;
  changeLabel?: string;
  children: React.ReactNode;
}

export function BookingSectionCard({
  title,
  onChange,
  changeLabel = 'Change',
  children,
}: BookingSectionCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {onChange && (
          <Pressable onPress={onChange} hitSlop={8}>
            <Text style={[styles.changeText, { color: colors.textSecondary }]}>{changeLabel}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  changeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
