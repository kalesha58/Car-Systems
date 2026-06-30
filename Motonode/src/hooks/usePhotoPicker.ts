import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';

import type { PhotoPickerOption } from '@components/modals';
import { getString, setString } from '@storage/index';
import { StorageKeys } from '@storage/keys';
import {
  hasPhotoPermission,
  requestPhotoPermission,
  type PhotoSource,
} from '@utils/photoPermissions';
import { lightHaptic } from '@utils/haptics';

interface UsePhotoPickerOptions {
  selectionLimit?: number;
  onPicked: (uri: string) => void | Promise<void>;
}

export function usePhotoPicker({ selectionLimit = 1, onPicked }: UsePhotoPickerOptions) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [permissionVisible, setPermissionVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [pendingSource, setPendingSource] = useState<PhotoSource | null>(null);

  const openPicker = useCallback(() => {
    lightHaptic();
    setPickerVisible(true);
  }, []);

  const openNativePicker = useCallback(
    (source: PhotoSource) => {
      const options = {
        mediaType: 'photo' as const,
        selectionLimit,
        quality: 0.8 as const,
        maxWidth: 1600,
        maxHeight: 1600,
        includeBase64: false,
      };

      const handleResponse = (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          if (response.errorCode === 'permission') {
            setPendingSource(null);
            setPermissionDenied(true);
            setPermissionVisible(true);
          }
          return;
        }

        const pickedUri = response.assets?.[0]?.uri;
        if (!pickedUri) return;

        void Promise.resolve(onPicked(pickedUri)).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to process photo.';
          Alert.alert('Upload Failed', message);
        });
      };

      if (source === 'camera') {
        launchCamera(options, handleResponse);
      } else {
        launchImageLibrary(options, handleResponse);
      }
    },
    [onPicked, selectionLimit],
  );

  const beginPhotoPick = useCallback(
    async (source: PhotoSource) => {
      setPendingSource(source);

      const rationaleAccepted = await getString(StorageKeys.PHOTO_PERMISSION_RATIONALE);
      const systemGranted = await hasPhotoPermission(source);

      if (rationaleAccepted === 'true' && systemGranted) {
        openNativePicker(source);
        setPendingSource(null);
        return;
      }

      setPermissionDenied(false);
      setPermissionVisible(true);
    },
    [openNativePicker],
  );

  const handlePhotoPickerSelect = useCallback(
    (option: PhotoPickerOption) => {
      lightHaptic();
      void beginPhotoPick(option);
    },
    [beginPhotoPick],
  );

  const handlePermissionAllow = useCallback(async () => {
    if (!pendingSource) return;

    setPermissionLoading(true);
    try {
      await setString(StorageKeys.PHOTO_PERMISSION_RATIONALE, 'true');
      const granted = await requestPhotoPermission(pendingSource);

      if (granted) {
        setPermissionVisible(false);
        const source = pendingSource;
        setPendingSource(null);
        setPermissionDenied(false);
        openNativePicker(source);
        return;
      }

      setPermissionDenied(true);
    } finally {
      setPermissionLoading(false);
    }
  }, [openNativePicker, pendingSource]);

  const handlePermissionDeny = useCallback(() => {
    setPermissionVisible(false);
    setPermissionDenied(false);
    setPendingSource(null);
  }, []);

  return {
    pickerVisible,
    setPickerVisible,
    permissionVisible: permissionVisible && pendingSource !== null,
    permissionDenied,
    permissionLoading,
    pendingSource,
    openPicker,
    handlePhotoPickerSelect,
    handlePermissionAllow,
    handlePermissionDeny,
  };
}
