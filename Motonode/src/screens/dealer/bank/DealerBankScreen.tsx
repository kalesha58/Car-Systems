import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { ChromeHeader } from '@components/common';
import { DealerBankSkeleton } from '@components/loaders';
import { useAuth, useDealer } from '@context/index';
import { useColors } from '@hooks/useColors';
import { getBusinessRegistrationByUserId } from '@services/dealer.service';
import {
  hasBankPayoutDetails,
  mapRegistrationToPayoutData,
  type DealerBankAccount,
  type DealerUpiAccount,
} from '@utils/dealerPayoutMapper';
import { lightHaptic } from '@utils/haptics';

const DEFAULT_BANK: DealerBankAccount = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branch: '',
  accountType: 'Current Account',
  verified: false,
};

function UpiAvatar({ initial, color }: { initial: string; color: string }) {
  return (
    <View style={[styles.upiAvatar, { backgroundColor: color }]}>
      <Text style={styles.upiAvatarText}>{initial}</Text>
    </View>
  );
}

export function DealerBankScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { user } = useAuth();
  const { businessProfile } = useDealer();

  const [loading, setLoading] = useState(true);
  const [bankAccount, setBankAccount] = useState<DealerBankAccount>(DEFAULT_BANK);
  const [upiAccounts, setUpiAccounts] = useState<DealerUpiAccount[]>([]);
  const [editingBank, setEditingBank] = useState(false);
  const [bankDraft, setBankDraft] = useState<DealerBankAccount>(DEFAULT_BANK);
  const [showUpiForm, setShowUpiForm] = useState(false);
  const [upiDraft, setUpiDraft] = useState('');

  const loadPayoutDetails = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const registration = await getBusinessRegistrationByUserId(user.id);
      const { bank, upiAccounts: registrationUpi } = mapRegistrationToPayoutData(
        registration,
        businessProfile,
      );

      setBankAccount((prev) => {
        if (hasBankPayoutDetails(prev)) return prev;
        return hasBankPayoutDetails(bank) ? bank : prev;
      });

      setUpiAccounts((prev) => {
        if (prev.length > 0) return prev;
        return registrationUpi;
      });
    } catch {
      const { bank, upiAccounts: profileUpi } = mapRegistrationToPayoutData(null, businessProfile);
      setBankAccount((prev) => {
        if (hasBankPayoutDetails(prev)) return prev;
        return hasBankPayoutDetails(bank) ? bank : prev;
      });
      setUpiAccounts((prev) => (prev.length > 0 ? prev : profileUpi));
    } finally {
      setLoading(false);
    }
  }, [user?.id, businessProfile]);

  useFocusEffect(
    useCallback(() => {
      void loadPayoutDetails();
    }, [loadPayoutDetails]),
  );

  const hasBankAccount = hasBankPayoutDetails(bankAccount);

  const handleEditBank = () => {
    lightHaptic();
    setBankDraft(hasBankAccount ? bankAccount : DEFAULT_BANK);
    setEditingBank(true);
  };

  const handleSaveBank = () => {
    if (!bankDraft.accountHolderName.trim() || !bankDraft.bankName.trim()) {
      Alert.alert('Missing details', 'Please enter account holder name and bank name.');
      return;
    }
    if (!bankDraft.accountNumber.trim() || !bankDraft.ifscCode.trim()) {
      Alert.alert('Missing details', 'Please enter account number and IFSC code.');
      return;
    }

    setBankAccount({
      ...bankDraft,
      accountHolderName: bankDraft.accountHolderName.trim(),
      bankName: bankDraft.bankName.trim(),
      accountNumber: bankDraft.accountNumber.trim(),
      ifscCode: bankDraft.ifscCode.trim().toUpperCase(),
      branch: bankDraft.branch.trim(),
      verified: false,
    });
    setEditingBank(false);
    lightHaptic();
    Alert.alert('Saved', 'Bank account details saved. Verification may take 1–2 business days.');
  };

  const handleAddUpi = () => {
    lightHaptic();
    setUpiDraft('');
    setShowUpiForm(true);
  };

  const handleSaveUpi = () => {
    const upiId = upiDraft.trim();
    if (!upiId) {
      Alert.alert('Missing UPI ID', 'Please enter a valid UPI ID.');
      return;
    }

    const newAccount: DealerUpiAccount = {
      id: `${Date.now()}`,
      upiId,
      appName: 'UPI',
      appColor: '#4F46E5',
      appInitial: upiId[0]?.toUpperCase() || 'U',
      isPrimary: upiAccounts.length === 0,
    };
    setUpiAccounts((prev) => [...prev, newAccount]);
    setShowUpiForm(false);
    setUpiDraft('');
    lightHaptic();
  };

  const handleUpiMenu = (account: DealerUpiAccount) => {
    Alert.alert(account.upiId, 'Choose an action', [
      {
        text: account.isPrimary ? 'Already Primary' : 'Set as Primary',
        onPress: () => {
          if (!account.isPrimary) {
            setUpiAccounts((prev) => prev.map((a) => ({ ...a, isPrimary: a.id === account.id })));
          }
        },
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setUpiAccounts((prev) => prev.filter((a) => a.id !== account.id)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={12}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Bank & Payments</Text>
            <Text style={styles.headerSubtitle}>Payout accounts & UPI details</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Feather name="credit-card" size={20} color={colors.headerForeground} />
          </View>
        </View>
      </ChromeHeader>

      {loading ? (
        <DealerBankSkeleton />
      ) : (
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Feather name="credit-card" size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Settlement Account</Text>
            <Text style={styles.bannerSubtitle}>Order payouts are sent to your linked bank account</Text>
          </View>
        </View>

        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Bank Account</Text>
            <Pressable onPress={handleEditBank} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
              <Feather name={hasBankAccount ? 'edit-2' : 'plus'} size={12} color={colors.icon} />
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
                {hasBankAccount ? 'Edit' : 'Add'}
              </Text>
            </Pressable>
          </View>

          {editingBank ? (
            <View style={styles.form}>
              {(
                [
                  ['accountHolderName', 'Account Holder Name'],
                  ['bankName', 'Bank Name'],
                  ['accountNumber', 'Account Number'],
                  ['ifscCode', 'IFSC Code'],
                  ['branch', 'Branch'],
                  ['accountType', 'Account Type'],
                ] as const
              ).map(([key, label]) => (
                <View key={key} style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <TextInput
                    style={[styles.fieldInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
                    value={bankDraft[key]}
                    onChangeText={(text) => setBankDraft((prev) => ({ ...prev, [key]: text }))}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize={key === 'ifscCode' ? 'characters' : 'words'}
                    keyboardType={key === 'accountNumber' ? 'number-pad' : 'default'}
                  />
                </View>
              ))}
              <View style={styles.formActions}>
                <Pressable
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  onPress={() => setEditingBank(false)}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={handleSaveBank}>
                  <Text style={styles.primaryBtnText}>Save Account</Text>
                </Pressable>
              </View>
            </View>
          ) : hasBankAccount ? (
            <>
              {(
                [
                  ['Account Holder', bankAccount.accountHolderName],
                  ['Bank Name', bankAccount.bankName],
                  ['Account Number', bankAccount.accountNumber],
                  ['IFSC Code', bankAccount.ifscCode],
                  ['Branch', bankAccount.branch || '—'],
                  ['Account Type', bankAccount.accountType],
                ] as const
              ).map(([label, value], idx, arr) => (
                <View key={label}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                      {value}
                    </Text>
                  </View>
                  {idx < arr.length - 1 ? <View style={[styles.divider, { backgroundColor: colors.divider }]} /> : null}
                </View>
              ))}
              {bankAccount.verified ? (
                <View style={styles.verifiedBanner}>
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text style={styles.verifiedText}>Account verified</Text>
                </View>
              ) : (
                <View style={styles.pendingBanner}>
                  <Feather name="clock" size={16} color="#F59E0B" />
                  <Text style={styles.pendingText}>Verification pending</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyBlock}>
              <Feather name="credit-card" size={28} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No bank account added</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Add your bank account to receive order payouts.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>UPI Accounts</Text>
            <Pressable onPress={handleAddUpi} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
              <Feather name="plus" size={12} color={colors.icon} />
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Add UPI</Text>
            </Pressable>
          </View>

          {upiAccounts.length === 0 && !showUpiForm ? (
            <View style={styles.emptyBlock}>
              <Feather name="smartphone" size={28} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No UPI IDs added</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Add a UPI ID for faster customer payments and settlements.
              </Text>
            </View>
          ) : null}

          {showUpiForm ? (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>UPI ID</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
                  value={upiDraft}
                  onChangeText={setUpiDraft}
                  placeholder="e.g. name@okicici"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.formActions}>
                <Pressable
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  onPress={() => setShowUpiForm(false)}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={handleSaveUpi}>
                  <Text style={styles.primaryBtnText}>Add UPI</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {!showUpiForm
            ? upiAccounts.map((account, idx) => (
              <View key={account.id}>
                <View style={styles.upiRow}>
                  <UpiAvatar initial={account.appInitial} color={account.appColor} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.upiTopRow}>
                      <Text style={[styles.upiId, { color: colors.textPrimary }]}>{account.upiId}</Text>
                      {account.isPrimary ? (
                        <View style={[styles.primaryBadge, { backgroundColor: colors.muted }]}>
                          <Text style={[styles.primaryBadgeText, { color: colors.textSecondary }]}>Primary</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.upiAppName, { color: colors.textTertiary }]}>{account.appName}</Text>
                  </View>
                  <Pressable style={styles.menuBtn} onPress={() => { lightHaptic(); handleUpiMenu(account); }}>
                    <Feather name="more-vertical" size={16} color={colors.textTertiary} />
                  </Pressable>
                </View>
                {idx < upiAccounts.length - 1 ? <View style={[styles.divider, { backgroundColor: colors.divider }]} /> : null}
              </View>
            ))
            : null}
        </View>

        <View style={[styles.infoNote, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="shield" size={14} color={colors.textSecondary} />
          <Text style={[styles.infoNoteText, { color: colors.textSecondary }]}>
            Your bank and UPI details are encrypted and used only for order settlements and payouts.
          </Text>
        </View>
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 14 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#E60012',
    borderRadius: 16,
    padding: 18,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { color: '#ffffff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 11, marginTop: 2, lineHeight: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  infoLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  infoValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'right', flex: 1 },
  divider: { height: 1 },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 10,
  },
  verifiedText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#065F46' },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
  },
  pendingText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#92400E' },
  emptyBlock: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  emptySubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 },
  form: { gap: 10, marginTop: 4 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E60012',
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  upiRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  upiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  upiAvatarText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  upiTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  upiId: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  primaryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  primaryBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  upiAppName: { fontSize: 10, marginTop: 2, fontFamily: 'Inter_400Regular' },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  infoNoteText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
