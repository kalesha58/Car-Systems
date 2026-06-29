import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

interface DocumentUploadCardProps {
  title: string;
  required?: boolean;
  icon: string;
  iconColor: string;
  uri?: string | null;
  onPress: () => void;
  onRemove?: () => void;
}

export function DocumentUploadCard({
  title,
  required = false,
  icon,
  iconColor,
  uri,
  onPress,
  onRemove,
}: DocumentUploadCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
          <Feather name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
          {required ? <Text style={{ color: colors.destructive }}> *</Text> : null}
        </Text>
      </View>

      {uri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
            <Feather name="check" size={10} color="#fff" />
          </View>
          {onRemove ? (
            <Pressable style={styles.removeBtn} onPress={onRemove} hitSlop={6}>
              <Feather name="x" size={12} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          style={[styles.uploadZone, { borderColor: colors.border, backgroundColor: colors.muted }]}
          onPress={onPress}
        >
          <Feather name="upload-cloud" size={22} color={colors.icon} />
          <Text style={[styles.uploadTitle, { color: colors.textSecondary }]}>Upload Document</Text>
          <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>
            JPG, PNG or PDF (Max. 5MB)
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  uploadTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  uploadHint: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  previewWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 100,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
