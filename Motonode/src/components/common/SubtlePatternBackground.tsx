import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

const DOT_SIZE = 2;
const GAP_X = 24;
const GAP_Y = 24;

interface SubtlePatternBackgroundProps {
  dotColor?: string;
}

/** Light dot-grid texture for screen backgrounds. */
export function SubtlePatternBackground({
  dotColor = 'rgba(13, 13, 13, 0.05)',
}: SubtlePatternBackgroundProps) {
  const { width, height } = useWindowDimensions();

  const dots = useMemo(() => {
    const items: { id: string; left: number; top: number }[] = [];
    const cols = Math.ceil(width / GAP_X) + 1;
    const rows = Math.ceil(height / GAP_Y) + 1;

    for (let row = 0; row < rows; row += 1) {
      const rowOffset = row % 2 === 0 ? 0 : GAP_X / 2;
      for (let col = 0; col < cols; col += 1) {
        items.push({
          id: `${row}-${col}`,
          left: col * GAP_X + rowOffset,
          top: row * GAP_Y,
        });
      }
    }

    return items;
  }, [width, height]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      {dots.map((dot) => (
        <View
          key={dot.id}
          style={[
            styles.dot,
            {
              left: dot.left,
              top: dot.top,
              backgroundColor: dotColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
