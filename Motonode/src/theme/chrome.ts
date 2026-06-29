import { brand } from './brand';

/**
 * App chrome — status bar + screen headers.
 *
 * Change `headerBackground` here to update headers and the system status bar app-wide.
 */
export const chrome = {
  headerBackground: brand.neutral.pureBlack,
  headerForeground: brand.neutral.white,
  statusBarStyle: 'light-content' as const,
  statusBarBackground: brand.neutral.pureBlack,
} as const;

export type AppChrome = typeof chrome;
