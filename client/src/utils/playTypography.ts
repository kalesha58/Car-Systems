import { Platform, TextStyle } from 'react-native';
import { Fonts } from '@utils/Constants';

/** System UI font for the Play feed — clearer at small sizes than rounded custom faces. */
export const PLAY_UI_FONT = Platform.select({
  ios: 'SF Pro Text',
  android: 'Roboto',
  default: Fonts.Regular,
}) as string;

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
