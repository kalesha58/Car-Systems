import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@state/authStore';
import { useCartStore } from '@state/cartStore';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { storage, tokenStorage } from '@state/storage';
import { resetAndNavigate } from '@utils/NavigationUtils';
import WalletSection from './WalletSection';
import ProfileHeader from './sections/ProfileHeader';
import LanguageSection from './sections/LanguageSection';
import AccountSettingsSection from './sections/AccountSettingsSection';
import ActivitySection from './sections/ActivitySection';
import FeedbackSection from './sections/FeedbackSection';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';

const Profile = () => {
  const { logout } = useAuthStore();
  const { clearCart } = useCartStore();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleLogout = () => {
    clearCart();
    logout();
    tokenStorage.clearAll();
    storage.clearAll();
    resetAndNavigate('CustomerLogin');
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollViewContent: {
          padding: 16,
          paddingTop: 20,
          paddingBottom: 100,
        },
        logoutButton: {
          backgroundColor: colors.secondary,
          borderRadius: 10,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 20,
        },
        logoutText: {
          color: colors.white,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <CustomHeader title={t('profile.title')} />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <ProfileHeader />

        <WalletSection />
        <LanguageSection />
        <AccountSettingsSection />
        <ActivitySection />
        <FeedbackSection />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.logoutText}>
            {t('profile.logOut')}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Profile;
