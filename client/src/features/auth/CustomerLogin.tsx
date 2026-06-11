import {
  View,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
  Keyboard,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import ProductSlider from '@components/login/ProductSlider';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import { RFValue } from 'react-native-responsive-fontsize';
import { resetAndNavigate, replace } from '@utils/NavigationUtils';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import LinearGradient from 'react-native-linear-gradient';
import CustomInput from '@components/ui/CustomInput';
import CustomButton from '@components/ui/CustomButton';
import {
  acceptLatestPolicy,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  customerLogin,
  sendPhoneOtp,
} from '@service/authService';
import { navigateAfterCustomerAuth } from '../../auth/postLoginNavigation';
import { savePendingSignupDraft } from '@utils/signupDraftStorage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useToast } from '@hooks/useToast';
import { useAuthStore } from '@state/authStore';
import ThemedModal from '@components/ui/ThemedModal';
import { navigate } from '@utils/NavigationUtils';
import { useRoute } from '@react-navigation/native';
import { useThemeStore } from '@state/themeStore';
import { useTheme } from '@hooks/useTheme';
import { storage } from '@state/storage';

// bottomColors will be set dynamically based on theme

// Define responsive helper at module level (before component)
const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;
const isDesktop = screenWidth >= 1024;

const getResponsiveValue = (mobile: number, tablet?: number, desktop?: number) => {
  if (isDesktop && desktop !== undefined) return desktop;
  if (isTablet && tablet !== undefined) return tablet;
  return mobile;
};

type CustomerLoginParams = {
  prefillLoginIdentifier?: string;
};

const CustomerLogin = () => {
  const route = useRoute();
  const routeParams = (route.params || {}) as CustomerLoginParams;
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);
  /** Signup step 1: explicit choice; step 2: credentials (server role = userType). */
  const [signupStep, setSignupStep] = useState<'chooseAccountType' | 'enterDetails'>('chooseAccountType');
  const [userType, setUserType] = useState<'user' | 'dealer'>('user');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Login Failed');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [gestureSequence, setGestureSequence] = useState<string[]>([]);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const keyboardOffsetHeight = useKeyboardOffsetHeight();
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const { toggleTheme } = useThemeStore();
  const { isDark, colors } = useTheme();

  // Dynamic gradient colors based on theme
  const bottomColors = isDark 
    ? ['rgba(18, 18, 18, 1)', 'rgba(18, 18, 18, 0.9)', 'rgba(18, 18, 18, 0.7)', 'rgba(18, 18, 18, 0.6)', 'rgba(18, 18, 18, 0.5)', 'rgba(18, 18, 18, 0.4)', 'rgba(18, 18, 18, 0.003)']
    : ['rgba(255,255,255,1)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.003)'];

  const isValidEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const isValidPhone = (value: string): boolean => {
    const cleanPhone = value.replace(/[^0-9]/g, '');
    return cleanPhone.length === 10;
  };

  useEffect(() => {
    if (routeParams.prefillLoginIdentifier) {
      setLoginIdentifier(routeParams.prefillLoginIdentifier);
      setIsSignupMode(false);
      setSignupStep('chooseAccountType');
      showSuccess(t('auth.signupSuccessLogin'));
    }
  }, [routeParams.prefillLoginIdentifier, showSuccess, t]);

  const isLoginEmailInput = (value: string): boolean =>
    value.includes('@') || /[a-zA-Z]/.test(value);

  const handleLoginIdentifierChange = (text: string) => {
    if (isLoginEmailInput(text)) {
      setLoginIdentifier(text);
      return;
    }
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setLoginIdentifier(numericText);
    }
  };

  const isLoginEmailMode =
    !isSignupMode && (loginIdentifier.length === 0 || isLoginEmailInput(loginIdentifier));
  const isPhoneLogin =
    !isSignupMode &&
    loginIdentifier.length > 0 &&
    !isLoginEmailInput(loginIdentifier) &&
    isValidPhone(loginIdentifier);

  const getLoginButtonTitle = (): string => {
    if (isSignupMode) {
      return t('auth.signUp');
    }
    if (isPhoneLogin) {
      return t('auth.phoneOtp.sendOtp');
    }
    return t('auth.loginWithEmail');
  };

  useEffect(() => {
    if (keyboardOffsetHeight === 0) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Use a smaller offset so the name field (top of form) stays visible when focused
      Animated.timing(animatedValue, {
        toValue: -keyboardOffsetHeight * 0.4,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [keyboardOffsetHeight]);

  const handleGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const { translationX, translationY } = nativeEvent;
      let direction = '';
      if (Math.abs(translationX) > Math.abs(translationY)) {
        direction = translationX > 0 ? 'right' : 'left';
      } else {
        direction = translationY > 0 ? 'down' : 'up';
      }

      const newSequence = [...gestureSequence, direction].slice(-5);
      setGestureSequence(newSequence);

      if (newSequence?.join(' ') === 'up up down left right') {
        setGestureSequence([]);
        resetAndNavigate('DeliveryLogin');
      }
    }
  };

  const handlePhoneChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setPhone(numericText);
    }
  };

  const isFormValid = (): boolean => {
    if (isSignupMode) {
      if (signupStep === 'chooseAccountType') {
        return false;
      }
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      return (
        name.trim().length >= 2 &&
        email.trim().length > 0 &&
        isValidEmail(email.trim()) &&
        cleanPhone.length === 10 &&
        password.length >= 8
        && acceptedPolicies
      );
    }
    if (isLoginEmailInput(loginIdentifier)) {
      return isValidEmail(loginIdentifier.trim()) && password.length >= 8;
    }
    if (isPhoneLogin) {
      return true;
    }
    return false;
  };

  const toggleSignupMode = () => {
    if (isSignupMode) {
      setIsSignupMode(false);
      setSignupStep('chooseAccountType');
    } else {
      setIsSignupMode(true);
      setSignupStep('chooseAccountType');
    }
  };

  const handleAuth = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      if (isPhoneLogin) {
        const cleanPhone = loginIdentifier.replace(/[^0-9]/g, '');
        const otpResult = await sendPhoneOtp(cleanPhone);
        navigate('OtpVerify', {
          phone: cleanPhone,
          flow: 'login',
          resendAfterSeconds: otpResult.resendAfterSeconds,
          otpExpiresInSeconds: otpResult.otpExpiresInSeconds,
          otpLength: otpResult.otpLength,
        });
        return;
      }

      const loginResult = await customerLogin(loginIdentifier.trim().toLowerCase(), password);
      if (loginResult.requiresPolicyAcceptance) {
        Alert.alert(
          'Policy Update Required',
          'Please review and accept the latest Terms of Use and Privacy Policy to continue.',
          [
            { text: 'View Terms', onPress: () => navigate('SignupPolicies', { initialTab: 'terms' }) },
            { text: 'View Privacy', onPress: () => navigate('SignupPolicies', { initialTab: 'privacy' }) },
            {
              text: 'Accept & Continue',
              onPress: async () => {
                await acceptLatestPolicy(
                  loginResult.currentTermsVersion || CURRENT_TERMS_VERSION,
                  loginResult.currentPrivacyVersion || CURRENT_PRIVACY_VERSION,
                );
              },
            },
          ],
        );
      }
      showSuccess(t('auth.loginSuccess'));
      await navigateAfterCustomerAuth(loginResult);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'Invalid email or password. Please try again.';

      console.error('Login failed:', errorMessage);
      setErrorModalTitle('Login Failed');
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      savePendingSignupDraft({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        password,
        userType,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      });
      const otpResult = await sendPhoneOtp(cleanPhone);
      navigate('OtpVerify', {
        phone: cleanPhone,
        flow: 'signup',
        resendAfterSeconds: otpResult.resendAfterSeconds,
        otpExpiresInSeconds: otpResult.otpExpiresInSeconds,
        otpLength: otpResult.otpLength,
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'Could not send verification code. Please try again.';
      setErrorModalTitle('Signup Failed');
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    setUser({
      id: 'guest_user',
      name: 'Guest User',
      email: 'guest@motonode.com',
      role: ['guest'],
      isGuest: true,
      address: 'Browsing as Guest',
      phone: '9999999999'
    });
    resetAndNavigate('MainTabs');
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomSafeAreaView>
          <ThemedModal
            visible={errorModalVisible}
            title={errorModalTitle}
            message={errorModalMessage}
            variant="error"
            primaryText="OK"
            onClose={() => setErrorModalVisible(false)}
          />
          <ProductSlider />

          <PanGestureHandler onHandlerStateChange={handleGesture}>
            <Animated.ScrollView
              bounces={false}
              style={{ transform: [{ translateY: animatedValue }] }}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.subContainer}>

              <LinearGradient colors={bottomColors} style={styles.gradient} />

              <View style={[styles.content, { backgroundColor: colors.cardBackground }]}>
                <Image
                  source={require('@assets/images/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <CustomText
                  variant="h5"
                  fontFamily={Fonts.SemiBold}
                  style={[styles.text, { color: colors.textSecondary }]}>
                  {t('auth.loginOrSignUp')}
                </CustomText>

                {isSignupMode && signupStep === 'enterDetails' && (
                  <View
                    style={{
                      width: '100%',
                      marginTop: getResponsiveValue(8, 10, 12),
                      marginBottom: getResponsiveValue(4, 6, 8),
                      paddingVertical: getResponsiveValue(10, 12, 14),
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundSecondary,
                    }}>
                    <CustomText
                      variant="h4"
                      fontFamily={Fonts.Bold}
                      style={{ color: colors.text, textAlign: 'center' }}>
                      {userType === 'dealer' ? t('auth.signupAsDealer') : t('auth.signupAsCustomer')}
                    </CustomText>
                    <CustomText
                      variant="h6"
                      fontFamily={Fonts.Medium}
                      style={{
                        color: colors.textSecondary,
                        textAlign: 'center',
                        marginTop: 6,
                      }}>
                      {userType === 'dealer' ? t('auth.signupDealerHint') : t('auth.signupCustomerHint')}
                    </CustomText>
                  </View>
                )}

                {isSignupMode && signupStep === 'chooseAccountType' && (
                  <View style={{ width: '100%', marginTop: getResponsiveValue(8, 10, 12) }}>
                    <CustomText
                      variant="h5"
                      fontFamily={Fonts.SemiBold}
                      style={{ color: colors.text, marginBottom: 8, textAlign: 'center' }}>
                      Choose account type
                    </CustomText>
                    <CustomText
                      variant="h6"
                      fontFamily={Fonts.Medium}
                      style={{ color: colors.textSecondary, marginBottom: 16, textAlign: 'center' }}>
                      Tap one option, then enter your details on the next step.
                    </CustomText>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setUserType('user');
                        setSignupStep('enterDetails');
                      }}
                      style={[
                        styles.accountTypeCard,
                        { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
                      ]}>
                      <Ionicons name="person-circle-outline" size={RFValue(36)} color={colors.secondary} />
                      <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{ color: colors.text, marginTop: 8 }}>
                        Customer
                      </CustomText>
                      <CustomText variant="h6" fontFamily={Fonts.Medium} style={{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                        Shop, book services, and manage your garage
                      </CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setUserType('dealer');
                        setSignupStep('enterDetails');
                      }}
                      style={[
                        styles.accountTypeCard,
                        { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, marginTop: 12 },
                      ]}>
                      <Ionicons name="storefront-outline" size={RFValue(36)} color={colors.secondary} />
                      <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{ color: colors.text, marginTop: 8 }}>
                        Dealer
                      </CustomText>
                      <CustomText variant="h6" fontFamily={Fonts.Medium} style={{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                        Sell inventory after business registration is approved by admin
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                )}

                {(!isSignupMode || (isSignupMode && signupStep === 'enterDetails')) && (
                  <>
                    {isSignupMode && signupStep === 'enterDetails' && (
                      <TouchableOpacity
                        onPress={() => setSignupStep('chooseAccountType')}
                        style={{ alignSelf: 'flex-start', marginBottom: 10, marginTop: 4 }}>
                        <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={{ color: colors.secondary }}>
                          Change account type
                        </CustomText>
                      </TouchableOpacity>
                    )}

                    {isSignupMode && signupStep === 'enterDetails' && (
                      <CustomInput
                        onChangeText={setName}
                        onClear={() => setName('')}
                        value={name}
                        placeholder={t('auth.name')}
                        inputMode="text"
                        left={
                          <Ionicons
                            name="person"
                            color={colors.secondary}
                            style={{ marginLeft: 10 }}
                            size={RFValue(18)}
                          />
                        }
                        right={false}
                      />
                    )}

                    {isSignupMode && signupStep === 'enterDetails' && (
                      <CustomInput
                        onChangeText={setEmail}
                        onClear={() => setEmail('')}
                        value={email}
                        placeholder={t('auth.email')}
                        inputMode="email"
                        left={
                          <Ionicons
                            name="mail"
                            color={colors.secondary}
                            style={{ marginLeft: 10 }}
                            size={RFValue(18)}
                          />
                        }
                        right={false}
                      />
                    )}

                    {!isSignupMode && (
                      <CustomInput
                        onChangeText={handleLoginIdentifierChange}
                        onClear={() => setLoginIdentifier('')}
                        value={loginIdentifier}
                        placeholder={t('auth.loginIdentifier')}
                        inputMode={
                          !loginIdentifier || isLoginEmailInput(loginIdentifier) ? 'email' : 'numeric'
                        }
                        keyboardType={
                          !loginIdentifier
                            ? 'email-address'
                            : isLoginEmailInput(loginIdentifier)
                              ? 'email-address'
                              : 'number-pad'
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        left={
                          <Ionicons
                            name={
                              !loginIdentifier || isLoginEmailInput(loginIdentifier) ? 'mail' : 'call'
                            }
                            color={colors.secondary}
                            style={{ marginLeft: 10 }}
                            size={RFValue(18)}
                          />
                        }
                        right={false}
                      />
                    )}

                    {isSignupMode && signupStep === 'enterDetails' && (
                      <CustomInput
                        onChangeText={handlePhoneChange}
                        onClear={() => setPhone('')}
                        value={phone}
                        placeholder={t('auth.phone')}
                        inputMode="tel"
                        keyboardType="numeric"
                        maxLength={10}
                        left={
                          <Ionicons
                            name="call"
                            color={colors.secondary}
                            style={{ marginLeft: 10 }}
                            size={RFValue(18)}
                          />
                        }
                        right={false}
                      />
                    )}

                    {(isSignupMode || isLoginEmailMode) && (
                      <CustomInput
                        onChangeText={setPassword}
                        onClear={() => setPassword('')}
                        value={password}
                        placeholder={t('auth.password')}
                        secureTextEntry={!showPassword}
                        left={
                          <Ionicons
                            name="key-sharp"
                            color={colors.secondary}
                            style={{ marginLeft: 10 }}
                            size={RFValue(18)}
                          />
                        }
                        right={false}
                        rightIcon={
                          <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={{
                              padding: getResponsiveValue(8, 10, 12),
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.7}>
                            <Ionicons
                              name={showPassword ? 'eye-off' : 'eye'}
                              color={colors.secondary}
                              size={RFValue(getResponsiveValue(22, 24, 26))}
                            />
                          </TouchableOpacity>
                        }
                      />
                    )}
                    {isSignupMode && signupStep === 'enterDetails' && (
                      <TouchableOpacity
                        onPress={() => setAcceptedPolicies((prev) => !prev)}
                        style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, marginBottom: 4 }}>
                        <Ionicons
                          name={acceptedPolicies ? 'checkbox' : 'square-outline'}
                          color={colors.secondary}
                          size={RFValue(18)}
                          style={{ marginTop: 2 }}
                        />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <CustomText style={{ color: colors.textSecondary }} fontSize={RFValue(9)}>
                            I agree to the Terms of Use and Privacy Policy.
                          </CustomText>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <TouchableOpacity onPress={() => navigate('SignupPolicies', { initialTab: 'terms' })}>
                              <CustomText style={{ color: colors.secondary }} fontSize={RFValue(9)}>Terms</CustomText>
                            </TouchableOpacity>
                            <CustomText style={{ color: colors.textSecondary, marginHorizontal: 4 }} fontSize={RFValue(9)}>|</CustomText>
                            <TouchableOpacity onPress={() => navigate('SignupPolicies', { initialTab: 'privacy' })}>
                              <CustomText style={{ color: colors.secondary }} fontSize={RFValue(9)}>Privacy</CustomText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {!isSignupMode && isLoginEmailMode && loginIdentifier.includes('@') && (
                  <TouchableOpacity
                    onPress={() =>
                      navigate('ForgotPassword', {
                        returnTo: 'CustomerLogin',
                        prefillEmail: loginIdentifier.trim(),
                      })
                    }
                    style={{ alignSelf: 'flex-end', marginTop: getResponsiveValue(6, 8, 10) }}>
                    <CustomText
                      variant="h6"
                      fontFamily={Fonts.Medium}
                      style={{ color: colors.secondary }}>
                      Forgot password?
                    </CustomText>
                  </TouchableOpacity>
                )}

                {!(isSignupMode && signupStep === 'chooseAccountType') && (
                  <CustomButton
                    disabled={!isFormValid()}
                    onPress={isSignupMode ? handleSignup : handleAuth}
                    loading={loading}
                    title={getLoginButtonTitle()}
                  />
                )}

                <TouchableOpacity
                  onPress={toggleSignupMode}
                  style={styles.signupButton}>
                  <CustomText
                    variant="h6"
                    fontFamily={Fonts.Medium}
                    style={[styles.signupButtonText, { color: colors.secondary }]}>
                    {isSignupMode ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGuestEntry}
                  style={[styles.signupButton, { marginTop: 0 }]}>
                  <CustomText
                    variant="h6"
                    fontFamily={Fonts.SemiBold}
                    style={{ color: colors.textSecondary, opacity: 0.7 }}>
                    Continue as Guest
                  </CustomText>
                </TouchableOpacity>
              </View>
            </Animated.ScrollView>
          </PanGestureHandler>
        </CustomSafeAreaView>

        <View style={[styles.footer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <SafeAreaView />
          <CustomText fontSize={RFValue(6)} style={{ color: colors.textSecondary }}>
            By Continuing, you agree to our Terms of Service & Privacy Policy
          </CustomText>
          <SafeAreaView />
        </View>

        <TouchableOpacity
          style={[styles.absoluteSwitch, { backgroundColor: colors.cardBackground }]}
          onPress={toggleTheme}
          activeOpacity={0.7}>
          <Ionicons 
            name={isDark ? 'sunny' : 'moon'} 
            color={colors.text} 
            size={RFValue(getResponsiveValue(20, 22, 24))} 
          />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteSwitch: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? getResponsiveValue(50, 60, 70) : getResponsiveValue(30, 40, 50),
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    padding: getResponsiveValue(10, 12, 14),
    height: getResponsiveValue(55, 60, 65),
    justifyContent: "center",
    alignItems: 'center',
    width: getResponsiveValue(55, 60, 65),
    borderRadius: 50,
    right: getResponsiveValue(10, 16, 20),
    zIndex: 99
  },
  text: {
    marginTop: getResponsiveValue(2, 4, 6),
    marginBottom: getResponsiveValue(25, 30, 35),
    opacity: 0.8,
  },
  logo: {
    height: getResponsiveValue(62, 72, 82),
    width: getResponsiveValue(62, 72, 82),
    marginTop: 0,
    marginBottom: getResponsiveValue(6, 8, 10),
  },
  subContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: getResponsiveValue(20, 24, 28),
  },
  footer: {
    borderTopWidth: 0.8,
    paddingBottom: getResponsiveValue(10, 12, 14),
    zIndex: 22,
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(10, 12, 14),
    width: '100%',
  },
  gradient: {
    paddingTop: 0,
    width: '100%',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: isDesktop ? 500 : isTablet ? 450 : '100%',
    alignSelf: 'center',
    paddingHorizontal: isDesktop ? 40 : isTablet ? 32 : 20,
    paddingTop: 0,
    paddingBottom: isDesktop ? 28 : isTablet ? 24 : 20,
  },
  signupButton: {
    marginTop: getResponsiveValue(10, 12, 14),
    paddingVertical: getResponsiveValue(10, 12, 14),
  },
  signupButtonText: {
    textAlign: 'center',
  },
  toggleContainer: {
    width: '100%',
    marginTop: getResponsiveValue(15, 18, 20),
    marginBottom: getResponsiveValue(10, 12, 14),
  },
  toggleTitle: {
    fontSize: RFValue(getResponsiveValue(14, 15, 16)),
    marginBottom: getResponsiveValue(10, 12, 14),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: getResponsiveValue(12, 14, 16),
    padding: getResponsiveValue(12, 14, 16),
    borderWidth: 1,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveValue(8, 10, 12),
    borderRadius: getResponsiveValue(8, 10, 12),
  },
  toggleOptionActive: {
    // Background color will be set dynamically
  },
  toggleLabel: {
    fontSize: RFValue(getResponsiveValue(14, 15, 16)),
  },
  toggleLabelActive: {
    // Color will be set dynamically
  },
  accountTypeCard: {
    width: '100%',
    borderRadius: getResponsiveValue(14, 16, 18),
    borderWidth: 1.5,
    padding: getResponsiveValue(16, 18, 20),
    alignItems: 'center',
  },
});

export default CustomerLogin;
