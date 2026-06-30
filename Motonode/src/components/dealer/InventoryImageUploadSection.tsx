import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { PhotoPermissionModal, PhotoPickerSheet } from '@components/modals';
import { useColors } from '@hooks/useColors';
import { usePhotoPicker } from '@hooks/usePhotoPicker';
import { uploadImage } from '@services/upload.service';
import { themeLight } from '@theme/colors';
import { successHaptic } from '@utils/haptics';

interface InventoryImageUploadSectionProps {
  imageUri?: string;
  title?: string;
  subtitle?: string;
  onImageChange: (url: string) => void;
}

export function InventoryImageUploadSection({
  imageUri,
  title = 'Upload clear images',
  subtitle = 'JPG, PNG up to 5MB',
  onImageChange,
}: InventoryImageUploadSectionProps) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);

  const handlePicked = useCallback(
    async (uri: string) => {
      setUploading(true);
      try {
        const uploadedUrl = await uploadImage(uri);
        onImageChange(uploadedUrl);
        successHaptic();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to upload photo. Please try again.';
        Alert.alert('Upload Failed', message);
      } finally {
        setUploading(false);
      }
    },
    [onImageChange],
  );

  const {
    pickerVisible,
    setPickerVisible,
    permissionVisible,
    permissionDenied,
    permissionLoading,
    pendingSource,
    openPicker,
    handlePhotoPickerSelect,
    handlePermissionAllow,
    handlePermissionDeny,
  } = usePhotoPicker({ onPicked: handlePicked });

  return (
    <>
      <PhotoPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handlePhotoPickerSelect}
      />

      <PhotoPermissionModal
        visible={permissionVisible}
        source={pendingSource ?? 'gallery'}
        variant={permissionDenied ? 'denied' : 'request'}
        loading={permissionLoading}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />

      <View style={styles.imageUploadArea}>
        <Pressable
          style={[styles.uploadDropZone, { borderColor: imageUri ? '#10B981' : '#D9D9D9' }]}
          onPress={() => !uploading && openPicker()}
          disabled={uploading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={[styles.uploadIcon, { backgroundColor: '#F2F2F2' }]}>
              <Feather name="upload-cloud" size={22} color={colors.icon} />
            </View>
          )}

          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#E60012" />
              <Text style={styles.uploadingText}>Uploading…</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                {imageUri ? 'Tap to change image' : title}
              </Text>
              {!imageUri ? (
                <Text style={[styles.uploadOr, { color: colors.textTertiary }]}>or</Text>
              ) : null}
              <Pressable style={styles.galleryBtn} onPress={openPicker} disabled={uploading}>
                <Feather name="image" size={13} color={colors.icon} style={{ marginRight: 5 }} />
                <Text style={styles.galleryBtnText}>
                  {imageUri ? 'Change Photo' : 'Upload from Gallery'}
                </Text>
              </Pressable>
              <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>{subtitle}</Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  imageUploadArea: { gap: 10 },
  uploadDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FBFF',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 4,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  uploadOr: { fontSize: 10 },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E60012',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  galleryBtnText: { color: themeLight.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold' },
  uploadHint: { fontSize: 9, marginTop: 4, textAlign: 'center' },
  uploadingOverlay: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  uploadingText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: themeLight.textSecondary,
  },
});
