import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@hooks/useColors';

interface ChromeHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra padding below the safe-area inset. Default 12. */
  contentPad?: number;
}

/** Solid app header — background from `theme/chrome.ts` via `colors.header`. */
export function ChromeHeader({ children, style, contentPad = 12 }: ChromeHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // Web has no native status bar; keep a small inset (not the old 67px phone-frame hack).
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.header,
          paddingTop: topPad + contentPad,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
});
