import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
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
  /** Single-image mode (legacy). Ignored when `imageUris` is provided. */
  imageUri?: string;
  /** Multi-image mode. */
  imageUris?: string[];
  maxImages?: number;
  title?: string;
  subtitle?: string;
  onImageChange?: (url: string) => void;
  onImagesChange?: (urls: string[]) => void;
}

export function InventoryImageUploadSection({
  imageUri,
  imageUris,
  maxImages = 1,
  title = 'Upload clear images',
  subtitle = 'JPG, PNG up to 5MB',
  onImageChange,
  onImagesChange,
}: InventoryImageUploadSectionProps) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);
  const multi = Array.isArray(imageUris);
  const uris = multi ? imageUris : imageUri ? [imageUri] : [];
  const canAddMore = uris.length < maxImages;

  const handlePicked = useCallback(
    async (uri: string) => {
      setUploading(true);
      try {
        const uploadedUrl = await uploadImage(uri);
        if (multi && onImagesChange) {
          onImagesChange([...uris, uploadedUrl].slice(0, maxImages));
        } else {
          onImageChange?.(uploadedUrl);
        }
        successHaptic();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to upload photo. Please try again.';
        Alert.alert('Upload Failed', message);
      } finally {
        setUploading(false);
      }
    },
    [multi, onImageChange, onImagesChange, uris, maxImages],
  );

  const removeAt = (index: number) => {
    if (!multi || !onImagesChange) return;
    onImagesChange(uris.filter((_, i) => i !== index));
  };

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

      {multi && uris.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {uris.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
              <Pressable style={styles.removeBtn} onPress={() => removeAt(index)} hitSlop={6}>
                <Feather name="x" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.imageUploadArea}>
        <Pressable
          style={[
            styles.uploadDropZone,
            { borderColor: uris.length > 0 ? '#10B981' : '#D9D9D9' },
          ]}
          onPress={() => !uploading && canAddMore && openPicker()}
          disabled={uploading || !canAddMore}
        >
          {!multi && uris[0] ? (
            <Image source={{ uri: uris[0] }} style={styles.previewImage} resizeMode="cover" />
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
                {!canAddMore
                  ? `Maximum ${maxImages} images`
                  : multi
                    ? uris.length > 0
                      ? `Add another image (${uris.length}/${maxImages})`
                      : title
                    : uris[0]
                      ? 'Tap to change image'
                      : title}
              </Text>
              {canAddMore ? (
                <Pressable style={styles.galleryBtn} onPress={openPicker} disabled={uploading}>
                  <Feather name="image" size={13} color={colors.icon} style={{ marginRight: 5 }} />
                  <Text style={styles.galleryBtnText}>
                    {multi
                      ? uris.length > 0
                        ? 'Add Photo'
                        : 'Upload from Gallery'
                      : uris[0]
                        ? 'Change Photo'
                        : 'Upload from Gallery'}
                  </Text>
                </Pressable>
              ) : null}
              <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>{subtitle}</Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  thumbRow: { gap: 8, marginBottom: 10 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
