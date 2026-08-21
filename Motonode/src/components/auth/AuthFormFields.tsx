import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type InputIcon = 'user' | 'mail' | 'phone' | 'lock';

export function AuthRoleTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: 'user' | 'home';
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const color = active ? colors.primary : colors.textSecondary;
  const borderColor = active ? colors.primary : colors.border;

  return (
    <Pressable
      style={[styles.roleTab, { borderColor, backgroundColor: colors.card }]}
      onPress={() => {
        lightHaptic();
        onPress();
      }}
    >
      <Feather name={icon} size={18} color={color} />
      <Text style={[styles.roleTabText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function AuthLabeledInput({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  maxLength,
  rightElement,
}: {
  label: string;
  icon: InputIcon;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  maxLength?: number;
  rightElement?: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name={icon} size={18} color={colors.placeholder} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        />
        {rightElement}
      </View>
    </View>
  );
}

export function AuthMessageBox({
  message,
  type,
}: {
  message: string;
  type: 'error' | 'success';
}) {
  const colors = useColors();

  return (
    <View style={[styles.messageBox, { backgroundColor: colors.destructive + '18' }]}>
      <Feather
        name={type === 'success' ? 'check-circle' : 'alert-circle'}
        size={14}
        color={colors.primary}
      />
      <Text style={[styles.messageText, { color: colors.primary }]}>{message}</Text>
    </View>
  );
}

export function AuthPrimaryButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.primaryBtnWrap, loading && styles.primaryBtnDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
        <LinearGradient
          colors={[...colors.gradients.primary]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 4,
    marginBottom: 4,
    marginTop: 4,
  },
  logo: {
    width: 118,
    height: 118,
    marginTop: 56,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  titleAccent: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 22,
    textAlign: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 22,
  },
  legalLine: {
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 20,
    marginTop: -4,
  },
  footerLink: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footerAccent: {
    fontFamily: 'Inter_700Bold',
  },
});

const styles = StyleSheet.create({
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  roleTabText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  fieldGroup: {
    width: '100%',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  primaryBtnWrap: {
    width: '100%',
    marginBottom: 20,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 52,
  },
  primaryBtnDisabled: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
});
