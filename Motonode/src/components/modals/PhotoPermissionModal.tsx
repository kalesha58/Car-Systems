import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import {
  getPhotoPermissionCopy,
  openAppSettings,
  type PhotoSource,
} from '@utils/photoPermissions';

interface PhotoPermissionModalProps {
  visible: boolean;
  source: PhotoSource;
  variant?: 'request' | 'denied';
  loading?: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function PhotoPermissionModal({
  visible,
  source,
  variant = 'request',
  loading = false,
  onAllow,
  onDeny,
}: PhotoPermissionModalProps) {
  const colors = useColors();
  const copy = getPhotoPermissionCopy(source);
  const isDenied = variant === 'denied';

  const title = isDenied ? copy.deniedTitle : copy.title;
  const message = isDenied ? copy.deniedMessage : copy.message;
  const iconName = isDenied ? 'alert-circle' : copy.icon;
  const iconColor = isDenied ? colors.warning : colors.primary;
  const iconBg = isDenied ? `${colors.warning}18` : colors.primarySubtle;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDeny}
    >
      <Pressable style={styles.backdrop} onPress={onDeny}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Feather name={iconName} size={30} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.privacyNote}>
            <Feather name="shield" size={14} color={colors.textTertiary} />
            <Text style={[styles.privacyText, { color: colors.textTertiary }]}>
              Your photos are only used for posts you create. We never access them without your
              action.
            </Text>
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  opacity: pressed || loading ? 0.8 : 1,
                },
              ]}
              onPress={onDeny}
              disabled={loading}
            >
              <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                {isDenied ? 'Close' : 'Not Now'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.85 : 1,
                },
              ]}
              onPress={isDenied ? openAppSettings : onAllow}
              disabled={loading}
            >
              {loading ? (
                <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
                  Please wait…
                </Text>
              ) : (
                <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
                  {isDenied ? 'Open Settings' : 'Allow Access'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
