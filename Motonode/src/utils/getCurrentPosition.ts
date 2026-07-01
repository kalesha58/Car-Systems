import Geolocation from 'react-native-geolocation-service';
import { Alert } from 'react-native';
import type { GeoError, GeoPosition } from 'react-native-geolocation-service';

import {
  requestLocationPermission,
  showLocationServicesAlert,
  showLocationSettingsAlert,
} from './locationPermissions';

const GEO_PERMISSION_DENIED = 1;
const GEO_POSITION_UNAVAILABLE = 2;
const GEO_TIMEOUT = 3;

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  forceRequestLocation: true,
  showLocationDialog: true,
} as const;

export function logGeoError(error: GeoError, context = 'GPS'): void {
  console.log(`[${context}] error`, {
    code: error.code,
    message: error.message,
    PERMISSION_DENIED: GEO_PERMISSION_DENIED,
    POSITION_UNAVAILABLE: GEO_POSITION_UNAVAILABLE,
    TIMEOUT: GEO_TIMEOUT,
  });
}

export function getGeoErrorMessage(error: GeoError): string {
  switch (error.code) {
    case GEO_PERMISSION_DENIED:
      return 'Location permission was denied. Enable it in app settings.';
    case GEO_POSITION_UNAVAILABLE:
      return 'GPS is unavailable. Turn on Location Services and try again.';
    case GEO_TIMEOUT:
      return 'Location request timed out. Move to an open area or try again.';
    default:
      return 'Could not get your current location. Please try again.';
  }
}

export function handleGeoError(error: GeoError, context = 'GPS'): void {
  logGeoError(error, context);

  if (error.code === GEO_PERMISSION_DENIED) {
    showLocationSettingsAlert();
    return;
  }

  if (error.code === GEO_POSITION_UNAVAILABLE) {
    showLocationServicesAlert();
    return;
  }

  Alert.alert('Location error', getGeoErrorMessage(error));
}

export async function ensureLocationReady(): Promise<boolean> {
  const permission = await requestLocationPermission();

  if (permission === 'blocked') {
    showLocationSettingsAlert();
    return false;
  }

  if (permission === 'denied') {
    Alert.alert(
      'Permission needed',
      'Location access is required to use live location. You can still enter your address manually.',
    );
    return false;
  }

  return true;
}

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      resolve,
      error => reject(error),
      GEO_OPTIONS,
    );
  });
}

export async function getCurrentPositionWithHandling(context = 'GPS'): Promise<GeoPosition | null> {
  const ready = await ensureLocationReady();
  if (!ready) {
    return null;
  }

  try {
    return await getCurrentPosition();
  } catch (error) {
    handleGeoError(error as GeoError, context);
    return null;
  }
}
