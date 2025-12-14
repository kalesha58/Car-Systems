import { View, StyleSheet, Switch, Platform } from 'react-native';
import React, { FC, useState } from 'react';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import { navigate } from '@utils/NavigationUtils';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@state/themeStore';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { testGreetingNotification } from '@service/notificationService';
import { useToast } from '@hooks/useToast';

const AccountSettingsSection: FC = () => {
  const { t } = useTranslation();
  const { themeMode, toggleTheme } = useThemeStore();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const isDealer = user?.role?.includes('dealer');

  const handleTestGreetingNotification = async () => {
    setIsTestingNotification(true);
    try {
      const success = await testGreetingNotification();
      if (success) {
        showSuccess('Greeting notification sent! Check your device for the notification.');
      } else {
        showError('Failed to send greeting notification. Please try again.');
      }
    } catch (error) {
      showError('An error occurred while sending the notification.');
    } finally {
      setIsTestingNotification(false);
    }
  };

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
      ...(isDark
        ? {}
        : {
            ...(Platform.OS === 'ios'
              ? {
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                }
              : {
                  elevation: 2,
                }),
          }),
    },
  });

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
        {t('profile.accountSettings')}
      </CustomText>

      <View style={styles.menuContainer}>
        {!isDealer && (
          <ProfileMenuItem
            icon="person-outline"
            label={t('profile.editProfile')}
            onPress={() => {
              navigate('EditProfile');
            }}
          />
        )}
        {/* Dealership Menu Item - Only for Dealers */}
        {isDealer && (
          <ProfileMenuItem
            icon="business-outline"
            label={t('dealer.dealership') || 'Dealership'}
            onPress={() => navigate('BusinessRegistrationDetails')}
          />
        )}

        {/* Consumer Specific Items - Hidden for Dealers */}
        {!isDealer && (
          <>
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
          </>
        )}

        <ProfileMenuItem
          icon="mail-outline"
          label={isTestingNotification ? "Sending..." : "Test Greeting Notification"}
          onPress={isTestingNotification ? undefined : handleTestGreetingNotification}
          showChevron={false}
        />

        <ProfileMenuItem
          icon="moon-outline"
          label={t('profile.darkMode')}
          rightComponent={
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          }
          showChevron={false}
        />

        {!isDealer && (
          <ProfileMenuItem
            icon="lock-closed-outline"
            label={t('profile.privacyCenter')}
            onPress={() => {
              // TODO: Navigate to privacy center when implemented
            }}
          />
        )}
      </View>
    </View>
  );
};

export default AccountSettingsSection;
