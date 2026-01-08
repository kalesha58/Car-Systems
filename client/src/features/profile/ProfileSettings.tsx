import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
import LanguageSection from './sections/LanguageSection';
import AccountSettingsSection from './sections/AccountSettingsSection';
import ActivitySection from './sections/ActivitySection';
import FeedbackSection from './sections/FeedbackSection';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CollapsibleContainer,
  CollapsibleScrollView,
  CollapsibleHeaderContainer,
  withCollapsibleContext,
} from '@r0b0t3d/react-native-collapsible';

const ProfileSettings = () => {
  const { logout } = useAuthStore();
  const { clearCart } = useCartStore();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

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
        content: {
          backgroundColor: colors.background,
        },
        scrollViewContent: {
          paddingTop: 0,
          paddingBottom: 100,
          paddingHorizontal: 0,
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
      <CollapsibleContainer
        style={[styles.container, { marginTop: insets.top || 0 }]}>
        <CollapsibleHeaderContainer containerStyle={{ backgroundColor: 'transparent' }}>
          <View style={{ backgroundColor: colors.background }}>
            <CustomHeader title={t('profile.settings') || 'Settings'} />
          </View>
        </CollapsibleHeaderContainer>

        <CollapsibleScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 0, paddingTop: 16 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <WalletSection />
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              <LanguageSection />
            </View>
          </View>
          <AccountSettingsSection />
          <ActivitySection />
          <FeedbackSection />

          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}>
              <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.logoutText}>
                {t('profile.logOut')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </CollapsibleScrollView>
      </CollapsibleContainer>
    </View>
  );
};

export default withCollapsibleContext(ProfileSettings);

