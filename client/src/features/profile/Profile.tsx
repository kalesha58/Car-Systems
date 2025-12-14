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
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';

const Profile = () => {
  const { logout } = useAuthStore();
  const { clearCart } = useCartStore();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const seasonalTheme = useSeasonalTheme();

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
        gradientHeader: {
          paddingBottom: 0,
        },
        scrollViewContent: {
          padding: 16,
          paddingTop: 0,
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

  // Create lighter, shaded gradient colors from seasonal theme for profile header
  const gradientColors = useMemo(() => {
    // Map seasonal colors to lighter, shaded versions for profile header
    const getShadedColors = (season: string) => {
      switch (season) {
        case 'winter':
          // Light blue shades - very soft and shaded
          return ['#E3F2FD', '#BBDEFB']; // Very light blue to light blue
        case 'spring':
          return ['#E8F5E9', '#C8E6C9']; // Very light green to light green
        case 'summer':
          return ['#FFF3E0', '#FFE0B2']; // Very light orange to light orange
        case 'autumn':
          return ['#F3E5D5', '#E8D5C4']; // Very light brown to light brown
        default:
          // Default yellow theme - keep the original lighter yellow
          return ['#FFF9E6', '#FFE5B4']; // Very light yellow to light yellow-orange
      }
    };
    
    return getShadedColors(seasonalTheme.season);
  }, [seasonalTheme]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradientHeader}>
        <CustomHeader title={t('profile.title')} transparent />
        <ProfileHeader />
      </LinearGradient>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
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
