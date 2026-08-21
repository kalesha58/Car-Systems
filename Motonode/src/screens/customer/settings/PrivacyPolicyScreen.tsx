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

import { LEGAL_URLS } from '@constants/legal';
import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.PrivacyPolicy
>;

const LAST_UPDATED = 'August 2026';

const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: '1. Who we are',
    body: [
      'Motonode (“we”) operates a marketplace app that connects customers with independent dealers and service providers in India. This policy describes how we collect, use, store, and delete personal data in the Motonode iOS and Android apps and at motonode.in.',
    ],
  },
  {
    heading: '2. Account data',
    body: [
      'When you register we collect your name, email address, phone number, password (stored hashed), and account role (customer or dealer). Dealers also provide business details such as workshop name, address, GST, and KYC documents.',
    ],
  },
  {
    heading: '3. Location',
    body: [
      'With your permission we use location while the app is in use to save delivery addresses, place a pin on the map for home-service bookings, show nearby workshops, and optionally tag a community post. We do not collect location in the background.',
    ],
  },
  {
    heading: '4. Photos and camera',
    body: [
      'You may upload photos from your camera or library for garage vehicle and RC documents, dealer registration, chat attachments, and community posts. Images you submit are stored so we can display them to you and, where relevant, to dealers or other users you share them with.',
    ],
  },
  {
    heading: '5. Orders, bookings and payments',
    body: [
      'We store order and booking history, vehicle details you add to your garage, saved addresses, and messages with dealers. Payments for goods and services are processed by our payment partners; we receive confirmation of payment status, not full card numbers.',
    ],
  },
  {
    heading: '6. Maps, messaging and analytics',
    body: [
      'Maps and address search are provided by Google Maps. Push notifications and some analytics use Firebase (Google). These providers process data on our behalf under their own terms. We do not sell your personal data and we do not use advertising identifiers for tracking.',
    ],
  },
  {
    heading: '7. Retention and deletion',
    body: [
      'We keep account and transaction records while your account is active and for as long as required for tax, fraud, and legal obligations after you leave.',
      'You can deactivate or permanently delete your account in Settings. Deletion removes your profile and personal details from active systems; some records may remain where the law requires us to keep them.',
    ],
  },
  {
    heading: '8. Contact',
    body: [
      'Questions about this policy or your data: support@motonode.com. You can also read this policy at motonode.in/privacy.',
    ],
  },
];

export function PrivacyPolicyScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const openUrl = (url: string) => {
    lightHaptic();
    void Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          onPress={() => openUrl(LEGAL_URLS.privacy)}
        >
          <Feather name="external-link" size={16} color={colors.icon} />
          <Text style={[styles.contactText, { color: colors.textPrimary }]}>
            View on motonode.in
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.contactBtn,
            { borderColor: colors.border, opacity: pressed ? 0.8 : 1, marginTop: 10 },
          ]}
          onPress={() => openUrl('mailto:support@motonode.com?subject=Privacy%20question')}
        >
          <Feather name="mail" size={16} color={colors.icon} />
          <Text style={[styles.contactText, { color: colors.textPrimary }]}>
            Contact us about privacy
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
