import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.StoreSettings>;

const BUSINESS_HOURS = [
  { days: 'Monday – Saturday', hours: '9:00 AM – 8:00 PM' },
  { days: 'Sunday', hours: '10:00 AM – 6:00 PM' },
];

const INFO_ROWS = [
  { icon: 'home', label: 'Store Name', value: 'Motonode Auto Hub' },
  { icon: 'truck', label: 'Store Type', value: 'Automotive Service Center' },
  { icon: 'mail', label: 'Business Email', value: 'info@motonode.com' },
  { icon: 'phone', label: 'Phone Number', value: '+91 98765 43210' },
  { icon: 'map-pin', label: 'Store Address', value: '80 Feet Rd, Koramangala 3 Block,\nBengaluru, Karnataka 560034' },
];

const SETTINGS_MENU = [
  { icon: 'credit-card', label: 'Bank Details', route: DealerStackRoutes.BankDetails, color: '#2563EB' },
  { icon: 'file-text', label: 'GST Information', route: DealerStackRoutes.GSTInfo, color: '#7C3AED' },
  { icon: 'smartphone', label: 'UPI Accounts', route: DealerStackRoutes.UPIAccounts, color: '#059669' },
  { icon: 'bell', label: 'Notification Settings', route: DealerStackRoutes.NotificationSettings, color: '#F59E0B' },
];

export function StoreSettingsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: '#E2E8F0' }]}>
        <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
          <Feather name="arrow-left" size={20} color="#1E293B" />
        </Pressable>
        <Text style={styles.headerTitle}>Store Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Identity Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeCardTop}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=120&auto=format&fit=crop&q=80' }}
              style={styles.storePhoto}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.storeNameRow}>
                <Text style={styles.storeName}>Motonode Auto Hub</Text>
                <View style={styles.dmcBadge}><Text style={styles.dmcBadgeText}>DMC</Text></View>
                <View style={styles.verifiedBadge}>
                  <Feather name="check-circle" size={10} color="#2563EB" />
                  <Text style={styles.verifiedBadgeText}>Verified</Text>
                </View>
              </View>
              <View style={styles.storeRatingRow}>
                <Feather name="star" size={11} color="#F59E0B" />
                <Text style={styles.storeRating}>4.6</Text>
                <Text style={styles.storeReviews}>(512 Reviews)</Text>
              </View>
              <Text style={styles.storeAddress}>80 Feet Rd, Koramangala 3 Block,{'\n'}Bengaluru, Karnataka 560034</Text>
            </View>
          </View>
        </View>

        {/* Store Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Store Information</Text>
            <Pressable onPress={() => lightHaptic()} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>
          {INFO_ROWS.map((row, idx) => (
            <View key={row.label}>
              <Pressable style={styles.infoRow} onPress={() => lightHaptic()}>
                <View style={styles.infoIconBox}>
                  <Feather name={row.icon as any} size={14} color="#64748B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#CBD5E1" />
              </Pressable>
              {idx < INFO_ROWS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Business Hours */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Hours</Text>
            <Pressable onPress={() => lightHaptic()} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>
          {BUSINESS_HOURS.map((bh, idx) => (
            <View key={bh.days}>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{bh.days}</Text>
                <Text style={styles.hoursTime}>{bh.hours}</Text>
              </View>
              {idx < BUSINESS_HOURS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Store Description */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Store Description</Text>
            <Pressable onPress={() => lightHaptic()} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>
          <Text style={styles.descriptionText}>
            We provide expert car services, repairs, and maintenance with quality assurance and genuine parts.
          </Text>
        </View>

        {/* Settings Links */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Billing & Notifications</Text>
          {SETTINGS_MENU.map((item, idx) => (
            <View key={item.label}>
              <Pressable
                style={styles.settingsRow}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate(item.route as any);
                }}
              >
                <View style={[styles.settingsIconBox, { backgroundColor: item.color + '15' }]}>
                  <Feather name={item.icon as any} size={15} color={item.color} />
                </View>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color="#CBD5E1" />
              </Pressable>
              {idx < SETTINGS_MENU.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
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
  storeCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  storeCardTop: { flexDirection: 'row', gap: 12 },
  storePhoto: { width: 68, height: 68, borderRadius: 12, backgroundColor: '#E2E8F0' },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  storeName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  dmcBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  dmcBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#2563EB' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  verifiedBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#2563EB' },
  storeRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  storeRating: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#F59E0B' },
  storeReviews: { fontSize: 11, color: '#64748B', fontFamily: 'Inter_400Regular' },
  storeAddress: { fontSize: 11, color: '#64748B', fontFamily: 'Inter_400Regular', lineHeight: 16 },
  sectionCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EFF6FF' },
  editBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#2563EB' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 10, color: '#94A3B8', fontFamily: 'Inter_500Medium', marginBottom: 2 },
  infoValue: { fontSize: 13, color: '#1E293B', fontFamily: 'Inter_500Medium' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 2 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  hoursDay: { fontSize: 12, color: '#475569', fontFamily: 'Inter_500Medium' },
  hoursTime: { fontSize: 12, color: '#1E293B', fontFamily: 'Inter_700Bold' },
  descriptionText: { fontSize: 12, color: '#64748B', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  settingsIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, fontSize: 13, color: '#1E293B', fontFamily: 'Inter_600SemiBold' },
});
