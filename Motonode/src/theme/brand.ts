/**
 * Motonode brand palette — single source of truth for raw color values.
 *
 * Conventions:
 * - Do NOT import `brand` in screens or feature components.
 * - Use `useColors()` for runtime semantic tokens.
 * - Use `gradients` from the theme for LinearGradient stops.
 * - Info blue is for informational UI only, not primary actions.
 */
export const brand = {
  red: {
    primary: '#E60012',
    deep: '#B0000F',
    light: '#FF1A1A',
    subtle: '#FDECEE',
    gradientStart: '#FF1A1A',
    gradientEnd: '#B0000F',
  },
  neutral: {
    jetBlack: '#0D0D0D',
    pureBlack: '#000000',
    graphite: '#333333',
    graphiteMid: '#4D4D4D',
    steelGray: '#6D6D6D',
    silver: '#D9D9D9',
    lightGray: '#F2F2F2',
    white: '#FFFFFF',
  },
  semantic: {
    success: '#28A745',
    info: '#0D6EFD',
    warning: '#FF9800',
    error: '#DC3545',
  },
} as const;

export type Brand = typeof brand;
