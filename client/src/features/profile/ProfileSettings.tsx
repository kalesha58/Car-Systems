import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import React, { useMemo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@state/authStore';
import { useCartStore } from '@state/cartStore';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { storage, tokenStorage } from '@state/storage';
import { resetAndNavigate } from '@utils/NavigationUtils';
import WalletSection from './WalletSection';
import LanguageSection from './sections/LanguageSection';
import AccountSettingsSection from './sections/AccountSettingsSection';
import PrivacyPermissionsSection from './sections/PrivacyPermissionsSection';
import ActivitySection from './sections/ActivitySection';
import FeedbackSection from './sections/FeedbackSection';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { withCollapsibleContext } from '@r0b0t3d/react-native-collapsible';

const ProfileSettings = () => {
  const { logout, user } = useAuthStore();
  const { clearCart } = useCartStore();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const isDealer = user?.role?.includes('dealer');

  const handleSettingsBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (isDealer) {
      navigation.navigate('DealerTabs' as never, { screen: 'Profile' } as never);
    } else {
      navigation.navigate('MainTabs' as never, { screen: 'Profile' } as never);
    }
  }, [navigation, isDealer]);

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
        contentContainer: {
          flex: 1,
          backgroundColor: colors.background,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          overflow: 'hidden',
        },
        scrollViewContent: {
          paddingBottom: 100,
        },
        logoutButton: {
          backgroundColor: colors.secondary,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 30,
          marginHorizontal: 16,
        },
        logoutText: {
          color: colors.white,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      <CustomHeader 
        title={t('profile.settings') || 'Settings'} 
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
        showNotificationIcon={false}
        onBackPress={handleSettingsBack}
      />
      
      <View style={styles.contentContainer}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}>
          
          <View style={{ paddingHorizontal: 0, paddingTop: 20 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <WalletSection />
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <LanguageSection />
            </View>
          </View>
          
          <AccountSettingsSection />
          <PrivacyPermissionsSection />
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
    </View>
  );
};

export default withCollapsibleContext(ProfileSettings);
