import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type DocumentStatus = 'verified' | 'expiring' | 'missing';

interface GarageDocument {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  subtitle: string;
  status: DocumentStatus;
  statusLabel: string;
  meta: string;
}

const GARAGE_DOCUMENTS: GarageDocument[] = [
  {
    id: 'rc',
    icon: 'file-text',
    label: 'RC Book',
    subtitle: 'Registration Certificate',
    status: 'verified',
    statusLabel: 'Verified',
    meta: 'Uploaded 12 Jan 2026',
  },
  {
    id: 'insurance',
    icon: 'shield',
    label: 'Insurance',
    subtitle: 'Comprehensive Policy',
    status: 'expiring',
    statusLabel: 'Expiring Soon',
    meta: 'HDFC Ergo • Expires Dec 2026',
  },
  {
    id: 'puc',
    icon: 'check-square',
    label: 'PUC Certificate',
    subtitle: 'Pollution Under Control',
    status: 'verified',
    statusLabel: 'Valid',
    meta: 'Valid till Aug 2026',
  },
  {
    id: 'license',
    icon: 'credit-card',
    label: 'Driving License',
    subtitle: 'Government ID',
    status: 'missing',
    statusLabel: 'Upload Required',
    meta: 'Required for test drives & claims',
  },
];

export function GarageDocumentsPanel() {
  const colors = useColors();
  const uploadedCount = GARAGE_DOCUMENTS.filter((doc) => doc.status !== 'missing').length;
  const progress = uploadedCount / GARAGE_DOCUMENTS.length;

  return (
    <View style={styles.container}>
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Vehicle Documents</Text>
            <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
              Tata Nexon EV • KA 05 EV 2210
            </Text>
          </View>
          <Text style={[styles.summaryCount, { color: colors.textPrimary }]}>
            {uploadedCount}/{GARAGE_DOCUMENTS.length}
          </Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.textPrimary }]} />
        </View>

        <Text style={[styles.summaryMeta, { color: colors.textTertiary }]}>
          {GARAGE_DOCUMENTS.filter((d) => d.status === 'verified').length} valid ·{' '}
          {GARAGE_DOCUMENTS.filter((d) => d.status === 'expiring').length} expiring ·{' '}
          {GARAGE_DOCUMENTS.filter((d) => d.status === 'missing').length} missing
        </Text>
      </View>

      <View style={styles.docsList}>
        {GARAGE_DOCUMENTS.map((doc) => {
          const isMissing = doc.status === 'missing';

          return (
            <View
              key={doc.id}
              style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.docIcon, { backgroundColor: colors.muted }]}>
                <Feather name={doc.icon} size={18} color={colors.textSecondary} />
              </View>

              <View style={styles.docBody}>
                <View style={styles.docTitleRow}>
                  <Text style={[styles.docLabel, { color: colors.textPrimary }]}>{doc.label}</Text>
                  <Text
                    style={[
                      styles.statusText,
                      { color: isMissing ? colors.destructive : colors.textTertiary },
                    ]}
                  >
                    {doc.statusLabel}
                  </Text>
                </View>
                <Text style={[styles.docSubtitle, { color: colors.textSecondary }]}>{doc.subtitle}</Text>
                <Text style={[styles.docMeta, { color: colors.textTertiary }]}>{doc.meta}</Text>
              </View>

              <Pressable
                style={styles.docAction}
                onPress={() => lightHaptic()}
                hitSlop={8}
              >
                <Feather
                  name={isMissing ? 'upload' : 'chevron-right'}
                  size={16}
                  color={isMissing ? colors.primary : colors.textTertiary}
                />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Pressable
        style={[styles.uploadCard, { borderColor: colors.border }]}
        onPress={() => lightHaptic()}
      >
        <Feather name="plus" size={16} color={colors.textSecondary} />
        <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>Add document</Text>
      </Pressable>
    </View>
  );
}

export const GARAGE_DOCUMENTS_COUNT = GARAGE_DOCUMENTS.length;

const styles = StyleSheet.create({
  container: { gap: 12 },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryText: { flex: 1 },
  summaryTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  summarySub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  summaryCount: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  summaryMeta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  docsList: { gap: 8 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docBody: { flex: 1, gap: 2 },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  docLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  statusText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  docSubtitle: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  docMeta: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  docAction: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  uploadTitle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
