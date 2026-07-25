import React from 'react';
import { StyleSheet, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

interface StarRatingProps {
  /** Rating between 0 and 5. Rounded to the nearest half for display. */
  rating: number;
  size?: number;
  gap?: number;
}

/**
 * Renders five stars filled to match `rating`. Half values are drawn by
 * overlaying a clipped filled star on top of an empty one, since Feather has
 * no half-star glyph.
 */
export function StarRating({ rating, size = 14, gap = 2 }: StarRatingProps) {
  const colors = useColors();
  const clamped = Math.max(0, Math.min(5, rating || 0));

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((position) => {
        const remainder = clamped - (position - 1);
        const isFull = remainder >= 0.75;
        const isHalf = !isFull && remainder >= 0.25;

        return (
          <View
            key={position}
            style={[styles.starWrapper, { marginRight: position < 5 ? gap : 0 }]}
          >
            <Feather
              name="star"
              size={size}
              color={isFull ? colors.starActive : colors.border}
            />
            {isHalf ? (
              <View style={[styles.halfClip, { width: size / 2, height: size }]}>
                <Feather name="star" size={size} color={colors.starActive} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  starWrapper: { position: 'relative' },
  halfClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
});
