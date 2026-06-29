import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { cardShadow } from '@utils/shadows';

interface PromoBannerProps {
  onPress?: () => void;
}

export function PromoBanner({ onPress }: PromoBannerProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, cardShadow, { backgroundColor: colors.card }]}>
      <View style={[styles.card, { backgroundColor: colors.primarySubtle }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <Feather name="tag" size={20} color={colors.link} />
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>First Service Free!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Book any mechanic service and get ₹200 off
            </Text>
          </View>
          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={onPress}>
            <Text style={styles.btnText}>Book Now</Text>
            <Feather name="chevron-right" size={12} color="#fff" />
          </Pressable>
        </View>
        <Feather
          name="tool"
          size={84}
          color={colors.primarySubtle}
          style={styles.watermark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 20,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    lineHeight: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2,
  },
  btnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  watermark: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    opacity: 0.06, // Highly transparent wrench icon
  },
});
