import { View, StyleSheet, Platform } from 'react-native';
import React, { FC } from 'react';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { navigate } from '@utils/NavigationUtils';

const FeedbackSection: FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      marginBottom: 12,
      fontSize: RFValue(13),
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  });

  const menuItems = [
    {
      icon: 'chatbubble-ellipses-outline',
      label: t('profile.metAI') || 'MetAI',
      onPress: () => navigate('MetAIChat'),
    },
    {
      icon: 'document-text-outline',
      label: t('profile.termsPolicies'),
      onPress: () => navigate('TermsAndConditions'),
    },
  ];

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.Bold} style={styles.sectionTitle}>
        {t('profile.feedbackInformation') || 'FEEDBACK & INFORMATION'}
      </CustomText>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <ProfileMenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
            isLast={index === menuItems.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

export default FeedbackSection;
