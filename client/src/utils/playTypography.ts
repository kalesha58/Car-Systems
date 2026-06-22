import { Dimensions, TextStyle } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { UI_FONT_FAMILY } from './typography';

/** System UI font for the Play feed — clearer at small sizes than rounded custom faces. */
export const PLAY_UI_FONT = UI_FONT_FAMILY;

/** Caps RFValue on large screens so feed text stays compact on iPad. */
export function playFontSize(base: number): number {
  const scaled = RFValue(base);
  const { width } = Dimensions.get('window');
  if (width >= 768) {
    return Math.min(scaled, base);
  }
  return Math.min(scaled, base + 1);
}

export function playIconSize(base: number): number {
  const scaled = RFValue(base);
  const { width } = Dimensions.get('window');
  if (width >= 768) {
    return Math.min(scaled, base);
  }
  return Math.min(scaled, base + 1);
}

export const PLAY_FEED_FONT = {
  brand: 16,
  username: 10,
  body: 10,
  meta: 8,
  emptyTitle: 11,
  emptyBody: 9,
  modalTitle: 12,
  input: 11,
} as const;

export const PLAY_FEED_ICON = {
  header: 16,
  action: 16,
  menu: 16,
} as const;

export const playFeedText = {
  brand: {
    fontFamily: PLAY_UI_FONT,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },
  username: {
    fontFamily: PLAY_UI_FONT,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.12,
  },
  body: {
    fontFamily: PLAY_UI_FONT,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.05,
  },
  meta: {
    fontFamily: PLAY_UI_FONT,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
} satisfies Record<string, TextStyle>;
