import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (uri: string) => void;
  onSelectDocument: (uri: string, name: string) => void;
  onSelectLocation: (latitude: number, longitude: number, address: string) => void;
}

export function AttachmentSheet({
  visible,
  onClose,
  onSelectImage,
  onSelectDocument,
  onSelectLocation,
}: AttachmentSheetProps) {
  const colors = useColors();

  const handleCamera = async () => {
    onClose();
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (result.assets && result.assets[0]?.uri) {
      onSelectImage(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    onClose();
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (result.assets && result.assets[0]?.uri) {
      onSelectImage(result.assets[0].uri);
    }
  };

  const handleDocument = async () => {
    onClose();
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      if (res && res[0]?.uri) {
        onSelectDocument(res[0].uri, res[0].name || 'Document.pdf');
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Document picking error:', err);
      }
    }
  };

  const handleLocation = () => {
    onClose();
    // Simulate current user location (e.g. Motonode HQ in Bangalore, India)
    const bangaloreLat = 12.9716;
    const bangaloreLng = 77.5946;
    onSelectLocation(bangaloreLat, bangaloreLng, 'Motonode Hub, MG Road, Bangalore');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={[styles.dragBar, { backgroundColor: colors.border }]} />
          
          <Text style={[styles.title, { color: colors.textPrimary }]}>Send Attachment</Text>

          <View style={styles.grid}>
            {/* Camera */}
            <Pressable style={styles.option} onPress={handleCamera}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}12` }]}>
                <Feather name="camera" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Camera</Text>
            </Pressable>

            {/* Gallery */}
            <Pressable style={styles.option} onPress={handleGallery}>
              <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                <Feather name="image" size={24} color="#0284c7" />
              </View>
              <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Gallery</Text>
            </Pressable>

            {/* Document */}
            <Pressable style={styles.option} onPress={handleDocument}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Feather name="file-text" size={24} color="#d97706" />
              </View>
              <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Document</Text>
            </Pressable>

            {/* Location */}
            <Pressable style={styles.option} onPress={handleLocation}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <Feather name="map-pin" size={24} color="#16a34a" />
              </View>
              <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Location</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  option: {
    alignItems: 'center',
    width: 70,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
