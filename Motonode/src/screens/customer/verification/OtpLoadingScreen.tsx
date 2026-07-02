import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { verifyOtp } from '@services/otp.service';
import { mapServerUserToAuthUser } from '@utils/mapAuthUser';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.OtpLoading
>;

export function OtpLoadingScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateUser, markMobileVerified } = useAuth();
  const { showToast } = useToast();
  const pulse = useRef(new Animated.Value(0.6)).current;

  const { phone, otp } = route.params;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    let mounted = true;

    async function verify() {
      try {
        const result = await verifyOtp(phone, otp);

        if (!mounted) {
          return;
        }

        if (result.isNewUser) {
          showToast('Phone verified. Please complete signup.', 'info');
          navigation.goBack();
          return;
        }

        if (result.user) {
          const authUser = mapServerUserToAuthUser(result.user);
          await updateUser(authUser);
        } else {
          await markMobileVerified();
        }

        navigation.replace(CustomerStackRoutes.OtpSuccess);
      } catch (err) {
        if (!mounted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Verification failed';
        showToast(message, 'error');
        navigation.goBack();
      }
    }

    void verify();

    return () => {
      mounted = false;
    };
  }, [phone, otp, navigation, updateUser, markMobileVerified, showToast]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <Animated.View style={[styles.iconWrap, { opacity: pulse, transform: [{ scale: pulse }] }]}>
        <Feather name="shield" size={56} color="#E60012" />
      </Animated.View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Verifying OTP</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Please wait while we verify your OTP.
      </Text>
      <View style={styles.progressRow}>
        <View style={[styles.progressDot, styles.progressActive]} />
        <View style={[styles.progressLine, { backgroundColor: colors.border }]} />
        <View style={[styles.progressDot, { backgroundColor: colors.border }]} />
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressLabel, { color: '#E60012' }]}>Verifying</Text>
        <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>Completed</Text>
      </View>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6001218',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressActive: {
    backgroundColor: '#E60012',
  },
  progressLine: {
    width: 80,
    height: 2,
    marginHorizontal: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 180,
  },
  progressLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
