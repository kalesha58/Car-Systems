import { View, StyleSheet, Switch } from 'react-native';
import React, { FC, useState, useEffect, useCallback } from 'react';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import { navigate } from '@utils/NavigationUtils';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@state/themeStore';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { getBusinessRegistrationByUserId, updateStoreStatus, IBusinessRegistration } from '@service/dealerService';
import { useToast } from '@hooks/useToast';

const AccountSettingsSection: FC = () => {
  const { t } = useTranslation();
  const { themeMode, toggleTheme } = useThemeStore();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const isDealer = user?.role?.includes('dealer');
  const [businessRegistration, setBusinessRegistration] = useState<IBusinessRegistration | null>(null);
  const [storeOpen, setStoreOpen] = useState<boolean>(true);
  const [isUpdatingStoreStatus, setIsUpdatingStoreStatus] = useState(false);

  // Fetch business registration for dealers
  useEffect(() => {
    if (!isDealer || !user?.id) {
      return;
    }

    const fetchBusinessRegistration = async () => {
      try {
        const registration = await getBusinessRegistrationByUserId(user.id);
        if (registration) {
          setBusinessRegistration(registration);
          setStoreOpen(registration.storeOpen !== undefined ? registration.storeOpen : true);
        }
      } catch (error) {
        console.error('Error fetching business registration:', error);
      }
    };

    fetchBusinessRegistration();
  }, [isDealer, user?.id]);

  const handleStoreToggle = useCallback(async (value: boolean) => {
    if (!businessRegistration?.id || isUpdatingStoreStatus) {
      return;
    }

    const previousValue = storeOpen;
    // Optimistically update UI
    setStoreOpen(value);

    try {
      setIsUpdatingStoreStatus(true);
      const updated = await updateStoreStatus(businessRegistration.id, { storeOpen: value });
      
      // Update business registration state
      setBusinessRegistration(updated);
      
      showSuccess(
        value
          ? t('dealer.storeOpen') || 'Store is now open'
          : t('dealer.storeClosed') || 'Store is now closed',
      );
    } catch (error) {
      // Revert on error
      setStoreOpen(previousValue);
      showError(
        error instanceof Error
          ? error.message
          : t('dealer.pleaseTryAgain') || 'Failed to update store status. Please try again.',
      );
    } finally {
      setIsUpdatingStoreStatus(false);
    }
  }, [businessRegistration?.id, storeOpen, isUpdatingStoreStatus, t, showSuccess, showError]);

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

  // Reverted to standard colors logic for consistency across all sections if requested, 
  // but keeping structure ready. For now, assuming user wants "colored icons" logic removed 
  // based on "dont use colors for the iocns" request, OR they want consistent simple style.
  // BUT the prompt says "do the same for the my activity... as well", implying the previous styling 
  // (which had colors) was DESIRED, but then the user said "dont use colors". 
  // Wait, "dont use colors for the iocns" - okay, I will revert to monochrome icons but keep the containers/structure.

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
      onPress: () => { },
    });
  } else {
    menuItems.push({
      icon: 'business-outline',
      label: t('dealer.dealership') || 'Dealership',
      onPress: () => navigate('BusinessRegistrationDetails'),
    });

    // Add Store Status toggle for approved dealers
    if (businessRegistration && businessRegistration.status === 'approved') {
      menuItems.push({
        icon: storeOpen ? 'checkmark-circle' : 'close-circle',
        label: storeOpen ? t('dealer.storeOpen') : t('dealer.storeClosed'),
        onPress: undefined,
        rightComponent: (
          <Switch
            value={storeOpen}
            onValueChange={handleStoreToggle}
            disabled={isUpdatingStoreStatus}
            trackColor={{ false: '#E5E7EB', true: colors.secondary }}
            thumbColor={colors.white}
            ios_backgroundColor="#E5E7EB"
          />
        ),
        showChevron: false,
      });
    }
  }

  menuItems.push({
    icon: 'moon-outline',
    label: isDark ? t('profile.darkMode') : t('profile.lightMode'),
    onPress: undefined,
    rightComponent: (
      <Switch
        value={themeMode === 'dark'}
        onValueChange={toggleTheme}
        trackColor={{ false: '#E5E7EB', true: colors.secondary }}
        thumbColor={colors.white}
        ios_backgroundColor="#E5E7EB"
      />
    ),
    showChevron: false,
  });

  if (!isDealer) {
    menuItems.push({
      icon: 'shield-checkmark-outline',
      label: t('profile.privacyCenter'),
      onPress: () => navigate('PrivacyCenter'),
    });
  }

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.Bold} style={styles.sectionTitle}>
        {t('profile.accountSettings') || 'ACCOUNT SETTINGS'}
      </CustomText>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <ProfileMenuItem
            key={item.label}
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
