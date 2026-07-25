import { Platform, StyleSheet, type ViewStyle } from 'react-native';

function webBoxShadow(
  color: string,
  opacity: number,
  radius: number,
  offset: { width: number; height: number },
): ViewStyle {
  if (Platform.OS === 'web') {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}${alpha}`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: offset,
    elevation: Math.max(1, Math.round(radius / 2)),
  };
}

export const cardShadow = StyleSheet.create({
  shadow: webBoxShadow('#000000', 0.06, 8, { width: 0, height: 2 }),
}).shadow;

export const elevatedCardShadow = StyleSheet.create({
  shadow: webBoxShadow('#0F172A', 0.12, 16, { width: 0, height: 6 }),
}).shadow;
