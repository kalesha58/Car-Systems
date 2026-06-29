import React, { useState } from 'react';
import {
  Alert,
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

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { BusinessProfile } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
};

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.BusinessRegistration
>;

type Field = {
  key: keyof BusinessProfile;
  label: string;
  placeholder: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  required?: boolean;
};

const FIELDS: Field[] = [
  { key: 'businessName', label: 'Business Name', placeholder: 'e.g. Speed Auto Parts', required: true },
  { key: 'ownerName', label: 'Owner Name', placeholder: 'e.g. Rajesh Kumar', required: true },
  {
    key: 'mobile',
    label: 'Mobile Number',
    placeholder: '+91 98765 43210',
    keyboard: 'phone-pad',
    required: true,
  },
  {
    key: 'email',
    label: 'Email',
    placeholder: 'store@example.com',
    keyboard: 'email-address',
    required: true,
  },
  { key: 'gst', label: 'GST Number', placeholder: '22AAAAA0000A1Z5' },
  { key: 'address', label: 'Address', placeholder: 'Shop No, Street, Area' },
  { key: 'city', label: 'City', placeholder: 'Bengaluru', required: true },
  { key: 'state', label: 'State', placeholder: 'Karnataka', required: true },
  { key: 'pincode', label: 'Pincode', placeholder: '560001', keyboard: 'numeric', required: true },
  { key: 'upiId', label: 'UPI ID', placeholder: 'store@upi' },
  { key: 'bankName', label: 'Bank Name', placeholder: 'State Bank of India' },
  { key: 'accountNumber', label: 'Account Number', placeholder: 'XXXX XXXX XXXX', keyboard: 'numeric' },
  { key: 'ifsc', label: 'IFSC Code', placeholder: 'SBIN0001234' },
];

const EMPTY: BusinessProfile = {
  businessName: '',
  ownerName: '',
  mobile: '',
  email: '',
  gst: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  upiId: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  storeLogo: null,
  storeBanner: null,
};

export function RegistrationScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveBusinessProfile, completeRegistration, dealerType } = useDealer();
  const [form, setForm] = useState<BusinessProfile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const set = (key: keyof BusinessProfile, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const required = FIELDS.filter((f) => f.required);
    const missing = required.filter((f) => !form[f.key as keyof BusinessProfile]);
    if (missing.length > 0) {
      Alert.alert('Missing Fields', `Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    lightHaptic();
    setSaving(true);
    try {
      await saveBusinessProfile(form);
      await completeRegistration();
      navigation.replace(DealerStackRoutes.DealerTabs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View>
            <Text style={styles.title}>Business Registration</Text>
            <Text style={styles.subtitle}>{dealerType ?? 'Complete your profile'}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Information</Text>
            {FIELDS.slice(0, 5).map((field) => (
              <View key={field.key} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {field.label}
                  {field.required ? ' *' : ''}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType={field.keyboard ?? 'default'}
                  value={String(form[field.key] ?? '')}
                  onChangeText={(v) => set(field.key, v)}
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Location</Text>
            {FIELDS.slice(5, 9).map((field) => (
              <View key={field.key} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {field.label}
                  {field.required ? ' *' : ''}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType={field.keyboard ?? 'default'}
                  value={String(form[field.key] ?? '')}
                  onChangeText={(v) => set(field.key, v)}
                />
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bank & Payment</Text>
            {FIELDS.slice(9).map((field) => (
              <View key={field.key} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{field.label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType={field.keyboard ?? 'default'}
                  value={String(form[field.key] ?? '')}
                  onChangeText={(v) => set(field.key, v)}
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Store Media</Text>
            <Text style={[styles.mediaNote, { color: colors.textTertiary }]}>
              Upload your store logo and banner
            </Text>
            <View style={styles.mediaRow}>
              <Pressable
                style={[
                  styles.mediaBtn,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
                onPress={() => lightHaptic()}
              >
                <Feather name="image" size={24} color={colors.primary} />
                <Text style={[styles.mediaBtnLabel, { color: colors.textSecondary }]}>Store Logo</Text>
                <Text style={[styles.mediaBtnSub, { color: colors.textTertiary }]}>Tap to upload</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.mediaBtn,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
                onPress={() => lightHaptic()}
              >
                <Feather name="camera" size={24} color={colors.primary} />
                <Text style={[styles.mediaBtnLabel, { color: colors.textSecondary }]}>Store Banner</Text>
                <Text style={[styles.mediaBtnSub, { color: colors.textTertiary }]}>Tap to upload</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving…' : 'Complete Registration'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  content: { padding: 16, gap: 16 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  mediaNote: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4 },
  mediaRow: { flexDirection: 'row', gap: 12 },
  mediaBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    gap: 6,
  },
  mediaBtnLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  mediaBtnSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
