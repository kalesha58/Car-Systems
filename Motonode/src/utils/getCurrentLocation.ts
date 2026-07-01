import { reverseGeocodeForAddress } from './geocoding';
import { getCurrentPositionWithHandling } from './getCurrentPosition';
import type { ILocationData } from '../types/address';

export async function getCurrentLocationWithAddress(): Promise<ILocationData | null> {
  const position = await getCurrentPositionWithHandling('getCurrentLocationWithAddress');
  if (!position) {
    return null;
  }

  const { latitude, longitude } = position.coords;
  return reverseGeocodeForAddress(latitude, longitude);
}
