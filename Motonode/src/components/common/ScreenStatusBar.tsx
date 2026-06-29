import { useCallback } from 'react';
import { Platform, StatusBar, type StatusBarStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useColors } from '@hooks/useColors';

interface ScreenStatusBarProps {
  barStyle?: StatusBarStyle;
  backgroundColor?: string;
}

/**
 * Per-screen status bar override (e.g. auth with a light background).
 * Resets to app chrome defaults when the screen loses focus.
 */
export function ScreenStatusBar({ barStyle, backgroundColor }: ScreenStatusBarProps) {
  const colors = useColors();

  useFocusEffect(
    useCallback(() => {
      const style = barStyle ?? colors.statusBarStyle;
      const bg = backgroundColor ?? colors.statusBarBackground;

      StatusBar.setBarStyle(style);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(bg);
      }

      return () => {
        StatusBar.setBarStyle(colors.statusBarStyle);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor(colors.statusBarBackground);
        }
      };
    }, [barStyle, backgroundColor, colors.statusBarStyle, colors.statusBarBackground]),
  );

  return null;
}
