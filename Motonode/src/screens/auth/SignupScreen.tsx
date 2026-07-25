import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import {
  AuthFooterDecoration,
  AuthHeaderDecoration,
  AuthLabeledInput,
  AuthMessageBox,
  AuthPrimaryButton,
  AuthRoleTab,
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

type SignupNavigationProp = NativeStackNavigationProp<
  AuthScreenParamList,
  typeof AuthRoutes.Signup
>;

type UserTab = 'customer' | 'dealer';

export function SignupScreen() {
  const colors = useColors();
  const { register } = useAuth();
  const navigation = useNavigation<SignupNavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<UserTab>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!name || !email || !cleanPhone || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(
        name,
        email,
        cleanPhone,
        password,
        activeTab === 'dealer' ? 'dealer' : 'customer',
      );
      lightHaptic();
      navigation.navigate(AuthRoutes.Login, { prefillEmail: email.trim().toLowerCase() });
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
            <Pressable style={authScreenStyles.backBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color={colors.textPrimary} />
            </Pressable>

            <Image
              source={MotonodeAppLogo}
              style={authScreenStyles.logo}
              resizeMode="contain"
            />

            <View style={authScreenStyles.titleRow}>
              <Text style={authScreenStyles.titleText}>Create </Text>
              <Text style={authScreenStyles.titleAccent}>Account!</Text>
            </View>
            <Text style={authScreenStyles.subtitle}>
              Sign up to join India's largest automotive community
            </Text>

            <View style={authScreenStyles.roleRow}>
              <AuthRoleTab
                label="Customer"
                icon="user"
                active={activeTab === 'customer'}
                onPress={() => setActiveTab('customer')}
              />
              <AuthRoleTab
                label="Dealer / Workshop"
                icon="home"
                active={activeTab === 'dealer'}
                onPress={() => setActiveTab('dealer')}
              />
            </View>

            {error ? <AuthMessageBox message={error} type="error" /> : null}

            <AuthLabeledInput
              label="Full Name"
              icon="user"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />

            <AuthLabeledInput
              label="Email Address"
              icon="mail"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <AuthLabeledInput
              label="Phone Number"
              icon="phone"
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <AuthLabeledInput
              label="Password"
              icon="lock"
              placeholder="Min 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightElement={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9CA3AF" />
                </Pressable>
              }
            />

            <AuthPrimaryButton
              label="Create Account"
              loading={loading}
              onPress={handleRegister}
            />
            <AuthSocialSection />

            <Pressable
              style={authScreenStyles.footerLink}
              onPress={() => navigation.navigate(AuthRoutes.Login)}
            >
              <Text style={authScreenStyles.footerText}>
                Already have an account?{' '}
                <Text style={authScreenStyles.footerAccent}>Sign In</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
