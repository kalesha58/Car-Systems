import type { ImageSourcePropType } from 'react-native';

import MotonodeAppLogoAsset from './Motonode-App-Logo.png';

/**
 * Metro returns a numeric asset id; Vite returns a URL string.
 * Normalize so <Image source={...} /> works on native and web.
 */
export const MotonodeAppLogo: ImageSourcePropType =
  typeof MotonodeAppLogoAsset === 'string'
    ? { uri: MotonodeAppLogoAsset }
    : MotonodeAppLogoAsset;
