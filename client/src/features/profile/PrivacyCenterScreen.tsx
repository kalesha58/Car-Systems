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

const PrivacyCenterScreen: FC = () => {
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
      top: '10%',
      left: '25%',
      width: 200,
      height: 200,
      borderRadius: 100,
      opacity: isDark ? 0.1 : 0.05,
    },
    gradientCircle2: {
      position: 'absolute',
      bottom: '25%',
      right: '25%',
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
      <CustomHeader title={t('profile.privacyCenter')} />
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
          <CustomText style={styles.mainTitle}>Privacy Policy</CustomText>
          <CustomText style={styles.subtitle}>Privacy Center</CustomText>
          <CustomText style={styles.lastUpdated}>Last Updated: {lastUpdatedDate}</CustomText>
        </View>

        <PolicySection number={1} title="Information We Collect">
          <CustomText style={styles.sectionContent}>
            We collect information that you provide directly to us, including your name, email
            address, phone number, and other contact information when you register for an account
            or use our services. This may also include profile information, preferences, and any
            content you choose to share.
          </CustomText>
        </PolicySection>

        <PolicySection number={2} title="How We Use Your Information">
          <CustomText style={styles.sectionContent}>
            We use the information we collect to provide, maintain, and improve our services,
            process transactions, send you technical notices and support messages, and communicate
            with you about products, services, and promotional offers. Your data helps us
            personalize your experience and enhance platform security.
          </CustomText>
        </PolicySection>

        <PolicySection number={3} title="Information Sharing">
          <CustomText style={styles.sectionContent}>
            We do not sell, trade, or rent your personal information to third parties. We may
            share your information with service providers who assist us in operating our platform
            and conducting our business, subject to strict confidentiality agreements. We may also
            disclose information when required by law.
          </CustomText>
        </PolicySection>

        <PolicySection number={4} title="Data Security">
          <CustomText style={styles.sectionContent}>
            We implement appropriate technical and organizational measures to protect your
            personal information against unauthorized access, alteration, disclosure, or
            destruction. This includes encryption, secure servers, and regular security assessments
            to maintain the integrity of your data.
          </CustomText>
        </PolicySection>

        <PolicySection number={5} title="Your Rights & Choices">
          <CustomText style={styles.sectionContent}>
            You have the right to access, correct, or delete your personal information at any
            time. You may also opt out of receiving promotional communications from us. To exercise
            these rights, please contact our privacy team through the app settings or email us
            directly.
          </CustomText>
        </PolicySection>

        <PolicySection number={6} title="Cookies & Tracking">
          <CustomText style={styles.sectionContent}>
            We use cookies and similar tracking technologies to collect and use personal information
            about you, including to serve interest-based advertising. You can manage your cookie
            preferences through your browser settings or our cookie consent manager.
          </CustomText>
        </PolicySection>

        <PolicySection number={7} title="Contact Us">
          <CustomText style={styles.sectionContent}>
            If you have any questions about this Privacy Policy or our data practices, please
            contact us at privacy@example.com or through the support section in your account
            settings. We aim to respond to all inquiries within 48 hours.
          </CustomText>
        </PolicySection>

        <View style={styles.footer}>
          <CustomText style={styles.footerText}>
            By using our services, you agree to this Privacy Policy.
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
};

export default PrivacyCenterScreen;

