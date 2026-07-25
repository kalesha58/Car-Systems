import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { ChromeHeader } from '@components/common';
import { DealerBankSkeleton } from '@components/loaders';
import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';
import { lightHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import { useAuth, useDealer } from '@context/index';
import { getBusinessRegistrationByUserId } from '@services/dealer.service';
import type { IBusinessRegistration } from '@app-types/dealer';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.GSTInfo>;

const GST_OPTIONAL_TYPES = ['Mechanic Workshop', 'Vehicle Wash Station', 'Battery Dealer'];

export function GSTInfoScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { businessProfile, dealerType } = useDealer();
  const [registration, setRegistration] = useState<IBusinessRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const loadRegistration = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setRegistration(await getBusinessRegistrationByUserId(user.id));
    } catch {
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadRegistration();
    }, [loadRegistration]),
  );

  const businessType = registration?.type || dealerType;
  const isGstOptional = GST_OPTIONAL_TYPES.includes(businessType ?? '');

  const gst = (registration?.gst || businessProfile?.gst || '').trim();
  const hasGst = !!gst;
  const isApproved = (registration?.status ?? '').toLowerCase() === 'approved';
  const gstDocument = registration?.documents?.find(doc => doc.kind === 'GST');

  const GST_ROWS = [
    { label: 'GST Number', value: gst || '—' },
    {
      label: 'Business Name',
      value: registration?.businessName || businessProfile?.businessName || '—',
    },
    {
      label: 'Owner Name',
      value:
        registration?.payout?.bank?.accountName || businessProfile?.ownerName || user?.name || '—',
    },
    {
      label: 'Established Year',
      value: registration?.establishedYear
        ? String(registration.establishedYear)
        : businessProfile?.establishedYear || '—',
    },
    { label: 'State', value: registration?.state || businessProfile?.state || '—' },
    { label: 'City', value: registration?.city || businessProfile?.city || '—' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>GST Information</Text>
          <View style={styles.headerBtn} />
        </View>
      </ChromeHeader>

      {loading ? (
        <DealerBankSkeleton />
      ) : (
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {hasGst ? (
          <>
            {/* Purple Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerGstBox}>
                <Text style={styles.bannerGstText}>GST</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Goods and Services Tax</Text>
                <Text style={styles.bannerSubtitle}>Manage your GST details</Text>
              </View>
              <View style={[styles.verifiedPill, !isApproved && { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.verifiedPillText}>{isApproved ? 'Verified' : 'Pending'}</Text>
              </View>
            </View>

            {/* GST Details */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>GST Details</Text>
                <Pressable
                  onPress={() => {
                    lightHaptic();
                    navigation.navigate(DealerStackRoutes.BusinessRegistration, { mode: 'edit' });
                  }}
                  style={[styles.editBtn, { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Edit</Text>
                </Pressable>
              </View>
              {GST_ROWS.map((row, idx) => (
                <View key={row.label}>
                  <View style={styles.gstRow}>
                    <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                    <Text
                      style={[
                        styles.gstValue,
                        row.label === 'GST Number' && styles.gstNumberStyle,
                        { color: colors.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {row.value}
                    </Text>
                  </View>
                  {idx < GST_ROWS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </View>

            {/* GST Certificate */}
            {gstDocument ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>GST Certificate</Text>
                <View style={styles.documentRow}>
                  <View style={[styles.pdfIconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.pdfBadge}>
                      <Text style={styles.pdfBadgeText}>PDF</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.documentName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {gstDocument.originalName || 'GST Certificate'}
                    </Text>
                    <Text style={[styles.documentDate, { color: colors.textSecondary }]}>
                      {isApproved ? 'Uploaded and Verified' : 'Uploaded — pending verification'}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.downloadBtn}
                    onPress={() => {
                      lightHaptic();
                      if (gstDocument.url) {
                        Linking.openURL(gstDocument.url).catch(() => {});
                      }
                    }}
                  >
                    <Feather name="download" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <>
            {/* Gray/Optional Banner */}
            <View style={[styles.banner, { backgroundColor: '#64748B' }]}>
              <View style={styles.bannerGstBox}>
                <Text style={styles.bannerGstText}>GST</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Goods and Services Tax</Text>
                <Text style={styles.bannerSubtitle}>
                  {isGstOptional ? 'GST is optional for your business' : 'GST is required for your business'}
                </Text>
              </View>
              <View style={[styles.verifiedPill, { backgroundColor: '#94A3B8' }]}>
                <Text style={styles.verifiedPillText}>Not Added</Text>
              </View>
            </View>

            {/* Empty/Optional State Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', padding: 24, gap: 12 }]}>
              <Feather name="info" size={32} color={colors.textTertiary} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary, textAlign: 'center', fontSize: 15 }]}>No GST Details Added</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                {isGstOptional
                  ? `Your business type (${businessType ?? 'Dealer'}) does not require GST to operate. If you wish to register your GST details for billing or tax filings, you can update them anytime.`
                  : `Your business type (${businessType ?? 'Dealer'}) requires a GST number. Add your GST details to enable billing and tax filings.`}
              </Text>
              <Pressable
                onPress={() => {
                  lightHaptic();
                  navigation.navigate(DealerStackRoutes.BusinessRegistration, { mode: 'edit' });
                }}
                style={[styles.editBtn, { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 }]}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_700Bold' }}>Add GST Details</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* View GST Portal */}
        <Pressable
          style={[styles.portalBtn, { backgroundColor: colors.background }]}
          onPress={() => {
            lightHaptic();
            Linking.openURL('https://www.gst.gov.in').catch(() => {});
          }}
        >
          <Text style={[styles.portalBtnText, { color: colors.textPrimary }]}>View GST Portal</Text>
          <Feather name="external-link" size={14} color={colors.icon} />
        </Pressable>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
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
