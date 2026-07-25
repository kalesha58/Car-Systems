import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useToast } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { changePassword } from '@services/profile.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { successHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ChangePassword
>;

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!currentPassword) return 'Enter your current password';
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return `New password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (newPassword === currentPassword) {
      return 'New password must be different from your current password';
    }
    if (newPassword !== confirmPassword) return 'New passwords do not match';
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await changePassword(currentPassword, newPassword);
      successHaptic();
      showToast('Password changed successfully', 'success');
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to change password'));
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
        ]}
        value={value}
        onChangeText={(text) => {
          setError(null);
          onChangeText(text);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={!showPasswords}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="shield" size={16} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Use at least {MIN_PASSWORD_LENGTH} characters. You'll stay signed in on this device
              after changing your password.
            </Text>
          </View>

          {renderField(
            'Current password',
            currentPassword,
            setCurrentPassword,
            'Enter current password',
          )}
          {renderField('New password', newPassword, setNewPassword, 'Enter new password')}
          {renderField(
            'Confirm new password',
            confirmPassword,
            setConfirmPassword,
            'Re-enter new password',
          )}

          <Pressable
            style={styles.showRow}
            onPress={() => setShowPasswords((prev) => !prev)}
            hitSlop={6}
          >
            <Feather name={showPasswords ? 'eye-off' : 'eye'} size={14} color={colors.textSecondary} />
            <Text style={[styles.showText, { color: colors.textSecondary }]}>
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </Text>
          </Pressable>

          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed || saving ? 0.85 : 1 },
            ]}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                Update Password
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  content: { padding: 16, gap: 14 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  infoText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  field: { gap: 6 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  showRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  showText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium' },
  saveBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
