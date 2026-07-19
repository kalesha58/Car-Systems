import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { LogoutModal } from '@components/modals/LogoutModal';
import { ChromeHeader } from '@components/common';
import { DealerStackRoutes, DealerTabRoutes } from '@constants/routes';
import { useAuth, useDealer } from '@context/index';
import { useColors } from '@hooks/useColors';
import { useDealerOnboardingStatus } from '@hooks/useDealerOnboardingStatus';
import { getDealerProducts } from '@services/dealer.service';
import { getDealerOrderStats } from '@services/order.service';
import { themeLight } from '@theme/colors';
import { lightHaptic, successHaptic } from '@utils/haptics';

type DealerTabParamList = {
  [DealerTabRoutes.Dashboard]: undefined;
  [DealerTabRoutes.Inventory]: undefined;
  [DealerTabRoutes.Orders]: undefined;
  [DealerTabRoutes.Drive]: undefined;
  [DealerTabRoutes.Profile]: undefined;
  [DealerTabRoutes.Bank]: undefined;
};

type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
  [DealerStackRoutes.StoreSettings]: undefined;
  [DealerStackRoutes.BankDetails]: undefined;
  [DealerStackRoutes.GSTInfo]: undefined;
  [DealerStackRoutes.UPIAccounts]: undefined;
  [DealerStackRoutes.NotificationSettings]: undefined;
  [DealerStackRoutes.BusinessDetails]: undefined;
  [DealerStackRoutes.PrivacySecurity]: undefined;
  [DealerStackRoutes.HelpSupport]: undefined;
  [DealerStackRoutes.Analytics]: undefined;
  [DealerStackRoutes.EditAccount]: undefined;
};

type DealerProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DealerTabParamList, typeof DealerTabRoutes.Profile>,
  NativeStackNavigationProp<DealerStackParamList>
>;

