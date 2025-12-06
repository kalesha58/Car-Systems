import {View, StyleSheet, Switch} from 'react-native';
import React, {FC} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import {navigate} from '@utils/NavigationUtils';
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '@state/themeStore';
import {useTheme} from '@hooks/useTheme';

const AccountSettingsSection: FC = () => {
  const {t} = useTranslation();
  const {themeMode, toggleTheme} = useThemeStore();
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      opacity: 0.7,
      paddingHorizontal: 4,
    },
    menuContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
  });

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
        {t('profile.accountSettings')}
      </CustomText>

      <View style={styles.menuContainer}>
        <ProfileMenuItem
          icon="person-outline"
          label={t('profile.editProfile')}
          onPress={() => {
            // TODO: Navigate to edit profile screen when implemented
          }}
        />
        <ProfileMenuItem
          icon="location-outline"
          label={t('profile.savedAddresses')}
          onPress={() => navigate('SavedAddresses')}
        />
        <ProfileMenuItem
          icon="card-outline"
          label={t('profile.savedCards')}
          onPress={() => {
            // TODO: Navigate to saved cards screen when implemented
          }}
        />
        <ProfileMenuItem
          icon="notifications-outline"
          label={t('profile.notificationSettings')}
          onPress={() => {
            // TODO: Navigate to notification settings when implemented
          }}
        />
        <ProfileMenuItem
          icon="moon-outline"
          label={t('profile.darkMode')}
          rightComponent={
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{false: colors.border, true: colors.secondary}}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          }
          showChevron={false}
        />
        <ProfileMenuItem
          icon="lock-closed-outline"
          label={t('profile.privacyCenter')}
          onPress={() => {
            // TODO: Navigate to privacy center when implemented
          }}
        />
      </View>
    </View>
  );
};

export default AccountSettingsSection;
