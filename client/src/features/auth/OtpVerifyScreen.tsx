import React, { FC, useEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';

import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import CustomText from '@components/ui/CustomText';
import CustomButton from '@components/ui/CustomButton';
import ThemedModal from '@components/ui/ThemedModal';
import OtpInput from '@components/auth/OtpInput';
import { Fonts, headerTopInset } from '@utils/Constants';
import { goBack, navigate } from '@utils/NavigationUtils';
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
import { replace } from '@utils/NavigationUtils';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OtpVerifyParams = {
  phone: string;
  flow?: 'login' | 'signup';
  resendAfterSeconds?: number;
};

const MAX_ATTEMPTS = 5;

const OtpVerifyScreen: FC = () => {
  const route = useRoute();
  const params = (route.params || {}) as OtpVerifyParams;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showSuccess } = useToast();
  const insets = useSafeAreaInsets();

  const phone = params.phone || '';
  const flow = params.flow ?? 'login';
  const initialCooldown = params.resendAfterSeconds ?? 30;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(initialCooldown);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const locked = failedAttempts >= MAX_ATTEMPTS;
  const canVerify = otp.length === 6 && !locked;

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

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
    if (resendSeconds > 0 || locked) {
      return;
    }
    setLoading(true);
    try {
      const result = await sendPhoneOtp(phone);
      setResendSeconds(result.resendAfterSeconds || 30);
      setFailedAttempts(0);
      setOtp('');
      showSuccess(t('auth.phoneOtp.otpResent'));
    } catch (error) {
      showError(t('auth.phoneOtp.sendFailedTitle'), extractAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

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

      <View style={[styles.header, { paddingTop: headerTopInset(insets.top) }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={RFValue(22)} color={colors.text} />
        </TouchableOpacity>
        <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
          {flow === 'signup' ? t('auth.signupVerifyPhone') : t('auth.phoneOtp.verifyOtp')}
        </CustomText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <CustomText variant="h8" style={styles.subtitle}>
          {t('auth.phoneOtp.codeSentTo', { phone })}
        </CustomText>

        <OtpInput value={otp} onChange={setOtp} disabled={locked || loading} />

        {locked ? (
          <CustomText variant="h8" style={{ color: colors.secondary }}>
            {t('auth.phoneOtp.tooManyAttempts')}
          </CustomText>
        ) : null}

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
            style={{ color: resendSeconds > 0 || locked ? colors.textSecondary : colors.primary }}>
            {resendSeconds > 0
              ? t('auth.phoneOtp.resendIn', { seconds: resendSeconds })
              : t('auth.phoneOtp.resendOtp')}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerSpacer: {
    width: RFValue(22),
  },
  content: {
    padding: 20,
    gap: 20,
  },
  subtitle: {
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 4,
  },
});

export default OtpVerifyScreen;
