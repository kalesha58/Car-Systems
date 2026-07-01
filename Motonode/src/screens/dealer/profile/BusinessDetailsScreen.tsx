import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { DealerStackRoutes } from '@constants/routes';
import { useAuth, useDealer } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import {
  getBusinessRegistrationByUserId,
  getDealerServices,
} from '@services/dealer.service';
import { getDealerOrderStats } from '@services/order.service';
import type { IBusinessRegistration, IBusinessRegistrationDocumentFile } from '@app-types/dealer';
import type { BusinessProfile } from '@data/dealerData';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.BusinessDetails>;

const DOC_META: Record<
  IBusinessRegistrationDocumentFile['kind'],
  { label: string; color: string; bg: string; icon: string }
> = {
  GST: { label: 'GST Certificate', color: '#10B981', bg: '#ECFDF5', icon: 'file-text' },
  PAN: { label: 'PAN Card', color: '#8B5CF6', bg: '#F5F3FF', icon: 'credit-card' },
  LICENSE: { label: 'Trade License', color: '#3B82F6', bg: '#EFF6FF', icon: 'award' },
  ID: { label: 'Identity Document', color: '#F59E0B', bg: '#FFFBEB', icon: 'user' },
};

function yearsInBusiness(createdAt?: string): string {
  if (!createdAt) return '—';
  const years = Math.max(1, new Date().getFullYear() - new Date(createdAt).getFullYear());
  return `${years} Yr${years > 1 ? 's' : ''}`;
}

function SectionCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionCardHeader}>
        <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>{title}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit} style={styles.editBtn}>
            <Feather name="edit-2" size={12} color="#E60012" style={{ marginRight: 4 }} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function InfoField({
  icon,
  label,
  value,
  fullWidth,
  link,
}: {
  icon: string;
  label: string;
  value: string;
  fullWidth?: boolean;
  link?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.infoField, fullWidth && styles.infoFieldFull]}>
      <View style={styles.infoFieldLabelRow}>
        <Feather name={icon as 'home'} size={12} color={colors.textTertiary} />
        <Text style={[styles.infoFieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text
        style={[
          styles.infoFieldValue,
          { color: link ? '#2563EB' : colors.textPrimary },
        ]}
        numberOfLines={fullWidth ? 3 : 2}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

export function BusinessDetailsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { businessProfile, dealerType } = useDealer();
  const [registration, setRegistration] = useState<IBusinessRegistration | null>(null);
  const [serviceCount, setServiceCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const loadDetails = useCallback(async () => {
    if (!user?.id) {
      console.log('[BusinessDetails] No user.id found');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log('[BusinessDetails] Fetching registration for user.id:', user.id);
      const [reg, servicesRes, orderStats] = await Promise.all([
        getBusinessRegistrationByUserId(user.id),
        getDealerServices({ limit: 1 }).catch((err) => {
          console.warn('[BusinessDetails] Failed to load services:', err);
          return null;
        }),
        getDealerOrderStats().catch((err) => {
          console.warn('[BusinessDetails] Failed to load order stats:', err);
          return null;
        }),
      ]);
      console.log('[BusinessDetails] Registration result:', reg);
      setRegistration(reg);
      setServiceCount(servicesRes?.Response?.pagination?.total ?? servicesRes?.Response?.services?.length ?? 0);
      setCustomerCount(orderStats?.total ?? 0);
    } catch (err) {
      console.error('[BusinessDetails] Error loading details:', err);
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadDetails();
    }, [loadDetails]),
  );

  const profile: BusinessProfile | null = businessProfile;
  const status = registration?.status?.toLowerCase() ?? 'pending';
  const isVerified = status === 'approved';

  const coverImage =
    registration?.coverPhoto ||
    registration?.shopPhotos?.[0]?.url ||
    profile?.storeBanner ||
    profile?.storeLogo ||
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&auto=format&fit=crop&q=80';

  const galleryImages = useMemo(() => {
    const urls = new Set<string>();
    if (registration?.coverPhoto) urls.add(registration.coverPhoto);
    registration?.shopPhotos?.forEach((p) => urls.add(p.url));
    if (profile?.storeBanner) urls.add(profile.storeBanner);
    return Array.from(urls);
  }, [registration, profile?.storeBanner]);

  const fullAddress =
    profile?.address && profile?.city
      ? `${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`
      : registration?.address || '—';

  const handleEdit = () => {
    lightHaptic();
    Alert.alert(
      'Edit Business Details',
      'Update your business registration information.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => navigation.navigate(DealerStackRoutes.BusinessRegistration),
        },
      ],
    );
  };

  const statusBadgeStyle =
    status === 'approved'
      ? { bg: '#ECFDF5', color: '#10B981', label: 'Verified' }
      : status === 'rejected'
        ? { bg: '#FEF2F2', color: '#EF4444', label: 'Rejected' }
        : { bg: '#FFFBEB', color: '#F59E0B', label: 'Pending' };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader contentPad={8}>
          <View style={styles.headerRow}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={22} color={colors.headerForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Business Details</Text>
            <View style={styles.headerBtn} />
          </View>
        </ChromeHeader>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#E60012" />
        </View>
      </View>
    );
  }

  if (!registration && !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader contentPad={8}>
          <View style={styles.headerRow}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={22} color={colors.headerForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Business Details</Text>
            <View style={styles.headerBtn} />
          </View>
        </ChromeHeader>
        <View style={styles.emptyWrap}>
          <Feather name="file-text" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No registration found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Complete business registration to view your details here.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate(DealerStackRoutes.BusinessRegistration)}
          >
            <Text style={styles.primaryBtnText}>Complete Registration</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Business Details</Text>
          <Pressable style={styles.headerBtn} onPress={handleEdit}>
            <Feather name="more-horizontal" size={22} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero summary card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statusPill, { backgroundColor: statusBadgeStyle.bg }]}>
            <Text style={[styles.statusPillText, { color: statusBadgeStyle.color }]}>{statusBadgeStyle.label}</Text>
          </View>

          <View style={styles.heroTopRow}>
            <Image source={{ uri: coverImage }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={[styles.heroName, { color: colors.textPrimary }]}>
                  {registration?.businessName || profile?.businessName || 'Your Business'}
                </Text>
                {isVerified ? <Feather name="check-circle" size={16} color="#E60012" /> : null}
              </View>
              <Text style={[styles.heroType, { color: colors.textSecondary }]}>
                {registration?.type || dealerType || 'Automobile Showroom'}
              </Text>
              <View style={styles.heroContactRow}>
                <Feather name="map-pin" size={12} color={colors.textTertiary} />
                <Text style={[styles.heroContactText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {fullAddress}
                </Text>
              </View>
              <View style={styles.heroContactRow}>
                <Feather name="phone" size={12} color={colors.textTertiary} />
                <Text style={[styles.heroContactText, { color: colors.textSecondary }]}>
                  {registration?.phone || profile?.mobile || '—'}
                </Text>
              </View>
              <View style={styles.heroContactRow}>
                <Feather name="mail" size={12} color={colors.textTertiary} />
                <Text style={[styles.heroContactText, { color: colors.textSecondary }]}>
                  {profile?.email || user?.email || '—'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            {[
              { label: 'Total Services', value: String(serviceCount), icon: 'briefcase', color: '#E60012', bg: '#FEF2F2' },
              { label: 'Avg. Rating', value: '4.7', icon: 'star', color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Total Orders', value: customerCount >= 1000 ? `${(customerCount / 1000).toFixed(1)}K` : String(customerCount), icon: 'users', color: '#3B82F6', bg: '#EFF6FF' },
              { label: 'In Business', value: yearsInBusiness(registration?.establishedYear ? `${registration.establishedYear}-01-01` : registration?.createdAt), icon: 'calendar', color: '#10B981', bg: '#ECFDF5' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                  <Feather name={stat.icon as 'star'} size={14} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Business information */}
        <SectionCard title="Business Information" onEdit={handleEdit}>
          <View style={styles.infoGrid}>
            <InfoField icon="home" label="Business Name" value={registration?.businessName || profile?.businessName || user?.name || ''} />
            <InfoField icon="layers" label="Business Type" value={registration?.type || dealerType || ''} />
            <InfoField icon="user" label="Owner Name" value={registration?.payout?.bank?.accountName || profile?.ownerName || user?.name || ''} />
            <InfoField icon="file-text" label="GST Number" value={registration?.gst || profile?.gst || ''} />
            <InfoField icon="hash" label="Registration No." value={registration?.registrationNumber || profile?.registrationNumber || ''} />
            <InfoField
              icon="calendar"
              label="Established"
              value={
                registration?.establishedYear
                  ? String(registration.establishedYear)
                  : profile?.establishedYear || ''
              }
            />
            <InfoField icon="phone" label="Phone Number" value={registration?.phone || profile?.mobile || user?.phone || ''} />
            <InfoField icon="phone" label="Alternate Number" value="—" />
            <InfoField icon="mail" label="Email Address" value={profile?.email || user?.email || ''} />
            <InfoField
              icon="globe"
              label="Website"
              value={registration?.website || profile?.website || ''}
              link={!!(registration?.website || profile?.website)}
            />
            <InfoField icon="map-pin" label="Business Address" value={fullAddress} fullWidth />
          </View>
        </SectionCard>

        {/* Business images */}
        {galleryImages.length > 0 ? (
          <SectionCard title="Business Images" onEdit={handleEdit}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
              {galleryImages.slice(0, 5).map((url, index) => {
                const isCover = index === 0;
                const isMore = index === 4 && galleryImages.length > 5;
                return (
                  <Pressable
                    key={`${url}-${index}`}
                    style={styles.galleryThumb}
                    onPress={() => void Linking.openURL(url)}
                  >
                    <Image source={{ uri: url }} style={styles.galleryImage} resizeMode="cover" />
                    {isCover ? (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    ) : null}
                    {isMore ? (
                      <View style={styles.moreOverlay}>
                        <Text style={styles.moreOverlayText}>+{galleryImages.length - 4}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </SectionCard>
        ) : null}

        {/* Documents */}
        {(registration?.documents?.length ?? 0) > 0 ? (
          <SectionCard title="Documents" onEdit={handleEdit}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docsRow}>
              {registration!.documents!.map((doc, index) => {
                const meta = DOC_META[doc.kind] ?? DOC_META.GST;
                return (
                  <Pressable
                    key={`${doc.kind}-${index}`}
                    style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => doc.url && void Linking.openURL(doc.url)}
                  >
                    <View style={[styles.docIconBox, { backgroundColor: meta.bg }]}>
                      <Feather name={meta.icon as 'file-text'} size={22} color={meta.color} />
                    </View>
                    <Text style={[styles.docTitle, { color: colors.textPrimary }]}>{meta.label}</Text>
                    <View style={styles.docVerifiedRow}>
                      <Feather name="check-circle" size={11} color="#10B981" />
                      <Text style={styles.docVerifiedText}>Verified</Text>
                    </View>
                    <Text style={[styles.docId, { color: colors.textSecondary }]} numberOfLines={1}>
                      {doc.originalName || `${doc.kind} Document`}
                    </Text>
                    <Text style={[styles.docValid, { color: colors.textTertiary }]}>
                      Uploaded {registration?.updatedAt ? new Date(registration.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </SectionCard>
        ) : null}

        {/* Payout */}
        <SectionCard title="Payout Details" onEdit={handleEdit}>
          {registration?.payout?.type === 'UPI' ? (
            <InfoField icon="smartphone" label="UPI ID" value={registration.payout.upiId || profile?.upiId || ''} fullWidth />
          ) : (
            <View style={styles.infoGrid}>
              <InfoField icon="credit-card" label="Bank Name" value={profile?.bankName || ''} />
              <InfoField icon="hash" label="Account Number" value={profile?.accountNumber || registration?.payout?.bank?.accountNumber || ''} />
              <InfoField icon="file-text" label="IFSC Code" value={profile?.ifsc || registration?.payout?.bank?.ifsc || ''} />
              <InfoField icon="user" label="Account Name" value={profile?.ownerName || registration?.payout?.bank?.accountName || ''} />
            </View>
          )}
        </SectionCard>

        <SectionCard title="Working Hours" onEdit={handleEdit}>
          <View style={[styles.hoursRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={[styles.hoursIcon, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="clock" size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hoursDays, { color: colors.textPrimary }]}>
                {registration?.workingDays || profile?.workingDays?.replace(/,/g, ' – ') || 'Monday – Saturday'}
              </Text>
              <Text style={[styles.hoursTime, { color: colors.textSecondary }]}>
                {registration?.workingHours
                  ? `${registration.workingHours.open} – ${registration.workingHours.close}`
                  : profile?.workingHoursOpen && profile?.workingHoursClose
                    ? `${profile.workingHoursOpen} – ${profile.workingHoursClose}`
                    : '9:00 AM – 8:00 PM'}
              </Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: registration?.storeOpen === false ? '#FEF2F2' : '#ECFDF5' }]}>
              <Text style={[styles.openBadgeText, { color: registration?.storeOpen === false ? '#EF4444' : '#10B981' }]}>
                {registration?.storeOpen === false ? 'Closed' : 'Open'}
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Social Links" onEdit={handleEdit}>
          <View style={styles.socialRow}>
            {[
              { icon: 'facebook', color: '#1877F2', bg: '#EFF6FF', url: registration?.socialLinks?.facebook || profile?.facebook },
              { icon: 'instagram', color: '#E1306C', bg: '#FDF2F8', url: registration?.socialLinks?.instagram || profile?.instagram },
              { icon: 'youtube', color: '#FF0000', bg: '#FEF2F2', url: registration?.socialLinks?.youtube || profile?.youtube },
              { icon: 'globe', color: '#64748B', bg: '#F1F5F9', url: registration?.website || profile?.website },
            ].map((s) => (
              <Pressable
                key={s.icon}
                style={[styles.socialCircle, { backgroundColor: s.url ? s.bg : colors.muted, opacity: s.url ? 1 : 0.5 }]}
                onPress={() => s.url && void Linking.openURL(s.url.startsWith('http') ? s.url : `https://${s.url}`)}
                disabled={!s.url}
              >
                <Feather name={s.icon as 'globe'} size={18} color={s.url ? s.color : colors.textTertiary} />
              </Pressable>
            ))}
          </View>
          {!(registration?.socialLinks?.facebook || registration?.socialLinks?.instagram || registration?.socialLinks?.youtube || profile?.facebook || profile?.instagram || profile?.youtube) ? (
            <Text style={[styles.socialHint, { color: colors.textTertiary }]}>
              No social links added yet.
            </Text>
          ) : null}
        </SectionCard>
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 8 },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#E60012',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 14 },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    position: 'relative',
  },
  statusPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  statusPillText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  heroTopRow: { flexDirection: 'row', gap: 14 },
  heroImage: { width: 88, height: 88, borderRadius: 14, backgroundColor: '#F1F5F9' },
  heroInfo: { flex: 1, gap: 4, paddingRight: 56 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  heroName: { fontSize: 16, fontFamily: 'Inter_700Bold', flexShrink: 1 },
  heroType: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  heroContactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },
  heroContactText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 4,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 8, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  editBtn: { flexDirection: 'row', alignItems: 'center' },
  editBtnText: { color: '#E60012', fontSize: 12, fontFamily: 'Inter_700Bold' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoField: { width: '48%', gap: 4 },
  infoFieldFull: { width: '100%' },
  infoFieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoFieldLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  infoFieldValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold', lineHeight: 17 },
  galleryRow: { gap: 10 },
  galleryThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  galleryImage: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#E60012',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverBadgeText: { color: '#ffffff', fontSize: 8, fontFamily: 'Inter_700Bold' },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOverlayText: { color: '#ffffff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  docsRow: { gap: 12 },
  docCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  docVerifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docVerifiedText: { color: '#10B981', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  docId: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  docValid: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  hoursIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hoursDays: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  hoursTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  openBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  openBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialHint: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
});
