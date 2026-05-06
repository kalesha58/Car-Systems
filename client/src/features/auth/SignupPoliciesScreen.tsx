import React, { FC, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';

type PolicyTab = 'terms' | 'privacy';

const TERMS_CONTENT = [
  'By creating an account, you agree to use the app lawfully and respectfully.',
  'You are responsible for activity under your account and keeping credentials secure.',
  'Abusive, illegal, or harmful behavior may result in account suspension or removal.',
  'The service is provided as-is and may be updated to improve safety and experience.',
];

const PRIVACY_CONTENT = [
  'We collect basic account information required to provide app functionality.',
  'Your data is used for service operations, safety, support, and account management.',
  'We do not sell personal data. We may share limited data with trusted processors.',
  'You can request data updates or deletion from support/profile settings.',
];

const SignupPoliciesScreen: FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState<PolicyTab>(route?.params?.initialTab === 'privacy' ? 'privacy' : 'terms');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 16, paddingBottom: 40 },
        tabRow: {
          flexDirection: 'row',
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 10,
          padding: 4,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        tabButton: {
          flex: 1,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
        },
        tabButtonActive: { backgroundColor: colors.secondary },
        tabText: { fontSize: RFValue(12), fontFamily: Fonts.Medium, color: colors.textSecondary },
        tabTextActive: { color: colors.white, fontFamily: Fonts.SemiBold },
        title: {
          fontSize: RFValue(20),
          fontFamily: Fonts.Bold,
          color: colors.text,
          marginBottom: 8,
        },
        subtitle: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.textSecondary,
          lineHeight: RFValue(18),
          marginBottom: 16,
        },
        sectionCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          marginBottom: 10,
        },
        sectionText: {
          fontSize: RFValue(12),
          lineHeight: RFValue(18),
          color: colors.textSecondary,
          fontFamily: Fonts.Regular,
        },
      }),
    [colors],
  );

  const list = activeTab === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Terms & Privacy"
        showNotificationIcon={false}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('terms')}
            style={[styles.tabButton, activeTab === 'terms' && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <CustomText style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>Terms</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('privacy')}
            style={[styles.tabButton, activeTab === 'privacy' && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <CustomText style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>Privacy</CustomText>
          </TouchableOpacity>
        </View>

        <CustomText style={styles.title}>{activeTab === 'terms' ? 'Terms of Use' : 'Privacy Policy'}</CustomText>
        <CustomText style={styles.subtitle}>
          Please review this before signup. By continuing signup, you acknowledge and accept these policies.
        </CustomText>

        {list.map((item, index) => (
          <View key={`${activeTab}-${index}`} style={styles.sectionCard}>
            <CustomText style={styles.sectionText}>{item}</CustomText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SignupPoliciesScreen;
