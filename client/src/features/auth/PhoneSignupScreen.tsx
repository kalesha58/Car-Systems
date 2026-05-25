import React, { FC, useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';

import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import CustomText from '@components/ui/CustomText';
import CustomInput from '@components/ui/CustomInput';
import CustomButton from '@components/ui/CustomButton';
import ThemedModal from '@components/ui/ThemedModal';
import { Fonts, headerTopInset } from '@utils/Constants';
import { goBack, navigate } from '@utils/NavigationUtils';
import { completePhoneSignup } from '@service/authService';
import { extractAuthErrorMessage, navigateAfterCustomerAuth } from '../../auth/postLoginNavigation';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PhoneSignupParams = {
  phone: string;
  registrationToken: string;
};

const isValidEmail = (email: string): boolean => {
  if (!email.trim()) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const PhoneSignupScreen: FC = () => {
  const route = useRoute();
  const params = (route.params || {}) as PhoneSignupParams;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showSuccess } = useToast();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && isValidEmail(email) && acceptedPolicies;
  }, [name, email, acceptedPolicies]);

  const showError = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!params.registrationToken || !params.phone) {
      showError(t('auth.phoneOtp.verifyFailedTitle'), t('auth.phoneOtp.sessionExpired'));
      return;
    }

    if (!canSubmit) {
      showError(t('auth.phoneOtp.signupIncompleteTitle'), t('auth.phoneOtp.signupIncompleteMessage'));
      return;
    }

    setLoading(true);
    try {
      const loginResult = await completePhoneSignup(params.registrationToken, {
        name: name.trim(),
        email: email.trim() || undefined,
      });
      showSuccess(t('auth.signupSuccess'));
      await navigateAfterCustomerAuth(loginResult);
    } catch (error) {
      showError(t('auth.phoneOtp.signupFailedTitle'), extractAuthErrorMessage(error));
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
          {t('auth.phoneOtp.completeProfile')}
        </CustomText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <CustomText variant="h8" style={styles.subtitle}>
          {t('auth.phoneOtp.completeProfileSubtitle', { phone: params.phone })}
        </CustomText>

        <CustomInput
          value={name}
          onChangeText={setName}
          placeholder={t('auth.name')}
          left={<Ionicons name="person-outline" size={RFValue(18)} color={colors.textSecondary} />}
        />
        <CustomInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={`${t('auth.email')} (${t('auth.phoneOtp.optional')})`}
          left={<Ionicons name="mail-outline" size={RFValue(18)} color={colors.textSecondary} />}
        />

        <TouchableOpacity
          style={styles.policyRow}
          onPress={() => setAcceptedPolicies((v) => !v)}
          activeOpacity={0.8}>
          <Ionicons
            name={acceptedPolicies ? 'checkbox' : 'square-outline'}
            size={RFValue(20)}
            color={colors.primary}
          />
          <CustomText variant="h8" style={styles.policyText}>
            {t('auth.phoneOtp.acceptPolicies')}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('SignupPolicies', { initialTab: 'terms' })}>
          <CustomText variant="h8" style={{ color: colors.primary }}>
            {t('auth.phoneOtp.viewPolicies')}
          </CustomText>
        </TouchableOpacity>

        <CustomButton
          title={t('auth.phoneOtp.createAccount')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!canSubmit}
        />
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
    gap: 14,
  },
  subtitle: {
    marginBottom: 4,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  policyText: {
    flex: 1,
  },
});

export default PhoneSignupScreen;
