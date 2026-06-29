import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { AuthRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type AuthScreenParamList = {
  [AuthRoutes.Onboarding]: undefined;
  [AuthRoutes.Login]: undefined;
  [AuthRoutes.Signup]: undefined;
  [AuthRoutes.OtpVerify]: undefined;
};

type LoginNavigationProp = NativeStackNavigationProp<
  AuthScreenParamList,
  typeof AuthRoutes.Login
>;

export function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password, isDealer ? 'dealer' : 'customer');
      lightHaptic();
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    login('guest@example.com', 'guest', 'customer');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && { paddingTop: 67 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                <Text style={styles.logoText}>M</Text>
              </View>
              <Text style={[styles.appName, { color: colors.textPrimary }]}>Motonode</Text>
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                Everything Automotive
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sign in to your account
              </Text>

              <View style={[styles.roleToggle, { backgroundColor: colors.muted }]}>
                <Pressable
                  style={[styles.roleBtn, !isDealer && { backgroundColor: colors.card }]}
                  onPress={() => {
                    setIsDealer(false);
                    lightHaptic();
                  }}
                >
                  <Feather
                    name="user"
                    size={16}
                    color={!isDealer ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.roleBtnText,
                      { color: !isDealer ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Customer
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.roleBtn, isDealer && { backgroundColor: colors.card }]}
                  onPress={() => {
                    setIsDealer(true);
                    lightHaptic();
                  }}
                >
                  <Feather
                    name="briefcase"
                    size={16}
                    color={isDealer ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.roleBtnText,
                      { color: isDealer ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Dealer
                  </Text>
                </Pressable>
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15' }]}>
                  <Feather name="alert-circle" size={14} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <Feather name="mail" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Email address"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <Feather name="lock" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>

                <Pressable style={styles.forgotBtn}>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>
                    Forgot Password?
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.loginBtn,
                    { backgroundColor: colors.primary, opacity: pressed || loading ? 0.85 : 1 },
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  )}
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                  <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.guestBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleGuestLogin}
                >
                  <Feather name="eye" size={16} color={colors.textSecondary} />
                  <Text style={[styles.guestBtnText, { color: colors.textSecondary }]}>
                    Browse as Guest
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={styles.registerLink}
              onPress={() => navigation.navigate(AuthRoutes.Signup)}
            >
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                  Sign Up
                </Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 36, fontFamily: 'Inter_700Bold' },
  appName: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  card: { borderRadius: 24, padding: 24 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 24 },
  roleToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  form: { gap: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  loginBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  loginBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  guestBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  registerLink: { alignItems: 'center', marginTop: 24 },
  registerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
