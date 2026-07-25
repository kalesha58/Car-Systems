import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

import { PrimaryButton } from '@components/buttons';
import { ChromeHeader } from '@components/common';
import { PhotoPermissionModal, PhotoPickerSheet } from '@components/modals';
import { OtpInput } from '@components/verification';
import { OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '@config/otpConfig';
import { DealerStackRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useToast } from '@context/ToastContext';
import { useColors } from '@hooks/useColors';
import { usePhotoPicker } from '@hooks/usePhotoPicker';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import {
  sendPhoneChangeOtp,
  updateProfile,
  updateProfilePhoto,
  verifyPhoneChange,
} from '@services/profile.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { mapServerUserToAuthUser } from '@utils/mapAuthUser';
import { lightHaptic, successHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.EditAccount
>;

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '').slice(0, 10);
}

export function DealerEditAccountScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [otpLength, setOtpLength] = useState(OTP_LENGTH);

  const applyAuthUser = async (mapped: ReturnType<typeof mapServerUserToAuthUser>) => {
    await updateUser({
      name: mapped.name,
      phone: mapped.phone,
      email: mapped.email,
      avatar: mapped.avatar,
      location: mapped.location,
      mobileVerified: mapped.mobileVerified,
    });
    setEmail(mapped.email);
    setPhone(mapped.phone);
    setAvatarUri(mapped.avatar ?? '');
  };

  const {
    pickerVisible,
    setPickerVisible,
    permissionVisible,
    permissionDenied,
    permissionLoading,
    pendingSource,
    openPicker,
    handlePhotoPickerSelect,
    handlePermissionAllow,
    handlePermissionDeny,
  } = usePhotoPicker({
    onPicked: async (uri) => {
      setUploadingPhoto(true);
      try {
        const updated = await updateProfilePhoto(uri);
        const mapped = mapServerUserToAuthUser(updated);
        await applyAuthUser(mapped);
        successHaptic();
        showToast('Profile photo updated', 'success');
      } catch (err) {
        Alert.alert('Upload failed', getApiErrorMessage(err, 'Could not update photo'));
      } finally {
        setUploadingPhoto(false);
      }
    },
  });

  useEffect(() => {
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
    setAvatarUri(user?.avatar ?? '');
  }, [user?.email, user?.phone, user?.avatar]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const requestPhoneOtp = async (nextPhone: string) => {
    setSendingOtp(true);
    try {
      const result = await sendPhoneChangeOtp(nextPhone);
      setPendingPhone(nextPhone);
      setOtp('');
      setOtpStep(true);
      setOtpLength(result.otpLength || OTP_LENGTH);
      setResendSeconds(result.resendAfterSeconds || OTP_RESEND_COOLDOWN_SECONDS);
      showToast('OTP sent to your new number', 'success');
    } catch (err) {
      Alert.alert('OTP failed', getApiErrorMessage(err, 'Could not send OTP'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSave = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = digitsOnly(phone);
    const currentPhone = digitsOnly(user?.phone ?? '');

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    if (trimmedPhone && trimmedPhone.length !== 10) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit phone number.');
      return;
    }

    lightHaptic();
    const phoneChanged = trimmedPhone.length === 10 && trimmedPhone !== currentPhone;
    const emailChanged = trimmedEmail !== (user?.email ?? '').trim().toLowerCase();

    if (!emailChanged && !phoneChanged) {
      showToast('No changes to save', 'info');
      return;
    }

    if (emailChanged) {
      setSaving(true);
      try {
        const updated = await updateProfile({ email: trimmedEmail });
        const mapped = mapServerUserToAuthUser(updated);
        await applyAuthUser(mapped);
        successHaptic();
        showToast('Email updated', 'success');
      } catch (err) {
        Alert.alert('Error', getApiErrorMessage(err, 'Failed to update email'));
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    if (phoneChanged) {
      await requestPhoneOtp(trimmedPhone);
    } else if (emailChanged && !phoneChanged) {
      navigation.goBack();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== otpLength) {
      Alert.alert('Invalid OTP', `Enter the ${otpLength}-digit code.`);
      return;
    }

    setVerifyingOtp(true);
    lightHaptic();
    try {
      const updated = await verifyPhoneChange(pendingPhone, otp);
      const mapped = mapServerUserToAuthUser(updated);
      await applyAuthUser(mapped);
      successHaptic();
      showToast('Phone number updated', 'success');
      setOtpStep(false);
      setOtp('');
      setPendingPhone('');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Verification failed', getApiErrorMessage(err, 'Invalid OTP'));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const initial = (user?.name || 'D').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PhotoPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handlePhotoPickerSelect}
      />
      <PhotoPermissionModal
        visible={permissionVisible && pendingSource !== null}
        source={pendingSource ?? 'gallery'}
        variant={permissionDenied ? 'denied' : 'request'}
        loading={permissionLoading}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />

      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (otpStep) {
                setOtpStep(false);
                setOtp('');
                return;
              }
              navigation.goBack();
            }}
            style={styles.headerBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>
            {otpStep ? 'Verify Phone' : 'Edit Account'}
          </Text>
          <View style={styles.headerBtn} />
        </View>
      </ChromeHeader>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {otpStep ? (
            <View style={styles.otpBlock}>
              <Text style={[styles.otpTitle, { color: colors.textPrimary }]}>
                Enter the OTP sent to
              </Text>
              <Text style={[styles.otpPhone, { color: colors.textSecondary }]}>
                +91 {pendingPhone.slice(0, 5)} {pendingPhone.slice(5)}
              </Text>

              <OtpInput
                value={otp}
                onChange={setOtp}
                length={otpLength}
                disabled={verifyingOtp}
              />

              <PrimaryButton
                label={verifyingOtp ? 'Verifying…' : 'Verify & Update Phone'}
                onPress={handleVerifyOtp}
                disabled={verifyingOtp || otp.length !== otpLength}
                style={{ marginTop: 20, opacity: verifyingOtp || otp.length !== otpLength ? 0.6 : 1 }}
              />

              <Pressable
                style={styles.resendBtn}
                disabled={resendSeconds > 0 || sendingOtp}
                onPress={() => {
                  lightHaptic();
                  void requestPhoneOtp(pendingPhone);
                }}
              >
                <Text
                  style={[
                    styles.resendText,
                    {
                      color:
                        resendSeconds > 0 || sendingOtp
                          ? colors.textTertiary
                          : colors.primary,
                    },
                  ]}
                >
                  {sendingOtp
                    ? 'Sending…'
                    : resendSeconds > 0
                      ? `Resend OTP in ${resendSeconds}s`
                      : 'Resend OTP'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.avatarBlock}>
                <Pressable onPress={openPicker} disabled={uploadingPhoto} style={styles.avatarWrap}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}>
                      <Text style={[styles.avatarInitial, { color: colors.link }]}>{initial}</Text>
                    </View>
                  )}
                  <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Feather name="camera" size={14} color="#fff" />
                    )}
                  </View>
                </Pressable>
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  Tap to update your profile photo
                </Text>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Email address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@business.com"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Phone number</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={phone}
                onChangeText={(v) => setPhone(digitsOnly(v))}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>
                Changing phone sends an OTP to the new number before it is saved.
              </Text>

              <PrimaryButton
                label={saving || sendingOtp ? 'Saving…' : 'Save Changes'}
                onPress={handleSave}
                disabled={saving || sendingOtp || uploadingPhoto}
                style={{
                  marginTop: 24,
                  opacity: saving || sendingOtp || uploadingPhoto ? 0.6 : 1,
                }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  content: { padding: 20 },
  avatarBlock: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontFamily: 'Inter_700Bold' },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  hint: { marginTop: 10, fontSize: 12, fontFamily: 'Inter_400Regular' },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  fieldHint: { marginTop: 8, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  otpBlock: { paddingTop: 24, alignItems: 'center' },
  otpTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  otpPhone: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 24 },
  resendBtn: { marginTop: 16, padding: 8 },
  resendText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
