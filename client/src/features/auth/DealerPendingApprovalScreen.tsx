import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import CustomText from '@components/ui/CustomText';
import CustomButton from '@components/ui/CustomButton';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { resetAndNavigate } from '@utils/NavigationUtils';
import { useAuthStore } from '@state/authStore';
import { tokenStorage } from '@state/storage';
import {
  fetchDealerMeOnboarding,
  resolveDealerOnboardingDestination,
} from '../../auth/postAuthRouting';

const DealerPendingApprovalScreen: React.FC = () => {
  const { colors } = useTheme();
  const { logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const snap = await fetchDealerMeOnboarding();
      const dest = resolveDealerOnboardingDestination(snap);
      if (dest !== 'DealerPendingApproval') {
        resetAndNavigate(dest);
      }
    } catch {
      // stay on screen
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSignOut = () => {
    logout();
    tokenStorage.clearAll();
    resetAndNavigate('CustomerLogin');
  };

  return (
    <CustomSafeAreaView>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />
        }>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <CustomText variant="h3" fontFamily={Fonts.Bold} style={{ color: colors.text, marginBottom: 12 }}>
            Application under review
          </CustomText>
          <CustomText variant="h6" fontFamily={Fonts.Medium} style={{ color: colors.textSecondary, lineHeight: 22 }}>
            Your business registration was submitted successfully. An administrator will review it shortly. Pull
            down to refresh status. You will get full access to inventory once approved.
          </CustomText>
        </View>
        <CustomButton title="Check status now" onPress={onRefresh} loading={refreshing} disabled={refreshing} />
        <View style={{ height: 16 }} />
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.outlineBtn, { borderColor: colors.secondary }]}
          activeOpacity={0.8}>
          <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={{ color: colors.secondary }}>
            Sign out
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingTop: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  outlineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    width: '100%',
  },
});

export default DealerPendingApprovalScreen;
