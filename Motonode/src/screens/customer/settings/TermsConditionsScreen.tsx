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

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.TermsConditions
>;

const LAST_UPDATED = 'July 2026';

const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: '1. Accepting these terms',
    body: [
      'By creating a Motonode account or using the app you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, please stop using the app.',
    ],
  },
  {
    heading: '2. Your account',
    body: [
      'You are responsible for keeping your login details secure and for all activity on your account.',
      'You must provide accurate information, including a valid phone number, and keep it up to date.',
      'You must be legally able to enter into a contract in your jurisdiction to transact on Motonode.',
    ],
  },
  {
    heading: '3. Orders, bookings and payments',
    body: [
      'Motonode is a marketplace that connects you with independent dealers and service providers. The dealer fulfilling your order is responsible for the products and services they supply.',
      'Prices, availability and delivery estimates are set by dealers and may change before an order is confirmed.',
      'Payments are processed by our payment partners. Refunds and returns follow the return policy shown on the listing and applicable law.',
    ],
  },
  {
    heading: '4. Reviews and community content',
    body: [
      'You may only review products you have genuine experience with. Reviews must be honest and must not contain abusive, misleading, or unlawful content.',
      'You keep ownership of the content you post, and you grant Motonode a licence to display it in the app.',
      'We may remove content or restrict accounts that breach these terms.',
    ],
  },
  {
    heading: '5. Acceptable use',
    body: [
      'Do not misuse the app: no fraud, harassment, scraping, reverse engineering, or attempts to disrupt the service or access other users\u2019 data.',
      'You may block accounts you do not wish to be contacted by, and report content that breaches these terms.',
    ],
  },
  {
    heading: '6. Your data',
    body: [
      'We collect and process personal data as described in our Privacy Policy, including account details, order history and device information needed to run the service.',
      'You can request access to or deletion of your data. Deactivating your account pauses access; deleting it removes your personal details while retaining records we are legally required to keep.',
    ],
  },
  {
    heading: '7. Liability',
    body: [
      'The app is provided on an "as is" basis. To the extent permitted by law, Motonode is not liable for indirect or consequential losses arising from your use of the app or from dealings with dealers.',
    ],
  },
  {
    heading: '8. Changes and contact',
    body: [
      'We may update these terms; continued use after an update means you accept the revised terms.',
      'Questions about these terms can be sent to support@motonode.com.',
    ],
  },
];

export function TermsConditionsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.textTertiary }]}>
          Last updated {LAST_UPDATED}
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>{section.heading}</Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={[styles.paragraph, { color: colors.textSecondary }]}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.contactBtn,
            { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            lightHaptic();
            void Linking.openURL('mailto:support@motonode.com?subject=Terms%20question');
          }}
        >
          <Feather name="mail" size={16} color={colors.icon} />
          <Text style={[styles.contactText, { color: colors.textPrimary }]}>
            Contact us about these terms
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  content: { padding: 16 },
  updated: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  section: { marginBottom: 18, gap: 6 },
  heading: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  paragraph: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  contactText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
