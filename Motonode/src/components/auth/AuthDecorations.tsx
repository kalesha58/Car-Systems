import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { useColors } from '@hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AuthHeaderDecoration() {
  const colors = useColors();

  return (
    <View style={styles.headerDecor} pointerEvents="none">
      <View style={styles.hexRow}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.hexDot,
              {
                backgroundColor: colors.border,
                opacity: 0.35 + (i % 3) * 0.15,
                marginLeft: i % 2 === 0 ? 0 : 6,
              },
            ]}
          />
        ))}
      </View>
      <View
        style={[
          styles.swoosh,
          styles.swooshLeft,
          { backgroundColor: colors.muted, borderTopColor: colors.primary },
        ]}
      />
      <View
        style={[
          styles.swoosh,
          styles.swooshRight,
          { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.textSecondary },
        ]}
      />
    </View>
  );
}

export function AuthFooterDecoration() {
  const colors = useColors();

  return (
    <View style={styles.footerDecor} pointerEvents="none">
      <View style={styles.cityLine}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.building,
              {
                backgroundColor: colors.textSecondary,
                height: 18 + (i % 4) * 10,
                width: 14 + (i % 3) * 6,
                marginRight: 4,
              },
            ]}
          />
        ))}
      </View>
      <View style={[styles.carSilhouette, { backgroundColor: colors.textSecondary }]} />
      <View style={styles.dotGrid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[styles.decorDot, { backgroundColor: colors.primary, opacity: 0.25 + (i % 3) * 0.2 }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    overflow: 'hidden',
  },
  hexRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  hexDot: {
    width: 22,
    height: 22,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  swoosh: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.45,
    height: 90,
    borderRadius: 60,
    opacity: 0.9,
  },
  swooshLeft: {
    left: -SCREEN_WIDTH * 0.18,
    top: 48,
    borderTopWidth: 3,
    transform: [{ rotate: '-18deg' }],
  },
  swooshRight: {
    right: -SCREEN_WIDTH * 0.18,
    top: 52,
    borderBottomWidth: 3,
    transform: [{ rotate: '18deg' }],
  },
  footerDecor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cityLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    opacity: 0.12,
    marginBottom: 8,
  },
  building: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  carSilhouette: {
    position: 'absolute',
    bottom: 28,
    width: 120,
    height: 36,
    borderRadius: 18,
    opacity: 0.1,
  },
  dotGrid: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  decorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
