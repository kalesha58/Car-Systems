import React from 'react';
import {
  Linking,
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

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.GSTInfo>;

const GST_ROWS = [
  { label: 'GST Number', value: '29ABCDE1234F1Z5' },
  { label: 'Business Name', value: 'Motonode Auto Hub Private Limited' },
  { label: 'Trade Name', value: 'Motonode Auto Hub' },
  { label: 'Registration Date', value: '15 Apr 2023' },
  { label: 'GST Type', value: 'Regular' },
  { label: 'Filing Frequency', value: 'Monthly' },
  { label: 'State', value: 'Karnataka (29)' },
];

export function GSTInfoScreen({ navigation }: Props) {
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
        <Text style={styles.headerTitle}>GST Information</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Purple Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerGstBox}>
            <Text style={styles.bannerGstText}>GST</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Goods and Services Tax</Text>
            <Text style={styles.bannerSubtitle}>Manage your GST details</Text>
          </View>
          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedPillText}>Verified</Text>
          </View>
        </View>

        {/* GST Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>GST Details</Text>
            <Pressable onPress={() => lightHaptic()} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>
          {GST_ROWS.map((row, idx) => (
            <View key={row.label}>
              <View style={styles.gstRow}>
                <Text style={styles.gstLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.gstValue,
                    row.label === 'GST Number' && styles.gstNumberStyle,
                  ]}
                  numberOfLines={2}
                >
                  {row.value}
                </Text>
              </View>
              {idx < GST_ROWS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* GST Certificate */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GST Certificate</Text>
          <View style={styles.documentRow}>
            <View style={styles.pdfIconBox}>
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.documentName}>GST Certificate</Text>
              <Text style={styles.documentDate}>Uploaded on 15 Apr 2023</Text>
            </View>
            <Pressable style={styles.downloadBtn} onPress={() => lightHaptic()}>
              <Feather name="download" size={16} color="#64748B" />
            </Pressable>
          </View>
        </View>

        {/* View GST Portal */}
        <Pressable
          style={styles.portalBtn}
          onPress={() => {
            lightHaptic();
            Linking.openURL('https://www.gst.gov.in').catch(() => {});
          }}
        >
          <Text style={styles.portalBtnText}>View GST Portal</Text>
          <Feather name="external-link" size={14} color={colors.icon} />
        </Pressable>
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
    backgroundColor: '#7C3AED', borderRadius: 16, padding: 20,
  },
  bannerGstBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  bannerGstText: { color: '#ffffff', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  bannerTitle: { color: '#ffffff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  verifiedPill: {
    backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedPillText: { color: '#ffffff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 4 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F2F2F2' },
  editBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary },
  gstRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  gstLabel: { fontSize: 12, color: '#64748B', fontFamily: 'Inter_400Regular', flex: 1 },
  gstValue: { fontSize: 12, color: '#1E293B', fontFamily: 'Inter_600SemiBold', textAlign: 'right', flex: 1 },
  gstNumberStyle: { fontFamily: 'Inter_700Bold', color: '#1E293B', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  pdfIconBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  pdfBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pdfBadgeText: { color: '#ffffff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  documentName: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  documentDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  downloadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  portalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#E60012',
  },
  portalBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary },
});
