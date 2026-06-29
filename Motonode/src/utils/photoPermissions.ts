import { Linking, PermissionsAndroid, Platform } from 'react-native';

export type PhotoSource = 'camera' | 'gallery';

const ANDROID_API_TIRAMISU = 33;

function androidApiLevel(): number {
  return typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version);
}

export function getPhotoPermissionCopy(source: PhotoSource) {
  if (source === 'camera') {
    return {
      title: 'Allow Camera Access',
      message:
        'Motonode needs camera access so you can take photos and share them in your community posts. We only use the camera when you choose to take a photo.',
      icon: 'camera' as const,
      deniedTitle: 'Camera Access Denied',
      deniedMessage:
        'Camera permission is turned off. Enable it in your device settings to take photos for community posts.',
    };
  }

  return {
    title: 'Allow Photo Access',
    message:
      'Motonode needs access to your photos so you can select images for community posts. We only access photos you choose — nothing else from your library.',
    icon: 'image' as const,
    deniedTitle: 'Photo Access Denied',
    deniedMessage:
      'Photo library permission is turned off. Enable it in your device settings to add images to your posts.',
  };
}

export async function hasPhotoPermission(source: PhotoSource): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (source === 'camera') {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  }

  if (androidApiLevel() >= ANDROID_API_TIRAMISU) {
    return true;
  }

  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
}

export async function requestPhotoPermission(source: PhotoSource): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (source === 'camera') {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (alreadyGranted) {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'Motonode needs access to your camera to take photos for community posts.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (androidApiLevel() >= ANDROID_API_TIRAMISU) {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  );
  if (alreadyGranted) {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    {
      title: 'Storage Permission',
      message: 'Motonode needs access to your storage to select photos for community posts.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function openAppSettings(): void {
  void Linking.openSettings();
}
