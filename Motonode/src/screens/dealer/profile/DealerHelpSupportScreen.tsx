import React, { useState } from 'react';
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

import { ChromeHeader } from '@components/common';
import { CustomerStackRoutes, DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.HelpSupport>;

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'How do I add a car wash service?',
    a: 'Open Inventory → Services → use the + button. Choose Vehicle Wash, set Home or Dealer Center, then save.',
  },
  {
    q: 'How do home wash travel fees work?',
    a: 'On a home service, set free distance (km) and ₹ per km after that distance. Customers see your coverage areas on the listing.',
  },
  {
    q: 'When do I get paid for orders?',
    a: 'Settlements go to the bank / UPI details under Bank & Payments after order completion.',
  },
  {
    q: 'How do I update business details?',
    a: 'From Store Profile open Business Details, or use Edit to return to Business Registration.',
  },
];

export function DealerHelpSupportScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Help & Support</Text>
          <View style={styles.headerBtn} />
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.aiCard, { backgroundColor: '#E60012' }]}
          onPress={() => {
            lightHaptic();
            navigation.navigate(CustomerStackRoutes.AIChat);
          }}
        >
          <View style={styles.aiIconBox}>
            <Feather name="cpu" size={22} color="#E60012" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>Ask Meta AI</Text>
            <Text style={styles.aiSub}>
              Get instant help with store setup, wash packages, orders & more
            </Text>
          </View>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FAQs</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FAQS.map((faq, index) => {
            const open = openFaq === index;
            return (
              <View key={faq.q}>
                <Pressable
                  style={styles.faqRow}
                  onPress={() => {
                    lightHaptic();
                    setOpenFaq(open ? null : index);
                  }}
                >
                  <Text style={[styles.faqQ, { color: colors.textPrimary, flex: 1 }]}>{faq.q}</Text>
                  <Feather
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textTertiary}
                  />
                </Pressable>
                {open ? (
                  <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.a}</Text>
                ) : null}
                {index < FAQS.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                ) : null}
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Contact</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            style={styles.row}
            onPress={() => {
              lightHaptic();
              void Linking.openURL('mailto:support@motonode.com?subject=Dealer%20Support');
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="mail" size={16} color="#1E3A8A" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email support</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                support@motonode.com
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>
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
  content: { padding: 16, gap: 10 },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  aiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  aiSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 3, lineHeight: 15 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  faqQ: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  faqA: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sublabel: { fontSize: 10, marginTop: 2 },
});
