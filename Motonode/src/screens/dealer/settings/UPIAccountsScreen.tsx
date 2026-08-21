import React, { useState } from 'react';
import {
  Alert,
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

import { ChromeHeader } from '@components/common';
import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.UPIAccounts>;

type UpiAccount = {
  id: string;
  upiId: string;
  appName: string;
  appColor: string;
  appInitial: string;
  isPrimary: boolean;
  isActive: boolean;
};

const INITIAL_ACCOUNTS: UpiAccount[] = [
  { id: '1', upiId: 'motonodehub@okicici', appName: 'Google Pay', appColor: '#4285F4', appInitial: 'G', isPrimary: true, isActive: true },
  { id: '2', upiId: 'motonodehub@ybl', appName: 'PhonePe', appColor: '#5F259F', appInitial: 'P', isPrimary: false, isActive: true },
  { id: '3', upiId: 'motonodehub@paytm', appName: 'Paytm', appColor: '#00BAF2', appInitial: 'Pt', isPrimary: false, isActive: true },
];

// Simple colored circle avatar for each UPI app
function UpiAvatar({ initial, color }: { initial: string; color: string }) {
  return (
    <View style={[styles.upiAvatar, { backgroundColor: color }]}>
      <Text style={styles.upiAvatarText}>{initial}</Text>
    </View>
  );
}

export function UPIAccountsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);

  const handleMenu = (account: UpiAccount) => {
    Alert.alert(account.upiId, 'Choose an action', [
      {
        text: account.isPrimary ? 'Already Primary' : 'Set as Primary',
        onPress: () => {
          if (!account.isPrimary) {
            setAccounts((prev) => prev.map((a) => ({ ...a, isPrimary: a.id === account.id })));
          }
        },
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setAccounts((prev) => prev.filter((a) => a.id !== account.id)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>UPI Accounts</Text>
          <View style={styles.headerBtn} />
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Purple UPI Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerUpiBox}>
            <Text style={styles.bannerUpiText}>UPI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>UPI Payment Accounts</Text>
            <Text style={styles.bannerSubtitle}>Manage your UPI IDs for payments</Text>
          </View>
          <View style={styles.qrBox}>
            {/* Simple QR-like grid decoration */}
            <View style={styles.qrGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrDot,
                    { backgroundColor: [0, 2, 4, 6, 8].includes(i) ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* UPI IDs Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>UPI IDs</Text>
            <Pressable
              style={[styles.addNewBtn, { backgroundColor: colors.background }]}
              onPress={() => {
                lightHaptic();
                Alert.alert('Add UPI', 'Enter your UPI ID to add a new payment account.');
              }}
            >
              <Feather name="plus" size={12} color={colors.icon} />
              <Text style={[styles.addNewText, { color: colors.textSecondary }]}>Add New</Text>
            </Pressable>
          </View>

          {accounts.map((account, idx) => (
            <View key={account.id}>
              <View style={styles.upiRow}>
                <UpiAvatar initial={account.appInitial} color={account.appColor} />
                <View style={{ flex: 1 }}>
                  <View style={styles.upiTopRow}>
                    <Text style={[styles.upiId, { color: colors.textPrimary }]}>{account.upiId}</Text>
                    {account.isPrimary && (
                      <View style={[styles.primaryBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.primaryBadgeText, { color: colors.textSecondary }]}>Primary</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.upiAppName}>{account.appName}</Text>
                </View>
                <View style={styles.upiRightCol}>
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                  <Pressable style={styles.menuBtn} onPress={() => { lightHaptic(); handleMenu(account); }}>
                    <Feather name="more-vertical" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
              {idx < accounts.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Info note */}
        <View style={[styles.infoNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.textSecondary} />
          <Text style={[styles.infoNoteText, { color: colors.textSecondary }]}>
            Payments from customers will be settled to your Primary UPI ID within 2 business days.
          </Text>
        </View>
      </ScrollView>
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
  content: { padding: 16, gap: 14 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#4F46E5', borderRadius: 16, padding: 20, overflow: 'hidden',
  },
  bannerUpiBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  bannerUpiText: { color: '#ffffff', fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  bannerTitle: { color: '#ffffff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  qrBox: { alignItems: 'center', justifyContent: 'center' },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 33, gap: 2 },
  qrDot: { width: 9, height: 9, borderRadius: 2 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F2F2F2' },
  addNewText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  upiRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  upiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  upiAvatarText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  upiTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  upiId: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#1E293B' },
  primaryBadge: { backgroundColor: '#F2F2F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  primaryBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  upiAppName: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontFamily: 'Inter_400Regular' },
  upiRightCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activePillText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#10B981' },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  infoNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  infoNoteText: { flex: 1, fontSize: 11, color: '#64748B', fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
