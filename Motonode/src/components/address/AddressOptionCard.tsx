import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface AddressOptionCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

export function AddressOptionCard({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  selected,
  onPress,
}: AddressOptionCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => {
        lightHaptic();
        onPress();
      }}
      style={[
        styles.card,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <View style={styles.trailing}>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? colors.primary : colors.border,
            },
          ]}
        >
          {selected ? <View style={[styles.radioInner, { backgroundColor: colors.primary }]} /> : null}
        </View>
        <Feather name="chevron-right" size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 13, lineHeight: 18 },
  trailing: { alignItems: 'center', gap: 8 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
