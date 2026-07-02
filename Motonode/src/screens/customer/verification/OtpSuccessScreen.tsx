import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { PrimaryButton } from '@components/buttons';
import { CustomerStackRoutes } from '@constants/routes';
import { useMobileVerificationGate } from '@context/MobileVerificationContext';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { successHaptic } from '@utils/haptics';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.OtpSuccess
>;

export function OtpSuccessScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeMobileVerification } = useMobileVerificationGate();
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    successHaptic();
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handleContinue = async () => {
    await completeMobileVerification();
    navigation.reset({
      index: 0,
      routes: [{ name: CustomerStackRoutes.CustomerTabs }],
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        <Feather name="check-circle" size={80} color="#28A745" />
      </Animated.View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Mobile Number Verified</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your mobile number has been verified successfully.
      </Text>

      <PrimaryButton label="Continue" onPress={handleContinue} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
  },
});
