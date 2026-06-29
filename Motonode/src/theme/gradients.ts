import { brand } from './brand';
import { chrome } from './chrome';

export const gradients = {
  /** Primary CTAs — login, checkout, confirm buttons */
  primary: [brand.red.gradientStart, brand.red.gradientEnd] as const,
  primaryPressed: [brand.red.primary, brand.red.deep] as const,
  /** @deprecated Use solid `colors.header` via ChromeHeader — kept for legacy LinearGradient */
  dark: [chrome.headerBackground, chrome.headerBackground] as const,
  header: [chrome.headerBackground, chrome.headerBackground] as const,
  /** Auth / hero marketing blocks only */
  hero: [brand.red.deep, brand.red.primary] as const,
} as const;

export type AppGradients = typeof gradients;
