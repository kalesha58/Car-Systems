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

type SignupNavigationProp = NativeStackNavigationProp<
  AuthScreenParamList,
  typeof AuthRoutes.Signup
>;

export function SignupScreen() {
  const colors = useColors();
  const { register } = useAuth();
  const navigation = useNavigation<SignupNavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(name, email, password, isDealer ? 'dealer' : 'customer');
      lightHaptic();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Join India's largest automotive community
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
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
                {[
                  {
                    icon: 'user',
                    placeholder: 'Full Name',
                    value: name,
                    onChange: setName,
                    keyboard: 'default' as const,
                  },
                  {
                    icon: 'mail',
                    placeholder: 'Email Address',
                    value: email,
                    onChange: setEmail,
                    keyboard: 'email-address' as const,
                  },
                ].map((field, i) => (
                  <View
                    key={i}
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    ]}
                  >
                    <Feather name={field.icon as 'user'} size={18} color={colors.textTertiary} />
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.textTertiary}
                      value={field.value}
                      onChangeText={field.onChange}
                      keyboardType={field.keyboard}
                      autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'}
                    />
                  </View>
                ))}

                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <Feather name="lock" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Password (min 6 characters)"
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

                <Pressable
                  style={({ pressed }) => [
                    styles.registerBtn,
                    { backgroundColor: colors.primary, opacity: pressed || loading ? 0.85 : 1 },
                  ]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.registerBtnText}>Create Account</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.loginLink} onPress={() => navigation.goBack()}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                  Sign In
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
  scroll: { flexGrow: 1, padding: 20 },
  backBtn: { padding: 4, marginBottom: 20, alignSelf: 'flex-start' },
  headerText: { marginBottom: 28 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 24, padding: 24, marginBottom: 20 },
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
  registerBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  registerBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
