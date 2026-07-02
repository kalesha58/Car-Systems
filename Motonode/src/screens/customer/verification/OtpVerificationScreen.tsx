import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { PrimaryButton } from '@components/buttons';
import { ChromeHeader } from '@components/common';
import { OtpInput } from '@components/verification';
import {
  OTP_EXPIRY_SECONDS,
  OTP_LENGTH,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@config/otpConfig';
import { CustomerStackRoutes } from '@constants/routes';
import { useAuth } from '@context/AuthContext';
import { useMobileVerificationGate } from '@context/MobileVerificationContext';
import { useToast } from '@context/ToastContext';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { resendOtp, sendOtp } from '@services/otp.service';
import { lightHaptic } from '@utils/haptics';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.OtpVerification
>;

function formatPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function OtpVerificationScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cancelMobileVerification } = useMobileVerificationGate();
  const { showToast } = useToast();

  const phone = route.params?.phone || user?.phone || '';
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
  const [otpMeta, setOtpMeta] = useState({
    resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    otpExpiresInSeconds: OTP_EXPIRY_SECONDS,
    otpLength: OTP_LENGTH,
  });

  const locked = failedAttempts >= OTP_MAX_VERIFY_ATTEMPTS;
  const codeExpired = expirySeconds <= 0;
  const canVerify = otp.length === otpMeta.otpLength && !locked && !codeExpired;

  useEffect(() => {
    if (resendSeconds <= 0 && expirySeconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendSeconds(s => (s > 0 ? s - 1 : 0));
      setExpirySeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds, expirySeconds]);

  const requestOtp = useCallback(async () => {
    if (!phone) {
      showToast('No phone number on file', 'error');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await sendOtp(phone);
      setOtpMeta({
        resendAfterSeconds: result.resendAfterSeconds,
        otpExpiresInSeconds: result.otpExpiresInSeconds,
        otpLength: result.otpLength,
      });
      setResendSeconds(result.resendAfterSeconds);
      setExpirySeconds(result.otpExpiresInSeconds);
      showToast('OTP sent successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  }, [phone, showToast]);

  useEffect(() => {
    void requestOtp();
  }, [requestOtp]);

  const handleVerify = useCallback(async () => {
    if (!canVerify) {
      return;
    }

    lightHaptic();
    navigation.navigate(CustomerStackRoutes.OtpLoading, { phone, otp });
  }, [canVerify, navigation, phone, otp]);

  useEffect(() => {
    if (otp.length === otpMeta.otpLength && canVerify) {
      void handleVerify();
    }
  }, [otp, otpMeta.otpLength, canVerify, handleVerify]);

  const handleResend = async () => {
    if (resendSeconds > 0 || sending) {
      return;
    }
    lightHaptic();
    setSending(true);
    setError(null);
    setOtp('');
    setFailedAttempts(0);
    try {
      const result = await resendOtp(phone);
      setResendSeconds(result.resendAfterSeconds);
      setExpirySeconds(result.otpExpiresInSeconds);
      showToast('OTP resent', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    cancelMobileVerification();
    navigation.goBack();
  };

  if (codeExpired && !locked) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader>
          <View style={styles.headerRow}>
            <Pressable onPress={handleBack} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>OTP Expired</Text>
            <View style={{ width: 22 }} />
          </View>
        </ChromeHeader>
        <View style={styles.expiredWrap}>
          <View style={[styles.illustration, { backgroundColor: '#E6001218' }]}>
            <Feather name="clock" size={48} color="#E60012" />
          </View>
          <Text style={[styles.expiredTitle, { color: colors.textPrimary }]}>OTP Expired</Text>
          <Text style={[styles.expiredSubtitle, { color: colors.textSecondary }]}>
            This OTP has expired. Please request a new OTP.
          </Text>
          <PrimaryButton label="Resend OTP" onPress={handleResend} style={styles.fullBtn} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Verify Mobile</Text>
          <View style={{ width: 22 }} />
        </View>
      </ChromeHeader>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.illustration, { backgroundColor: '#E6001218' }]}>
            <Feather name="smartphone" size={48} color="#E60012" />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Enter OTP</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We have sent a 6-digit OTP to {formatPhone(phone)}
          </Text>

          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={locked || sending}
            hasError={Boolean(error)}
            length={otpMeta.otpLength}
          />

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          {locked ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              Too many invalid attempts. Please request a new OTP.
            </Text>
          ) : null}

          <Pressable
            onPress={handleResend}
            disabled={resendSeconds > 0 || sending}
            style={styles.resendRow}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#E60012" />
            ) : (
              <Text
                style={[
                  styles.resendText,
                  {
                    color: resendSeconds > 0 ? colors.textTertiary : '#E60012',
                  },
                ]}
              >
                Resend OTP{resendSeconds > 0 ? ` (${formatTimer(resendSeconds)})` : ''}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={handleBack} style={styles.editRow}>
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
            <Text style={[styles.editText, { color: colors.textSecondary }]}>
              Edit mobile number in profile
            </Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton
            label="Verify OTP"
            onPress={handleVerify}
            disabled={!canVerify}
            style={styles.fullBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  editText: {
    fontSize: typography.fontSize.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  fullBtn: {
    width: '100%',
  },
  expiredWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  expiredTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  expiredSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
});
