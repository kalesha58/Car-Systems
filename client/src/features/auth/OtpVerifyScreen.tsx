import React, { FC, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';

import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import CustomText from '@components/ui/CustomText';
import CustomButton from '@components/ui/CustomButton';
import CustomHeader from '@components/ui/CustomHeader';
import ThemedModal from '@components/ui/ThemedModal';
import OtpInput from '@components/auth/OtpInput';
import { Fonts } from '@utils/Constants';
import { goBack, navigate, replace } from '@utils/NavigationUtils';
import {
  customerSignup,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '@service/authService';
import { extractAuthErrorMessage, navigateAfterCustomerAuth } from '../../auth/postLoginNavigation';
import {
  clearPendingSignupDraft,
  getPendingSignupDraft,
} from '@utils/signupDraftStorage';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import {
  OTP_EXPIRY_SECONDS,
  OTP_LENGTH,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@config/otpAuthConfig';

type OtpVerifyParams = {
  phone: string;
  flow?: 'login' | 'signup';
  resendAfterSeconds?: number;
  otpExpiresInSeconds?: number;
  otpLength?: number;
};

const formatTimer = (totalSeconds: number): string => {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatPhoneForSubtitle = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return digits;
};

const OtpVerifyScreen: FC = () => {
  const route = useRoute();
  const params = (route.params || {}) as OtpVerifyParams;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showSuccess } = useToast();

  const phone = params.phone || '';
  const flow = params.flow ?? 'login';
  const otpLength = params.otpLength ?? OTP_LENGTH;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(
    params.resendAfterSeconds ?? OTP_RESEND_COOLDOWN_SECONDS,
  );
  const [expirySeconds, setExpirySeconds] = useState(
    params.otpExpiresInSeconds ?? OTP_EXPIRY_SECONDS,
  );
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const locked = failedAttempts >= OTP_MAX_VERIFY_ATTEMPTS;
  const codeExpired = expirySeconds <= 0;
  const canVerify = otp.length === otpLength && !locked && !codeExpired;

  const headerTitle =
    flow === 'signup' ? t('auth.signupVerifyPhone') : t('auth.phoneOtp.verifyOtp');

  const attemptsRemaining = OTP_MAX_VERIFY_ATTEMPTS - failedAttempts;

  useEffect(() => {
    if (resendSeconds <= 0 && expirySeconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
      setExpirySeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds, expirySeconds]);

  const applyOtpMeta = (result: {
    resendAfterSeconds?: number;
    otpExpiresInSeconds?: number;
    otpLength?: number;
  }) => {
    setResendSeconds(result.resendAfterSeconds ?? OTP_RESEND_COOLDOWN_SECONDS);
    setExpirySeconds(result.otpExpiresInSeconds ?? OTP_EXPIRY_SECONDS);
  };

  const showError = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleVerify = async () => {
    Keyboard.dismiss();
    if (!canVerify) {
      return;
    }

    setLoading(true);
    try {
      const result = await verifyPhoneOtp(phone, otp);

      if (flow === 'signup') {
        if (!result.isNewUser) {
          showError(
            t('auth.phoneOtp.verifyFailedTitle'),
            t('auth.phoneAlreadyRegistered'),
          );
          return;
        }

        const draft = getPendingSignupDraft();
        if (!draft || draft.phone !== phone) {
          showError(
            t('auth.phoneOtp.verifyFailedTitle'),
            t('auth.phoneOtp.sessionExpired'),
          );
          return;
        }

        await customerSignup(
          draft.name,
          draft.email,
          draft.phone,
          draft.password,
          draft.userType,
          draft.termsVersion,
          draft.privacyVersion,
        );
        clearPendingSignupDraft();
        showSuccess(t('auth.signupSuccessLogin'));
        await replace('CustomerLogin', { prefillLoginIdentifier: draft.email });
        return;
      }

      if (result.isNewUser && result.registrationToken) {
        navigate('PhoneSignup', {
          phone,
          registrationToken: result.registrationToken,
        });
        return;
      }

      showSuccess(t('auth.loginSuccess'));
      await navigateAfterCustomerAuth(result.loginResult);
    } catch (error) {
      setFailedAttempts((n) => n + 1);
      showError(
        t('auth.phoneOtp.verifyFailedTitle'),
        extractAuthErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || loading || locked) {
      return;
    }
    setLoading(true);
    try {
      const result = await sendPhoneOtp(phone);
      applyOtpMeta(result);
      setFailedAttempts(0);
      setOtp('');
      showSuccess(t('auth.phoneOtp.otpResent'));
    } catch (error) {
      showError(t('auth.phoneOtp.sendFailedTitle'), extractAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const expiryLabel = useMemo(() => {
    if (codeExpired) {
      return t('auth.phoneOtp.codeExpired');
    }
    return t('auth.phoneOtp.expiresIn', { time: formatTimer(expirySeconds) });
  }, [codeExpired, expirySeconds, t]);

  return (
    <CustomSafeAreaView>
      <ThemedModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        variant="error"
        primaryText="OK"
        onClose={() => setModalVisible(false)}
      />

      <CustomHeader
        title={headerTitle}
        showNotificationIcon={false}
        onBackPress={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={RFValue(32)}
              color={colors.primary}
            />
          </View>
          <CustomText variant="h4" fontFamily={Fonts.SemiBold} style={styles.heroTitle}>
            {t('auth.phoneOtp.enterCodeTitle', { count: otpLength })}
          </CustomText>
          <CustomText variant="h8" style={{ color: colors.textSecondary, textAlign: 'center' }}>
            {t('auth.phoneOtp.codeSentTo', { phone: formatPhoneForSubtitle(phone) })}
          </CustomText>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <CustomText variant="h8" style={{ color: colors.primary, marginTop: 4 }}>
              {t('auth.phoneOtp.changeNumber')}
            </CustomText>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.otpCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                },
                android: { elevation: 2 },
              }),
            },
          ]}>
          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={locked || loading}
            length={otpLength}
          />
        </View>

        <View style={styles.timerBlock}>
          <View style={styles.timerRow}>
            <Ionicons
              name="time-outline"
              size={RFValue(16)}
              color={codeExpired ? colors.error : colors.textSecondary}
            />
            <CustomText
              variant="h8"
              style={{ color: codeExpired ? colors.error : colors.textSecondary }}>
              {expiryLabel}
            </CustomText>
          </View>

          {failedAttempts > 0 && !locked ? (
            <CustomText variant="h8" style={{ color: colors.warning, textAlign: 'center' }}>
              {t('auth.phoneOtp.attemptsRemaining', { count: attemptsRemaining })}
            </CustomText>
          ) : null}

          {locked ? (
            <CustomText variant="h8" style={{ color: colors.error, textAlign: 'center' }}>
              {t('auth.phoneOtp.tooManyAttempts')}
            </CustomText>
          ) : null}
        </View>

        <CustomButton
          title={t('auth.phoneOtp.verifyAndContinue')}
          onPress={handleVerify}
          loading={loading}
          disabled={!canVerify}
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={resendSeconds > 0 || loading || locked}
          style={styles.resendRow}>
          <CustomText
            variant="h8"
            style={{
              color:
                resendSeconds > 0 || locked ? colors.textSecondary : colors.primary,
              fontFamily: Fonts.SemiBold,
            }}>
            {resendSeconds > 0
              ? t('auth.phoneOtp.resendIn', { time: formatTimer(resendSeconds) })
              : t('auth.phoneOtp.resendOtp')}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: RFValue(64),
    height: RFValue(64),
    borderRadius: RFValue(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    textAlign: 'center',
  },
  otpCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  timerBlock: {
    gap: 8,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: -4,
  },
});

export default OtpVerifyScreen;
