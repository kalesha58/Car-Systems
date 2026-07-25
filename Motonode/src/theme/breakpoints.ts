/** Responsive layout breakpoints (min-width, px). */
export const breakpoints = {
  sm: 0,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/** Max content width for desktop pages. */
export const CONTENT_MAX_WIDTH = 1200;

export function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
}
