import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

export type PhotoPickerOption = 'camera' | 'gallery';

interface PhotoPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: PhotoPickerOption) => void;
}

const OPTIONS: {
  id: PhotoPickerOption;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
}[] = [
  {
    id: 'camera',
    label: 'Camera',
    subtitle: 'Take a new photo',
    icon: 'camera',
    color: '#E60012',
  },
  {
    id: 'gallery',
    label: 'Gallery',
    subtitle: 'Choose from library',
    icon: 'image',
    color: '#1F2937',
  },
];

export function PhotoPickerSheet({ visible, onClose, onSelect }: PhotoPickerSheetProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Add Photo</Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            Photos only — video upload is not supported
          </Text>

          <View style={styles.options}>
            {OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => {
                  onSelect(option.id);
                  onClose();
                }}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}18` }]}>
                  <Feather name={option.icon} size={22} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.textTertiary }]}>
                    {option.subtitle}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { backgroundColor: colors.muted, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  options: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  optionSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
