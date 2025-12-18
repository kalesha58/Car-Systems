import React, { FC, useMemo, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';

import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import CustomText from '@components/ui/CustomText';
import CustomInput from '@components/ui/CustomInput';
import CustomButton from '@components/ui/CustomButton';
import ThemedModal from '@components/ui/ThemedModal';
import { Fonts } from '@utils/Constants';
import { goBack, resetAndNavigate } from '@utils/NavigationUtils';
import { requestPasswordReset, resetPasswordWithCode } from '@service/authService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ForgotPasswordParams = {
  returnTo?: 'CustomerLogin' | 'DeliveryLogin';
  prefillEmail?: string;
};

type Step = 'email' | 'reset';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const ForgotPassword: FC = () => {
  const route = useRoute();
  const params = (route.params || {}) as ForgotPasswordParams;
  const insets = useSafeAreaInsets();

  const returnTo = params.returnTo || 'CustomerLogin';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(params.prefillEmail || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalVariant, setModalVariant] = useState<'success' | 'error'>('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onModalClose, setOnModalClose] = useState<(() => void) | undefined>(undefined);

  const canSendCode = useMemo(() => {
    const trimmed = email.trim();
    return trimmed.length > 0 && isValidEmail(trimmed);
  }, [email]);

  const canReset = useMemo(() => {
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    const passOk = password.length >= 8;
    const confirmOk = confirmPassword.length >= 8 && confirmPassword === password;
    return isValidEmail(trimmedEmail) && trimmedCode.length === 6 && passOk && confirmOk;
  }, [email, code, password, confirmPassword]);

  const extractErrorMessage = (error: any): string => {
    return (
      error?.response?.data?.Response?.ReturnMessage ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong. Please try again.'
    );
  };

  const openModal = (opts: {
    variant: 'success' | 'error';
    title: string;
    message: string;
    onClose?: () => void;
  }) => {
    setModalVariant(opts.variant);
    setModalTitle(opts.title);
    setModalMessage(opts.message);
    setOnModalClose(() => opts.onClose);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    if (onModalClose) {
      onModalClose();
    }
    setOnModalClose(undefined);
  };

  const handleSendCode = async () => {
    Keyboard.dismiss();
    if (!canSendCode) {
      openModal({
        variant: 'error',
        title: 'Invalid email',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      openModal({
        variant: 'success',
        title: 'Code sent',
        message: res?.message || 'If an account with that email exists, a reset code has been sent.',
        onClose: () => setStep('reset'),
      });
    } catch (error: any) {
      openModal({
        variant: 'error',
        title: 'Request failed',
        message: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (password !== confirmPassword) {
      openModal({
        variant: 'error',
        title: 'Passwords do not match',
        message: 'Please make sure both password fields match.',
      });
      return;
    }

    if (password.length < 8) {
      openModal({
        variant: 'error',
        title: 'Weak password',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    if (code.trim().length !== 6) {
      openModal({
        variant: 'error',
        title: 'Invalid code',
        message: 'Please enter the 6-digit code sent to your email.',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordWithCode({
        email,
        code,
        password,
        confirmPassword,
      });

      openModal({
        variant: 'success',
        title: 'Password updated',
        message: res?.message || 'Password has been reset successfully.',
        onClose: () => resetAndNavigate(returnTo),
      });
    } catch (error: any) {
      openModal({
        variant: 'error',
        title: 'Reset failed',
        message: extractErrorMessage(error),
      });
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
        variant={modalVariant}
        primaryText="OK"
        onClose={handleCloseModal}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={[styles.headerRow, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => (step === 'email' ? goBack() : setStep('email'))} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={RFValue(18)} color="#111" />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <CustomText variant="h3" fontFamily={Fonts.Bold} style={styles.title}>
                Forgot Password
              </CustomText>
              <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.subTitle}>
                {step === 'email'
                  ? 'Enter your email to receive a reset code.'
                  : 'Enter the code and choose a new password.'}
              </CustomText>
            </View>
          </View>

          <View style={styles.formContent}>
          {step === 'email' ? (
            <>
              <CustomInput
                onChangeText={setEmail}
                onClear={() => setEmail('')}
                value={email}
                placeholder="Email"
                inputMode="email"
                left={
                  <Ionicons
                    name="mail"
                    color="#F8890E"
                    style={{ marginLeft: 10 }}
                    size={RFValue(18)}
                  />
                }
                right={false}
              />

              <CustomButton
                disabled={!canSendCode}
                title="Send code"
                onPress={handleSendCode}
                loading={loading}
              />
            </>
          ) : (
            <>
              <CustomInput
                onChangeText={setEmail}
                onClear={() => setEmail('')}
                value={email}
                placeholder="Email"
                inputMode="email"
                left={
                  <Ionicons
                    name="mail"
                    color="#F8890E"
                    style={{ marginLeft: 10 }}
                    size={RFValue(18)}
                  />
                }
                right={false}
              />

              <CustomInput
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ''))}
                onClear={() => setCode('')}
                value={code}
                placeholder="6-digit code"
                keyboardType="numeric"
                maxLength={6}
                left={
                  <Ionicons
                    name="keypad"
                    color="#F8890E"
                    style={{ marginLeft: 10 }}
                    size={RFValue(18)}
                  />
                }
                right={false}
              />

              <CustomInput
                onChangeText={setPassword}
                onClear={() => setPassword('')}
                value={password}
                placeholder="New password"
                secureTextEntry={!showPassword}
                left={
                  <Ionicons
                    name="lock-closed"
                    color="#F8890E"
                    style={{ marginLeft: 10 }}
                    size={RFValue(18)}
                  />
                }
                right={false}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      color="#F8890E"
                      size={RFValue(18)}
                    />
                  </TouchableOpacity>
                }
              />

              <CustomInput
                onChangeText={setConfirmPassword}
                onClear={() => setConfirmPassword('')}
                value={confirmPassword}
                placeholder="Confirm password"
                secureTextEntry={!showConfirmPassword}
                left={
                  <Ionicons
                    name="lock-closed"
                    color="#F8890E"
                    style={{ marginLeft: 10 }}
                    size={RFValue(18)}
                  />
                }
                right={false}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      color="#F8890E"
                      size={RFValue(18)}
                    />
                  </TouchableOpacity>
                }
              />

              <CustomButton
                disabled={!canReset}
                title="Reset password"
                onPress={handleResetPassword}
                loading={loading}
              />

              <TouchableOpacity onPress={handleSendCode} style={styles.resendBtn} disabled={loading || !canSendCode}>
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.Medium}
                  style={{ color: '#F8890E', opacity: loading || !canSendCode ? 0.6 : 1 }}>
                  Resend code
                </CustomText>
              </TouchableOpacity>
            </>
          )}
          </View>
        </View>
      </ScrollView>
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 8,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subTitle: {
    marginTop: 2,
    opacity: 0.8,
    textAlign: 'center',
  },
  formContent: {
    paddingTop: 6,
  },
  resendBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 8,
  },
});

export default ForgotPassword;
