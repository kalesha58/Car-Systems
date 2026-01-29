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
  Switch,
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
import { customerLogin, customerSignup } from '@service/authService';
import { getBusinessRegistrationByUserId } from '@service/dealerService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useToast } from '@hooks/useToast';
import { useAuthStore } from '@state/authStore';
import ThemedModal from '@components/ui/ThemedModal';
import { navigate } from '@utils/NavigationUtils';
import { useThemeStore } from '@state/themeStore';
import { useTheme } from '@hooks/useTheme';

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

const CustomerLogin = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [userType, setUserType] = useState<'user' | 'dealer'>('user');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Login Failed');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [gestureSequence, setGestureSequence] = useState<string[]>([]);
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

  const checkUserRole = (role: string | string[] | undefined): string | null => {
    if (!role) {
      return null;
    }

    const roleArray = Array.isArray(role) ? role : [role];

    if (roleArray.includes('admin')) {
      return 'admin';
    }
    if (roleArray.includes('dealer')) {
      return 'dealer';
    }
    if (roleArray.includes('user')) {
      return 'user';
    }

    return null;
  };

  const navigateByRole = (userRole: string | null) => {
    if (userRole === 'user') {
      resetAndNavigate('MainTabs');
    } else if (userRole === 'dealer') {
      resetAndNavigate('DealerTabs');
    } else if (userRole === 'admin') {
      resetAndNavigate('MainTabs');
    } else {
      resetAndNavigate('CustomerLogin');
    }
  };

  useEffect(() => {
    if (keyboardOffsetHeight === 0) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: -keyboardOffsetHeight * 0.84,
        duration: 1000,
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

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.length === 10;
  };

  const handlePhoneChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setPhone(numericText);
    }
  };

  const isFormValid = (): boolean => {
    if (isSignupMode) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      return (
        name.trim().length >= 2 &&
        email.trim().length > 0 &&
        isValidEmail(email.trim()) &&
        cleanPhone.length === 10 &&
        password.length >= 8
      );
    }
    return email.trim().length > 0 && password.length >= 8;
  };

  const handleAuth = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      await customerLogin(email, password);
      showSuccess(t('auth.loginSuccess'));

      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.role) {
        const userRole = checkUserRole(currentUser.role);

        // For dealers, check if they have business registration
        // Try both 'id' and '_id' fields as the user object might have either
        const userId = currentUser.id || currentUser._id;
        if (userRole === 'dealer' && userId) {
          try {
            // Ensure userId is a string to avoid type mismatches
            const userIdString = String(userId);
            const businessRegistration = await getBusinessRegistrationByUserId(userIdString);

            // Check if dealer has business registration
            // Navigate to BusinessRegistration if: no registration exists OR status is rejected
            // Navigate to DealerTabs if: registration exists AND (status is pending OR approved)
            if (!businessRegistration) {
              // No registration exists - navigate to business registration screen
              resetAndNavigate('BusinessRegistration');
            } else if (businessRegistration.status === 'rejected') {
              // Registration was rejected - navigate to business registration screen to resubmit
              resetAndNavigate('BusinessRegistration');
            } else if (businessRegistration.status === 'pending' || businessRegistration.status === 'approved') {
              // Has registration with status pending or approved - navigate to dealer dashboard
              resetAndNavigate('DealerTabs');
            } else {
              // Unknown status - navigate to registration
              resetAndNavigate('BusinessRegistration');
            }
          } catch (error: any) {
            // Handle network errors or other unexpected errors
            // For network errors, allow access to dealer tabs (will show appropriate messages)
            const errorStatus = error?.response?.status;
            // If it's a network error (no status) or server error (5xx), allow access
            // The dealer dashboard will handle showing appropriate messages
            if (!errorStatus || (errorStatus >= 500)) {
              resetAndNavigate('DealerTabs');
            } else {
              // For other errors (like 403), redirect to registration
              resetAndNavigate('BusinessRegistration');
            }
          }
        } else {
          // For regular users (not dealers), check if they have vehicles
          const userId = currentUser.id || currentUser._id;
          if (userRole === 'user' && userId) {
            try {
              const userIdString = String(userId);
              const { getUserVehicles } = await import('@service/vehicleService');
              const vehiclesData = await getUserVehicles();
              // Response is directly an array, not an object with vehicles property
              const hasVehicles = vehiclesData?.Response && Array.isArray(vehiclesData.Response) && vehiclesData.Response.length > 0;

              if (hasVehicles) {
                // User already has vehicles, navigate to MainTabs
                resetAndNavigate('MainTabs');
              } else {
                // User doesn't have vehicles, replace login screen with AddUserVehicle with fromLogin param
                await replace('AddUserVehicle', { fromLogin: true });
              }
            } catch (error: any) {
              // If check fails, navigate to AddUserVehicle (safer default)
              console.error('Error checking user vehicles:', error);
              resetAndNavigate('AddUserVehicle');
            }
          } else {
            // For regular users without userId, navigate to AddUserVehicle screen after login
            resetAndNavigate('AddUserVehicle');
          }
        }
      } else {
        // If no role found, navigate to AddUserVehicle
        resetAndNavigate('AddUserVehicle');
      }
    } catch (error: any) {
      // Extract error message from server response
      // Server returns: { success: false, Response: { ReturnMessage: "..." } }
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
      await customerSignup(name, email, cleanPhone, password, userType);
      showSuccess(t('auth.signupSuccess'));
      // Navigate to login screen after successful signup
      setTimeout(() => {
        setIsSignupMode(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setUserType('user'); // Reset to default
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Signup failed. Please try again.';
      setErrorModalTitle('Signup Failed');
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
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
                  source={require('@assets/images/logo.jpeg')}
                  style={styles.logo}
                />

                <CustomText variant="h2" fontFamily={Fonts.Bold} style={{ color: colors.text }}>
                  Car Connect App
                </CustomText>
                <CustomText
                  variant="h5"
                  fontFamily={Fonts.SemiBold}
                  style={[styles.text, { color: colors.textSecondary }]}>
                  {t('auth.loginOrSignUp')}
                </CustomText>

                {isSignupMode && (
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

                {isSignupMode && (
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
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        color={colors.secondary}
                        size={RFValue(getResponsiveValue(22, 24, 26))}
                      />
                    </TouchableOpacity>
                  }
                />

                {isSignupMode && (
                  <View style={styles.toggleContainer}>
                    <CustomText
                      variant="h6"
                      fontFamily={Fonts.Medium}
                      style={[styles.toggleTitle, { color: colors.text }]}>
                      Account Type
                    </CustomText>
                    <View style={[styles.toggleRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                      <TouchableOpacity
                        onPress={() => setUserType('user')}
                        style={[
                          styles.toggleOption,
                          userType === 'user' && [styles.toggleOptionActive, { backgroundColor: colors.secondary + '15' }],
                        ]}
                        activeOpacity={0.7}>
                        <CustomText
                          variant="h6"
                          fontFamily={userType === 'user' ? Fonts.SemiBold : Fonts.Medium}
                          style={userType === 'user' 
                            ? [styles.toggleLabel, { color: colors.secondary }]
                            : [styles.toggleLabel, { color: colors.disabled }]}>
                          Customer
                        </CustomText>
                      </TouchableOpacity>
                      <Switch
                        value={userType === 'dealer'}
                        onValueChange={(value) => setUserType(value ? 'dealer' : 'user')}
                        trackColor={{ false: colors.border, true: colors.secondary }}
                        thumbColor={colors.white}
                        ios_backgroundColor={colors.border}
                      />
                      <TouchableOpacity
                        onPress={() => setUserType('dealer')}
                        style={[
                          styles.toggleOption,
                          userType === 'dealer' && [styles.toggleOptionActive, { backgroundColor: colors.secondary + '15' }],
                        ]}
                        activeOpacity={0.7}>
                        <CustomText
                          variant="h6"
                          fontFamily={userType === 'dealer' ? Fonts.SemiBold : Fonts.Medium}
                          style={userType === 'dealer' 
                            ? [styles.toggleLabel, { color: colors.secondary }]
                            : [styles.toggleLabel, { color: colors.disabled }]}>
                          Dealer
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {!isSignupMode && (
                  <TouchableOpacity
                    onPress={() =>
                      navigate('ForgotPassword', {
                        returnTo: 'CustomerLogin',
                        prefillEmail: email,
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

                <CustomButton
                  disabled={!isFormValid()}
                  onPress={isSignupMode ? handleSignup : handleAuth}
                  loading={loading}
                  title={isSignupMode ? t('auth.signUp') : 'Continue'}
                />

                <TouchableOpacity
                  onPress={() => setIsSignupMode(!isSignupMode)}
                  style={styles.signupButton}>
                  <CustomText
                    variant="h6"
                    fontFamily={Fonts.Medium}
                    style={[styles.signupButtonText, { color: colors.secondary }]}>
                    {isSignupMode ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
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
    height: getResponsiveValue(50, 60, 70),
    width: getResponsiveValue(50, 60, 70),
    borderRadius: getResponsiveValue(20, 24, 28),
    marginTop: 0,
    marginBottom: getResponsiveValue(10, 12, 14),
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
});

export default CustomerLogin;
