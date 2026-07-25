import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBreakpoint } from './useBreakpoint';

/** Matches custom tab bar height; collapses on desktop where top nav replaces tabs. */
export function useTabBarBottomPadding(extra = 16) {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return extra;
  }

  const bottomInset =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 20 : 8;
  const tabBarHeight = 60 + bottomInset;

  if (Platform.OS === 'web') {
    return 34 + extra;
  }

  return tabBarHeight + extra;
}
