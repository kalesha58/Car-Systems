import { View, StyleSheet, ScrollView } from 'react-native';
import React, { FC } from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import LinearGradient from 'react-native-linear-gradient';

interface PolicySectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

const PolicySection: FC<PolicySectionProps> = ({ number, title, children }) => {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    section: {
      marginBottom: 20,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    numberBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    numberText: {
      fontSize: RFValue(14),
      fontFamily: Fonts.Bold,
      color: colors.white,
    },
    sectionTitle: {
      fontSize: RFValue(15),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
      flex: 1,
    },
    sectionContent: {
      fontSize: RFValue(13),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      lineHeight: RFValue(20),
    },
  });

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.numberBadge}>
          <CustomText style={styles.numberText}>{number}</CustomText>
        </View>
        <CustomText style={styles.sectionTitle}>{title}</CustomText>
      </View>
      <View>{children}</View>
    </View>
  );
};

const TermsAndConditionsScreen: FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },
    gradientCircle1: {
      position: 'absolute',
      top: '25%',
      right: '25%',
      width: 200,
      height: 200,
      borderRadius: 100,
      opacity: isDark ? 0.1 : 0.05,
    },
    gradientCircle2: {
      position: 'absolute',
      bottom: 0,
      left: '33%',
      width: 160,
      height: 160,
      borderRadius: 80,
      opacity: isDark ? 0.08 : 0.03,
    },
    scrollViewContent: {
      padding: 16,
      paddingBottom: 100,
      zIndex: 1,
    },
    headerSection: {
      marginBottom: 24,
      alignItems: 'center',
    },
    mainTitle: {
      fontSize: RFValue(24),
      fontFamily: Fonts.Bold,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: RFValue(16),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    lastUpdated: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      opacity: 0.7,
      textAlign: 'center',
    },
    sectionContent: {
      fontSize: RFValue(13),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      lineHeight: RFValue(20),
    },
    footer: {
      marginTop: 32,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      opacity: 0.5,
    },
    footerText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const lastUpdatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <CustomHeader title={t('profile.termsPolicies')} />
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[colors.secondary + '20', colors.primary + '10']}
          style={styles.gradientCircle1}
        />
        <LinearGradient
          colors={[colors.primary + '15', colors.secondary + '10']}
          style={styles.gradientCircle2}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <CustomText style={styles.mainTitle}>Terms of Service</CustomText>
          <CustomText style={styles.subtitle}>Terms, Policies and Licenses</CustomText>
          <CustomText style={styles.lastUpdated}>Last Updated: {lastUpdatedDate}</CustomText>
        </View>

        <PolicySection number={1} title="Acceptance of Terms">
          <CustomText style={styles.sectionContent}>
            By accessing and using this application, you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to abide by the above, please do
            not use this service. These terms apply to all visitors, users, and others who access
            or use the service.
          </CustomText>
        </PolicySection>

        <PolicySection number={2} title="Use License">
          <CustomText style={styles.sectionContent}>
            Permission is granted to temporarily download one copy of the materials on our
            application for personal, non-commercial transitory viewing only. This is the grant of
            a license, not a transfer of title, and under this license you may not modify, copy,
            distribute, transmit, display, perform, reproduce, publish, license, create derivative
            works from, transfer, or sell any information obtained from this service.
          </CustomText>
        </PolicySection>

        <PolicySection number={3} title="User Account">
          <CustomText style={styles.sectionContent}>
            You are responsible for maintaining the confidentiality of your account and password.
            You agree to accept responsibility for all activities that occur under your account or
            password. You must immediately notify us of any unauthorized use of your account or
            any other breach of security.
          </CustomText>
        </PolicySection>

        <PolicySection number={4} title="Prohibited Uses">
          <CustomText style={styles.sectionContent}>
            You may not use our service to transmit any viruses, malware, or other harmful code,
            or to engage in any activity that interferes with or disrupts the service. You agree
            not to attempt to gain unauthorized access to any portion of the service, other
            accounts, computer systems, or networks connected to the service.
          </CustomText>
        </PolicySection>

        <PolicySection number={5} title="Intellectual Property">
          <CustomText style={styles.sectionContent}>
            The service and its original content, features, and functionality are owned by us and
            are protected by international copyright, trademark, patent, trade secret, and other
            intellectual property or proprietary rights laws. Our trademarks may not be used in
            connection with any product or service without prior written consent.
          </CustomText>
        </PolicySection>

        <PolicySection number={6} title="Limitation of Liability">
          <CustomText style={styles.sectionContent}>
            In no event shall we be liable for any indirect, incidental, special, consequential, or
            punitive damages, including without limitation, loss of profits, data, use, goodwill, or
            other intangible losses, resulting from your access to or use of or inability to access
            or use the service.
          </CustomText>
        </PolicySection>

        <PolicySection number={7} title="Termination">
          <CustomText style={styles.sectionContent}>
            We may terminate or suspend your account and bar access to the service immediately,
            without prior notice or liability, under our sole discretion, for any reason whatsoever
            and without limitation, including but not limited to a breach of the Terms. Upon
            termination, your right to use the service will immediately cease.
          </CustomText>
        </PolicySection>

        <PolicySection number={8} title="Governing Law">
          <CustomText style={styles.sectionContent}>
            These Terms shall be governed and construed in accordance with the laws of the
            jurisdiction in which we operate, without regard to its conflict of law provisions.
            Our failure to enforce any right or provision of these Terms will not be considered a
            waiver of those rights.
          </CustomText>
        </PolicySection>

        <View style={styles.footer}>
          <CustomText style={styles.footerText}>
            By using our services, you acknowledge that you have read and understood these terms.
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
};

export default TermsAndConditionsScreen;

