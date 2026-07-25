import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';
import { lightHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.BankDetails>;

const ACCOUNT_ROWS = [
  { label: 'Account Holder Name', value: 'Motonode Auto Hub Private Limited' },
  { label: 'Bank Name', value: 'HDFC Bank' },
  { label: 'Account Number', value: '50200012345678' },
  { label: 'IFSC Code', value: 'HDFC0001234' },
  { label: 'Branch', value: 'Koramangala, Bengaluru' },
  { label: 'Account Type', value: 'Current Account' },
];

export function BankDetailsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bank Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Blue Gradient Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Feather name="credit-card" size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Bank Account</Text>
            <Text style={styles.bannerSubtitle}>Manage your store bank account details</Text>
          </View>
          <View style={styles.bannerShieldBox}>
            <Feather name="shield" size={20} color="rgba(255,255,255,0.5)" />
          </View>
        </View>

        {/* Account Information */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account Information</Text>
            <Pressable onPress={() => lightHaptic()} style={[styles.editBtn, { backgroundColor: colors.background }]}>
              <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Edit</Text>
            </Pressable>
          </View>
          {ACCOUNT_ROWS.map((row, idx) => (
            <View key={row.label}>
              <View style={styles.accountRow}>
                <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                <Text style={[styles.accountValue, row.label === 'Account Number' && styles.monoText, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                  {row.value}
                </Text>
              </View>
              {idx < ACCOUNT_ROWS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}

          {/* Verified Banner */}
          <View style={[styles.verifiedBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.verifiedIconBox}>
              <Feather name="check-circle" size={16} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.verifiedTitle, { color: colors.textPrimary }]}>Account Verified</Text>
              <Text style={styles.verifiedSubtitle}>Your bank account has been verified successfully.</Text>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Documents</Text>
          <View style={styles.documentRow}>
            <View style={[styles.documentIconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="file-text" size={18} color={colors.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.documentName, { color: colors.textPrimary }]}>Cancelled Cheque</Text>
              <Text style={[styles.documentDate, { color: colors.textSecondary }]}>Uploaded on 12 Jan 2025</Text>
            </View>
            <Pressable style={styles.downloadBtn} onPress={() => lightHaptic()}>
              <Feather name="download" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 14, borderBottomWidth: 1, backgroundColor: '#ffffff',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  content: { padding: 16, gap: 14 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#E60012', borderRadius: 16, padding: 20,
    overflow: 'hidden',
  },
  bannerIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { color: '#ffffff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  bannerShieldBox: { opacity: 0.4 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 4 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F2F2F2' },
  editBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, gap: 12 },
  accountLabel: { fontSize: 12, color: '#64748B', fontFamily: 'Inter_400Regular' },
  accountValue: { fontSize: 12, color: '#1E293B', fontFamily: 'Inter_600SemiBold', textAlign: 'right', flex: 1 },
  monoText: { fontFamily: 'Inter_400Regular', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  verifiedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10,
    backgroundColor: '#ECFDF5', borderRadius: 10, padding: 12,
  },
  verifiedIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  verifiedTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#065F46' },
  verifiedSubtitle: { fontSize: 10, color: '#047857', marginTop: 1 },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  documentIconBox: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: '#F2F2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  documentName: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  documentDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  downloadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
});