export function DealerProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DealerProfileNavigationProp>();
  const { user, logout } = useAuth();
  const { dealerType, businessProfile, registrationCompleted } = useDealer();
  const { status: onboardingStatus } = useDealerOnboardingStatus();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fetchProfileStats = useCallback(async () => {
    try {
      const [productsRes, orderStats] = await Promise.all([
        getDealerProducts({ limit: 1000 }),
        getDealerOrderStats(),
      ]);
      setProductCount(productsRes.Response?.products?.length ?? 0);
      setDeliveredOrders(orderStats.delivered ?? 0);
      setTotalRevenue(orderStats.totalRevenue ?? 0);
    } catch {
      // Keep profile usable if stats fail to load.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileStats();
    }, [fetchProfileStats]),
  );

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      successHaptic();
      setShowLogoutModal(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleEditAccount = () => {
    lightHaptic();
    navigation.navigate(DealerStackRoutes.EditAccount);
  };

  const handleViewBusinessDetails = () => {
    lightHaptic();
    navigation.navigate(DealerStackRoutes.BusinessDetails);
  };

  const registrationStatusLabel =
    onboardingStatus === 'approved'
      ? 'Verified'
      : onboardingStatus === 'pending'
        ? 'Pending Review'
        : onboardingStatus === 'rejected'
          ? 'Rejected'
          : registrationCompleted
            ? 'Submitted'
            : 'Not Registered';

  const registrationStatusColor =
    onboardingStatus === 'approved'
      ? '#10B981'
      : onboardingStatus === 'rejected'
        ? '#EF4444'
        : '#F59E0B';

  const menuItems = [
    { icon: 'file-text', label: 'Business Details', sublabel: 'View your submitted registration info', color: '#E60012', bg: '#FEF2F2', route: DealerStackRoutes.BusinessDetails },
    { icon: 'calendar', label: 'Test Drive Settings', sublabel: 'Manage vehicles, slots & availability', color: '#8B5CF6', bg: '#F3E8FF', route: null },
    { icon: 'file-text', label: 'GST Information', sublabel: 'View and manage GST details', color: '#7C3AED', bg: '#F5F3FF', route: DealerStackRoutes.GSTInfo },
    { icon: 'bell', label: 'Notification Settings', sublabel: 'Manage order & booking alerts', color: '#EF4444', bg: '#FEF2F2', route: DealerStackRoutes.NotificationSettings },
    { icon: 'shield', label: 'Privacy & Security', sublabel: 'Password, 2FA & security settings', color: '#FF1A1A', bg: '#F2F2F2', route: DealerStackRoutes.PrivacySecurity },
    { icon: 'help-circle', label: 'Help & Support', sublabel: 'FAQs, Meta AI & contact support', color: '#64748B', bg: '#F1F5F9', route: DealerStackRoutes.HelpSupport },
  ];

  const displayRevenue = totalRevenue > 0 ? `₹${(totalRevenue / 1000).toFixed(0)}K` : '₹0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Store Profile</Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.72)' }]}>Manage your store & account</Text>
          </View>
          <Pressable style={[styles.headerEditBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]} onPress={handleEditAccount}>
            <Feather name="edit-2" size={18} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Store Branding Info Card */}
        <Pressable
          style={[styles.brandingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleViewBusinessDetails}
        >
          <View style={styles.brandingLeft}>
            {businessProfile?.storeBanner ? (
              <Image source={{ uri: businessProfile.storeBanner }} style={styles.storeCoverThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.storeLogoBox, { backgroundColor: '#E60012' }]}>
                <Feather name="home" size={28} color="#ffffff" />
              </View>
            )}

            <View style={styles.brandingDetails}>
              <Text style={[styles.storeName, { color: colors.textPrimary }]}>
                {businessProfile?.businessName ?? 'Your Business'}
              </Text>
              
              <View style={styles.dealerTypeBadge}>
                <Text style={styles.dealerTypeBadgeText}>{dealerType ?? 'Automobile Showroom'}</Text>
              </View>

              <View style={[styles.registrationStatusBadge, { backgroundColor: `${registrationStatusColor}18` }]}>
                <View style={[styles.activeDot, { backgroundColor: registrationStatusColor }]} />
                <Text style={[styles.registrationStatusText, { color: registrationStatusColor }]}>
                  {registrationStatusLabel}
                </Text>
              </View>

              <Text style={[styles.viewDetailsLink, { color: '#E60012' }]}>View business details →</Text>
            </View>
          </View>

          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>

        {/* Store Summary Statistics Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: '#F2F2F2' }]}>
              <Feather name="package" size={16} color={colors.icon} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{productCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Products</Text>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="shopping-bag" size={16} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{deliveredOrders}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Feather name="dollar-sign" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{displayRevenue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Revenue</Text>
          </View>
        </View>

        {/* Menu Options Group Card */}
        <View style={[styles.menuGroupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, i) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                lightHaptic();
                if (item.route) {
                  navigation.navigate(item.route as any);
                }
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                <Feather name={item.icon as any} size={16} color={item.color} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                <Text style={[styles.menuSublabel, { color: colors.textSecondary }]}>{item.sublabel}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {/* Bottom CTA Banner (Grow your business) */}
        <View style={[styles.growBusinessBanner, { backgroundColor: '#F2F2F2', borderColor: colors.border }]}>
          <View style={styles.growBannerLeft}>
            <View style={[styles.growIconBox, { backgroundColor: '#F2F2F2' }]}>
              <Feather name="trending-up" size={18} color={colors.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.growTitle, { color: colors.textPrimary }]}>Grow your business!</Text>
              <Text style={[styles.growSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                View analytics, insights and tips to grow your store.
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.growBtn}
            onPress={() => {
              lightHaptic();
              navigation.navigate(DealerStackRoutes.Analytics);
            }}
          >
            <Text style={styles.growBtnText}>View Analytics</Text>
            <Feather name="arrow-right" size={12} color="#ffffff" style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* Customer View and Logout buttons */}
        <View style={styles.profileActionBtns}>
          <Pressable
            style={[styles.actionBtn, { borderColor: colors.destructive }]}
            onPress={() => {
              lightHaptic();
              setShowLogoutModal(true);
            }}
          >
            <Feather name="log-out" size={15} color={colors.destructive} style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Sign Out</Text>
          </Pressable>
        </View>

      </ScrollView>

      <LogoutModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        loading={loggingOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  headerEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 16 },
  brandingCard: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storeCoverThumb: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  storeLogoBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingDetails: {
    gap: 4,
    flex: 1,
  },
  storeName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  dealerTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dealerTypeBadgeText: { color: themeLight.textSecondary, fontSize: 9, fontFamily: 'Inter_700Bold' },
  registrationStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  registrationStatusText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  viewDetailsLink: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  verticalDivider: {
    width: 1,
    height: 36,
  },

  menuGroupCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContent: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  menuSublabel: { fontSize: 10 },

  growBusinessBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  growBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  growIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  growSubtitle: { fontSize: 10, marginTop: 1 },
  growBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  growBtnText: { color: '#ffffff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  
  profileActionBtns: {
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
