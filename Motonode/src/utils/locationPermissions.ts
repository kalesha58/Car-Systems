import Geolocation from 'react-native-geolocation-service';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export type LocationPermissionResult = 'granted' | 'denied' | 'blocked';

export function showLocationSettingsAlert(): void {
  Alert.alert(
    'Location permission required',
    'Enable location permission for Motonode in app settings to use live location.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
}

export function showLocationServicesAlert(): void {
  Alert.alert(
    'Turn on Location',
    'Location Services appear to be disabled. Enable GPS/Location in your device settings and try again.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
}

export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  if (Platform.OS === 'android') {
    try {
      const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
      const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

      const fineGranted = await PermissionsAndroid.check(fine);
      if (fineGranted) {
        return 'granted';
      }

      const result = await PermissionsAndroid.requestMultiple([fine, coarse]);
      const fineResult = result[fine];
      const coarseResult = result[coarse];

      if (
        fineResult === PermissionsAndroid.RESULTS.GRANTED ||
        coarseResult === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return 'granted';
      }

      if (
        fineResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        coarseResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ) {
        return 'blocked';
      }

      return 'denied';
    } catch {
      return 'denied';
    }
  }

  try {
    const auth = await Geolocation.requestAuthorization('whenInUse');
    if (auth === 'granted') {
      return 'granted';
    }
    if (auth === 'disabled' || auth === 'restricted') {
      return 'blocked';
    }
    return 'denied';
  } catch {
    return 'denied';
  }
}

/** @deprecated Use requestLocationPermission which returns detailed status */
export async function hasLocationPermission(): Promise<boolean> {
  const result = await requestLocationPermission();
  return result === 'granted';
}
