/**
 * Augment react-native-web with native-only APIs used by Motonode.
 * Vite aliases `react-native` → this module.
 *
 * Delegation uses Proxies rather than object spread: several react-native-web
 * exports keep their methods on the prototype, which spreading would drop.
 */
import { Linking as RNLinking, StyleSheet as RNStyleSheet } from 'react-native-web';

export * from 'react-native-web';

export const PermissionsAndroid = {
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  check: async (_permission: string) => true,
  request: async (_permission: string, _rationale?: unknown) => 'granted',
  requestMultiple: async (permissions: string[]) => {
    const result: Record<string, string> = {};
    permissions.forEach(p => {
      result[p] = 'granted';
    });
    return result;
  },
};

type AnyRecord = Record<string, unknown>;

/** Delegate to `target`, overriding only the keys in `overrides`. */
function withOverrides<T extends object>(target: T, overrides: AnyRecord): T {
  return new Proxy(target, {
    get(base, prop, receiver) {
      if (prop in overrides) {
        return overrides[prop as string];
      }
      const value = Reflect.get(base, prop, receiver);
      return typeof value === 'function' ? value.bind(base) : value;
    },
  });
}

export const Linking = withOverrides(RNLinking, {
  openSettings: async () => {
    console.info('[Web] Device settings are managed by the browser / OS.');
  },
});

function colorWithOpacity(color: string, opacity: number): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    const hex =
      color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/** Convert deprecated RN shadow* props to CSS boxShadow for react-native-web. */
function normalizeWebShadow(style: AnyRecord): AnyRecord {
  const hasShadow =
    'shadowColor' in style ||
    'shadowOffset' in style ||
    'shadowOpacity' in style ||
    'shadowRadius' in style;

  if (!hasShadow && !('elevation' in style)) {
    return style;
  }

  const next: AnyRecord = { ...style };

  if (hasShadow && !next.boxShadow) {
    const color = (style.shadowColor as string) || '#000';
    const opacity = typeof style.shadowOpacity === 'number' ? style.shadowOpacity : 0.2;
    const radius = typeof style.shadowRadius === 'number' ? style.shadowRadius : 4;
    const offset = (style.shadowOffset as { width?: number; height?: number }) || {};
    next.boxShadow = `${offset.width ?? 0}px ${offset.height ?? 2}px ${radius}px ${colorWithOpacity(
      color,
      opacity,
    )}`;
  }

  delete next.shadowColor;
  delete next.shadowOffset;
  delete next.shadowOpacity;
  delete next.shadowRadius;
  // Android-only; react-native-web has no equivalent.
  delete next.elevation;

  return next;
}

function normalizeStyles(styles: AnyRecord): AnyRecord {
  const normalized: AnyRecord = {};
  Object.keys(styles).forEach(key => {
    const value = styles[key];
    normalized[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? normalizeWebShadow(value as AnyRecord)
        : value;
  });
  return normalized;
}

export const StyleSheet = withOverrides(RNStyleSheet, {
  create: (styles: AnyRecord) => RNStyleSheet.create(normalizeStyles(styles) as never),
});
