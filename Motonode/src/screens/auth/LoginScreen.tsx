import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import {
  AuthFooterDecoration,
  AuthHeaderDecoration,
  AuthLabeledInput,
  AuthMessageBox,
  AuthPrimaryButton,
  AuthSocialSection,
  authScreenStyles,
} from '@components/auth';
import { ScreenStatusBar } from '@components/common';
import { MotonodeAppLogo } from '@assets/images/brand';
import { AuthRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { extractAuthErrorMessage } from '@utils/authErrors';
import { lightHaptic } from '@utils/haptics';

type AuthScreenParamList = {
  [AuthRoutes.Onboarding]: undefined;
  [AuthRoutes.Login]: { prefillEmail?: string } | undefined;
  [AuthRoutes.Signup]: undefined;
  [AuthRoutes.OtpVerify]: undefined;
};

type LoginNavigationProp = NativeStackNavigationProp<
  AuthScreenParamList,
  typeof AuthRoutes.Login
>;

type LoginRouteProp = RouteProp<AuthScreenParamList, typeof AuthRoutes.Login>;

export function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const navigation = useNavigation<LoginNavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const [email, setEmail] = useState(route.params?.prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (route.params?.prefillEmail) {
      setEmail(route.params.prefillEmail);
      setSuccess('Account created. Sign in to continue.');
    }
  }, [route.params?.prefillEmail]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await login(email, password);
      lightHaptic();
    } catch (err) {
      setError(extractAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authScreenStyles.container}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AuthHeaderDecoration />
      <AuthFooterDecoration />

      <SafeAreaView style={[authScreenStyles.safe, Platform.OS === 'web' && { paddingTop: 67 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={authScreenStyles.flex}
        >
          <ScrollView
            contentContainerStyle={authScreenStyles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={MotonodeAppLogo}
              style={authScreenStyles.logo}
              resizeMode="contain"
            />

            <View style={authScreenStyles.titleRow}>
              <Text style={authScreenStyles.titleText}>Welcome </Text>
              <Text style={authScreenStyles.titleAccent}>Back!</Text>
            </View>
            <Text style={authScreenStyles.subtitle}>Login to continue to your account</Text>

            {success ? <AuthMessageBox message={success} type="success" /> : null}
            {error ? <AuthMessageBox message={error} type="error" /> : null}

            <AuthLabeledInput
              label="Email or Phone Number"
              icon="mail"
              placeholder="Enter email or phone number"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <AuthLabeledInput
              label="Password"
              icon="lock"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightElement={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9CA3AF" />
                </Pressable>
              }
            />

            <Pressable style={{ alignSelf: 'flex-end', marginBottom: 18, marginTop: -4 }}>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>
                Forgot Password?
              </Text>
            </Pressable>

            <AuthPrimaryButton label="Login" loading={loading} onPress={handleLogin} />
            <AuthSocialSection />

            <Pressable
              style={authScreenStyles.footerLink}
              onPress={() => navigation.navigate(AuthRoutes.Signup)}
            >
              <Text style={authScreenStyles.footerText}>
                Don't have an account?{' '}
                <Text style={authScreenStyles.footerAccent}>Sign Up</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
