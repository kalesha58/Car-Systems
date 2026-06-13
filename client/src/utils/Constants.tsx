import { Platform, StatusBar } from 'react-native';

/** Tighter offset under status bar for app headers (full safe area often feels too tall). */
export function headerTopInset(safeTop: number): number {
  const base =
    safeTop > 0
      ? safeTop
      : Platform.OS === 'android'
        ? StatusBar.currentHeight ?? 0
        : 0;
  const relax = Platform.OS === 'ios' ? 10 : 8;
  return Math.max(base - relax, 0);
}

export enum Colors {
    primary = '#f7ca49',
    primary_light = '#ffe141',
    secondary = '#0d8320',
    text = '#363636',
    disabled = '#9197a6',
    border = "#d0d4dc",
    backgroundSecondary = '#f5f6fb'
}

export { Fonts, fontStyle, UI_FONT_FAMILY } from './typography';

/** Minimum tap area (pt) for primary header / nav controls — iPad & accessibility friendly */
export const MIN_TOUCH_TARGET = 44;

export const lightColors = [
    'rgba(255,255,255,1)',
    'rgba(255,255,255,0.9)',
    'rgba(255,255,255,0.7)',
    'rgba(255,255,255,0.6)',
    'rgba(255,255,255,0.5)',
    'rgba(255,255,255,0.4)',
    'rgba(255,255,255,0.003)',
];

export const darkWeatherColors = [
    'rgba(54, 67, 92, 1)',
    'rgba(54, 67, 92, 0.9)',
    'rgba(54, 67, 92, 0.8)',
    'rgba(54, 67, 92, 0.2)',
    'rgba(54, 67, 92, 0.0)',

];
