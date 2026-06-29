import React from 'react';
import { Platform, StatusBar } from 'react-native';

import { useColors } from '@hooks/useColors';

/** Global status bar — driven by `theme/chrome.ts` via `useColors()`. */
export function AppStatusBar() {
  const colors = useColors();

  return (
    <StatusBar
      barStyle={colors.statusBarStyle}
      backgroundColor={colors.statusBarBackground}
      translucent={Platform.OS === 'android'}
    />
  );
}
