import { TextStyle } from 'react-native';
import { UI_FONT_FAMILY } from './typography';

/** System UI font for the Play feed — clearer at small sizes than rounded custom faces. */
export const PLAY_UI_FONT = UI_FONT_FAMILY;

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
