import { Platform, TextStyle } from 'react-native';

/** Platform system UI font — SF Pro Text (iOS) / Roboto (Android). */
export const UI_FONT_FAMILY = Platform.select({
  ios: 'SF Pro Text',
  android: 'Roboto',
  default: 'System',
}) as string;

export enum Fonts {
  Regular = 'Regular',
  Light = 'Light',
  Medium = 'Medium',
  SemiBold = 'SemiBold',
  Bold = 'Bold',
}

export const FONT_WEIGHTS: Record<Fonts, TextStyle['fontWeight']> = {
  [Fonts.Light]: '300',
  [Fonts.Regular]: '400',
  [Fonts.Medium]: '500',
  [Fonts.SemiBold]: '600',
  [Fonts.Bold]: '700',
};

export function fontStyle(weight: Fonts = Fonts.Regular): TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontWeight: FONT_WEIGHTS[weight],
  };
}
