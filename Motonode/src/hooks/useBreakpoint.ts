import { useWindowDimensions } from 'react-native';

import {
  breakpoints,
  getBreakpoint,
  type Breakpoint,
} from '@theme/breakpoints';

export type BreakpointInfo = {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Marketplace / product grid column count. */
  columns: number;
  /** Featured horizontal sections → grid columns on desktop. */
  featuredColumns: number;
  /** Service cards per row on web home. */
  serviceColumns: number;
  contentPadding: number;
};

export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);
  const isPhone = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;

  let columns = 2;
  if (isDesktop) columns = width >= breakpoints.xl ? 4 : 4;
  else if (isTablet) columns = 3;

  let featuredColumns = 0; // 0 = horizontal scroll
  if (isDesktop) featuredColumns = width >= breakpoints.xl ? 5 : 4;
  else if (isTablet) featuredColumns = 3;

  let serviceColumns = 0;
  if (isDesktop) serviceColumns = 5;
  else if (isTablet) serviceColumns = 3;

  let contentPadding = 16;
  if (isDesktop) contentPadding = 32;
  else if (isTablet) contentPadding = 24;

  return {
    width,
    height,
    breakpoint,
    isPhone,
    isTablet,
    isDesktop,
    columns,
    featuredColumns,
    serviceColumns,
    contentPadding,
  };
}
