import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { PrimaryButton, SecondaryButton } from '@components/buttons';
import { useColors } from '@hooks/useColors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

interface MobileVerificationSheetProps {
  visible: boolean;
  onVerifyNow: () => void;
  onLater: () => void;
  onClose: () => void;
}

export function MobileVerificationSheet({
  visible,
  onVerifyNow,
  onLater,
  onClose,
}: MobileVerificationSheetProps) {
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
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={[styles.iconWrap, { backgroundColor: '#E6001218' }]}>
            <Feather name="smartphone" size={28} color="#E60012" />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Verify Your Mobile Number
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Verify your mobile number to enjoy a more secure experience, receive booking updates,
            order notifications, and account recovery support.
          </Text>

          <View style={styles.actions}>
            <PrimaryButton label="Verify Now" onPress={onVerifyNow} style={styles.primaryBtn} />
            <SecondaryButton label="Later" onPress={onLater} style={styles.secondaryBtn} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 8,
    paddingTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
});
