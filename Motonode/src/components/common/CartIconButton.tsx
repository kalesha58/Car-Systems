import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useCart } from '@context/index';
import { useColors } from '@hooks/useColors';

interface CartIconButtonProps {
  onPress: () => void;
  size?: number;
}

export function CartIconButton({ onPress, size = 22 }: CartIconButtonProps) {
  const colors = useColors();
  const { count: cartCount } = useCart();

  return (
    <Pressable style={styles.iconBtn} onPress={onPress}>
      <Feather name="shopping-cart" size={size} color={colors.textSecondary} />
      {cartCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{cartCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
});
