import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { PrimaryButton } from '@components/buttons';
import { useAuth } from '@context/index';
import { useToast } from '@context/ToastContext';
import { useColors } from '@hooks/useColors';
import { updateProfile } from '@services/profile.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { mapServerUserToAuthUser } from '@utils/mapAuthUser';
import { lightHaptic, successHaptic } from '@utils/haptics';

export function PersonalInformationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.name, user?.phone]);

  const handleSave = async () => {
    if (user?.isGuest) {
      Alert.alert('Guest account', 'Sign in to update your personal information.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit phone number.');
      return;
    }

    setSaving(true);
    lightHaptic();
    try {
      const updated = await updateProfile({
        name: trimmedName,
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      });
      const mapped = mapServerUserToAuthUser(updated);
      await updateUser({
        name: mapped.name,
        phone: mapped.phone,
        email: mapped.email,
        avatar: mapped.avatar,
        location: mapped.location,
        mobileVerified: mapped.mobileVerified,
      });
      successHaptic();
      showToast('Profile updated', 'success');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const initial = (name || user?.name || 'U').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarBlock}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}>
              <Text style={[styles.avatarInitial, { color: colors.link }]}>{initial}</Text>
            </View>
          )}
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Update your name and phone number used across Motonode.
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Full name</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          editable={!user?.isGuest}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputReadonly,
            { backgroundColor: colors.muted, borderColor: colors.border, color: colors.textSecondary },
          ]}
          value={user?.email ?? ''}
          editable={false}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
          ]}
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile number"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
          maxLength={10}
          editable={!user?.isGuest}
        />

        <View style={styles.footer}>
          {saving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <PrimaryButton label="Save changes" onPress={() => void handleSave()} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  content: { padding: 16 },
  avatarBlock: { alignItems: 'center', marginBottom: 24, gap: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
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
  inputReadonly: { opacity: 0.9 },
  footer: { marginTop: 28 },
});
