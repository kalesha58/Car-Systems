export const FEED_MAX_WIDTH = 560;
export const FEED_TABLET_BREAKPOINT = 768;

export function getFeedColumnWidth(windowWidth: number): number {
  if (windowWidth < FEED_TABLET_BREAKPOINT) return windowWidth;
  return Math.min(windowWidth, FEED_MAX_WIDTH);
}
