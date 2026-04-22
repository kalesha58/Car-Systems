import { View, StyleSheet } from 'react-native';
import React, { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';

const PrivacyPermissionsSection: FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();

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

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.Bold} style={styles.sectionTitle}>
        {t('profile.privacyPermissions') || 'PRIVACY & PERMISSIONS'}
      </CustomText>

      <View style={styles.menuContainer}>
        <ProfileMenuItem
          icon="shield-outline"
          label={t('profile.privacyPermissions') || 'Privacy & Permissions'}
          onPress={() => (navigation as any).navigate('PrivacyPermissions')}
          showChevron
          isLast
        />
      </View>
    </View>
  );
};

export default PrivacyPermissionsSection;
