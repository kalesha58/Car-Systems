import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { DealerOnboardingStatus } from '../../types/api';
import { getRegistrationStatusMessage } from '@utils/dealerRegistration';

interface RegistrationStatusBannerProps {
  status: DealerOnboardingStatus;
  onPress?: () => void;
}

export function RegistrationStatusBanner({ status, onPress }: RegistrationStatusBannerProps) {
  const colors = useColors();

  if (status === 'approved') return null;

  const isPending = status === 'pending';
  const bannerColor = isPending ? '#F59E0B' : '#EF4444';
  const icon = isPending ? 'clock' : 'alert-circle';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.banner, { backgroundColor: bannerColor + '18', borderLeftColor: bannerColor }]}
    >
      <Feather name={icon} size={20} color={bannerColor} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: bannerColor }]}>
          {isPending ? 'Registration pending approval' : 'Registration action required'}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {getRegistrationStatusMessage(status)}
        </Text>
      </View>
      {onPress ? <Feather name="chevron-right" size={18} color={bannerColor} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  content: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  message: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
