import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Matches custom tab bar height in CustomerTabsNavigator (60 + safe area). */
export function useTabBarBottomPadding(extra = 16) {
  const insets = useSafeAreaInsets();
  const bottomInset =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 20 : 8;
  const tabBarHeight = 60 + bottomInset;

  if (Platform.OS === 'web') {
    return 34 + extra;
  }

  return tabBarHeight + extra;
}
