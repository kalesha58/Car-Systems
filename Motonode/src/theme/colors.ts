import { brand } from './brand';
import { chrome } from './chrome';
import { gradients } from './gradients';

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 100,
  button: 16,
  card: 20,
  input: 16,
  chip: 24,
  fab: 28,
  sheet: 32,
} as const;

const light = {
  text: brand.neutral.jetBlack,
  tint: brand.red.primary,
  background: brand.neutral.lightGray,
  foreground: brand.neutral.jetBlack,
  card: brand.neutral.white,
  cardForeground: brand.neutral.jetBlack,
  primary: brand.red.primary,
  primaryDark: brand.red.deep,
  primaryLight: brand.red.light,
  primaryForeground: brand.neutral.white,
  secondary: brand.neutral.jetBlack,
  secondaryForeground: brand.neutral.white,
  accent: brand.semantic.success,
  accentForeground: brand.neutral.white,
  muted: brand.neutral.lightGray,
  mutedForeground: brand.neutral.steelGray,
  surface: brand.neutral.white,
  surfaceSecondary: brand.neutral.lightGray,
  destructive: brand.semantic.error,
  destructiveForeground: brand.neutral.white,
  warning: brand.semantic.warning,
  warningForeground: brand.neutral.jetBlack,
  success: brand.semantic.success,
  successForeground: brand.neutral.white,
  info: brand.semantic.info,
  infoForeground: brand.neutral.white,
  border: brand.neutral.silver,
  input: brand.neutral.silver,
  divider: brand.neutral.silver,
  disabled: brand.neutral.silver,
  disabledForeground: brand.neutral.steelGray,
  textPrimary: brand.neutral.jetBlack,
  textSecondary: brand.neutral.steelGray,
  textTertiary: brand.neutral.steelGray,
  textDisabled: brand.neutral.silver,
  tabBar: brand.neutral.white,
  header: chrome.headerBackground,
  headerForeground: chrome.headerForeground,
  statusBarStyle: chrome.statusBarStyle,
  statusBarBackground: chrome.statusBarBackground,
  aiGradientStart: brand.red.gradientStart,
  aiGradientEnd: brand.red.primary,
  primaryGradientStart: brand.red.gradientStart,
  primaryGradientEnd: brand.red.gradientEnd,
  starActive: brand.semantic.warning,
  overlay: 'rgba(0,0,0,0.5)',
  white: brand.neutral.white,
  black: brand.neutral.jetBlack,
  placeholder: brand.neutral.steelGray,
  /** Default icon tint — neutral, not brand red */
  icon: brand.neutral.graphiteMid,
  /** Tappable text links and “View all” affordances */
  link: brand.red.primary,
  /** Soft red wash for badges / highlights */
  primarySubtle: brand.red.subtle,
};

const dark = {
  text: brand.neutral.white,
  tint: brand.red.light,
  background: brand.neutral.jetBlack,
  foreground: brand.neutral.white,
  card: brand.neutral.graphite,
  cardForeground: brand.neutral.white,
  primary: brand.red.primary,
  primaryDark: brand.red.deep,
  primaryLight: brand.red.light,
  primaryForeground: brand.neutral.white,
  secondary: brand.neutral.graphite,
  secondaryForeground: brand.neutral.white,
  accent: brand.semantic.success,
  accentForeground: brand.neutral.white,
  muted: brand.neutral.graphite,
  mutedForeground: brand.neutral.silver,
  surface: brand.neutral.graphite,
  surfaceSecondary: brand.neutral.jetBlack,
  destructive: brand.semantic.error,
  destructiveForeground: brand.neutral.white,
  warning: brand.semantic.warning,
  warningForeground: brand.neutral.jetBlack,
  success: brand.semantic.success,
  successForeground: brand.neutral.white,
  info: brand.semantic.info,
  infoForeground: brand.neutral.white,
  border: brand.neutral.graphite,
  divider: brand.neutral.graphiteMid,
  input: brand.neutral.graphite,
  disabled: brand.neutral.graphiteMid,
  disabledForeground: brand.neutral.steelGray,
  textPrimary: brand.neutral.white,
  textSecondary: brand.neutral.silver,
  textTertiary: brand.neutral.steelGray,
  textDisabled: brand.neutral.graphiteMid,
  tabBar: brand.neutral.jetBlack,
  header: chrome.headerBackground,
  headerForeground: chrome.headerForeground,
  statusBarStyle: chrome.statusBarStyle,
  statusBarBackground: chrome.statusBarBackground,
  aiGradientStart: brand.red.gradientStart,
  aiGradientEnd: brand.red.deep,
  primaryGradientStart: brand.red.gradientStart,
  primaryGradientEnd: brand.red.gradientEnd,
  starActive: brand.semantic.warning,
  overlay: 'rgba(0,0,0,0.7)',
  white: brand.neutral.white,
  black: brand.neutral.jetBlack,
  placeholder: brand.neutral.steelGray,
  icon: brand.neutral.silver,
  link: brand.red.light,
  primarySubtle: 'rgba(230, 0, 18, 0.15)',
};

const colors = {
  light,
  dark,
  radius,
  gradients,
};

export type ColorPalette = (typeof light | typeof dark) & {
  radius: typeof radius;
  gradients: typeof gradients;
};

/** Static light palette for legacy StyleSheet.create usage */
export const themeLight = { ...light, radius, gradients };

export { colors, gradients, radius };
export default colors;
