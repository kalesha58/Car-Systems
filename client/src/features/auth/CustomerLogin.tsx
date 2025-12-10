import {
  View,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
  Keyboard,
  Alert,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import ProductSlider from '@components/login/ProductSlider';
import {Colors, Fonts, lightColors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import {resetAndNavigate} from '@utils/NavigationUtils';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import LinearGradient from 'react-native-linear-gradient';
import CustomInput from '@components/ui/CustomInput';
import CustomButton from '@components/ui/CustomButton';
import { customerLogin, customerSignup } from '@service/authService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useToast} from '@hooks/useToast';
import {useAuthStore} from '@state/authStore';

const bottomColors = [...lightColors].reverse();

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gestureSequence, setGestureSequence] = useState<string[]>([]);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const keyboardOffsetHeight = useKeyboardOffsetHeight();
  const {t} = useTranslation();
  const {showSuccess} = useToast();

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

  const handleGesture = ({nativeEvent}: any) => {
    if (nativeEvent.state === State.END) {
      const {translationX, translationY} = nativeEvent;
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
        navigateByRole(userRole);
      } else {
        resetAndNavigate('MainTabs');
      }
    } catch (error: any) {
      // Extract error message from server response
      // Server returns: { success: false, Response: { ReturnMessage: "..." } }
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'Invalid email or password. Please try again.';
      
      console.error('Login failed:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: errorMessage
      });
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      await customerSignup(email, cleanPhone, password);
      showSuccess(t('auth.signupSuccess'));
      setIsSignupMode(false);
      setEmail('');
      setPassword('');
      setPhone('');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Signup failed. Please try again.';
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <CustomSafeAreaView>
          <ProductSlider />

          <PanGestureHandler onHandlerStateChange={handleGesture}>
            <Animated.ScrollView
              bounces={false}
              style={{transform: [{translateY: animatedValue}]}}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.subContainer}>

              <LinearGradient colors={bottomColors} style={styles.gradient} />
              
              <View style={styles.content}>
                <Image
                  source={require('@assets/images/logo.jpeg')}
                  style={styles.logo}
                />

                <CustomText variant="h2" fontFamily={Fonts.Bold}>
                 Car Connect App
                </CustomText>
                <CustomText
                  variant="h5"
                  fontFamily={Fonts.SemiBold}
                  style={styles.text}>
                  {t('auth.loginOrSignUp')}
                </CustomText>

                <CustomInput
                  onChangeText={setEmail}
                  onClear={() => setEmail('')}
                  value={email}
                  placeholder={t('auth.email')}
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
                        color="#F8890E"
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
                      color="#F8890E"
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
                        color="#F8890E"
                        size={RFValue(getResponsiveValue(22, 24, 26))}
                      />
                    </TouchableOpacity>
                  }
                />

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
                    style={styles.signupButtonText}>
                    {isSignupMode ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </Animated.ScrollView>
          </PanGestureHandler>
        </CustomSafeAreaView>

        <View style={styles.footer}>
          <SafeAreaView />
          <CustomText fontSize={RFValue(6)}>
            By Continuing, you agree to our Terms of Service & Privacy Policy
          </CustomText>
          <SafeAreaView />
        </View>

        <TouchableOpacity 
          style={styles.absoluteSwitch} 
          onPress={()=>resetAndNavigate('DeliveryLogin')}>
          <Icon name='bike-fast' color="#000" size={RFValue(getResponsiveValue(18, 20, 22))}/>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteSwitch:{
    position:'absolute',
    top:Platform.OS==='ios' ? getResponsiveValue(50, 60, 70) : getResponsiveValue(30, 40, 50),
    backgroundColor:"#fff",
    shadowColor:"#000",
    shadowOffset:{width:1,height:1},
    shadowOpacity:0.5,
    shadowRadius:12,
    elevation:10,
    padding:getResponsiveValue(10, 12, 14),
    height:getResponsiveValue(55, 60, 65),
    justifyContent:"center",
    alignItems:'center',
    width:getResponsiveValue(55, 60, 65),
    borderRadius:50,
    right:getResponsiveValue(10, 16, 20),
    zIndex:99
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
    borderColor: Colors.border,
    paddingBottom: getResponsiveValue(10, 12, 14),
    zIndex: 22,
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(10, 12, 14),
    backgroundColor: '#f8f9fc',
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
    backgroundColor: 'white',
    paddingHorizontal: isDesktop ? 40 : isTablet ? 32 : 20,
    paddingTop: 0,
    paddingBottom: isDesktop ? 28 : isTablet ? 24 : 20,
  },
  signupButton: {
    marginTop: getResponsiveValue(10, 12, 14),
    paddingVertical: getResponsiveValue(10, 12, 14),
  },
  signupButtonText: {
    color: Colors.secondary,
    textAlign: 'center',
  },
});

export default CustomerLogin;
