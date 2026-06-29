import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

interface CategoryChipProps {
  label: string;
  icon: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, icon, isSelected, onPress }: CategoryChipProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? colors.primary : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.muted },
        ]}
      >
        <Feather
          name={icon as React.ComponentProps<typeof Feather>['name']}
          size={20}
          color={isSelected ? '#fff' : colors.primary}
        />
      </View>
      <Text style={[styles.label, { color: isSelected ? '#fff' : colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 76,
    gap: 6,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },
});
