import { View, StyleSheet, Switch, Platform } from 'react-native';
import React, { FC } from 'react';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import { navigate } from '@utils/NavigationUtils';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@state/themeStore';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';

const AccountSettingsSection: FC = () => {
  const { t } = useTranslation();
  const { themeMode, toggleTheme } = useThemeStore();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const isDealer = user?.role?.includes('dealer');

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      paddingHorizontal: 16,
      fontSize: RFValue(13),
      color: colors.textSecondary,
      textTransform: 'none',
      letterSpacing: 0.3,
    },
    menuContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 0,
      paddingHorizontal: 16,
      overflow: 'hidden',
      marginBottom: 8,
    },
  });

  // Build menu items array
  const menuItems = [];
  if (!isDealer) {
    menuItems.push({
      icon: 'person-outline',
      label: t('profile.editProfile'),
      onPress: () => navigate('EditProfile'),
    });
    menuItems.push({
      icon: 'location-outline',
      label: t('profile.savedAddresses'),
      onPress: () => navigate('SavedAddresses'),
    });
    menuItems.push({
      icon: 'card-outline',
      label: t('profile.savedCards'),
      onPress: () => {},
    });
  } else {
    menuItems.push({
      icon: 'business-outline',
      label: t('dealer.dealership') || 'Dealership',
      onPress: () => navigate('BusinessRegistrationDetails'),
    });
  }

  menuItems.push({
    icon: 'moon-outline',
    label: t('profile.darkMode'),
    onPress: undefined,
    rightComponent: (
      <Switch
        value={themeMode === 'dark'}
        onValueChange={toggleTheme}
        trackColor={{ false: colors.border, true: colors.secondary }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.border}
      />
    ),
    showChevron: false,
  });

  if (!isDealer) {
    menuItems.push({
      icon: 'lock-closed-outline',
      label: t('profile.privacyCenter'),
      onPress: () => navigate('PrivacyCenter'),
    });
  }

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.sectionTitle}>
        {t('profile.accountSettings') || 'account Settings'}
      </CustomText>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <ProfileMenuItem
            key={item.icon}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
            rightComponent={item.rightComponent}
            showChevron={item.showChevron !== false}
            isLast={index === menuItems.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

export default AccountSettingsSection;
