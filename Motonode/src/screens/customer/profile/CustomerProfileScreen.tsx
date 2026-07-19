import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { LogoutModal } from '@components/modals/LogoutModal';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { successHaptic, lightHaptic } from '@utils/haptics';
import type { CustomerTabParamList } from '@navigation/CustomerTabsNavigator';

interface MenuItem {
  icon: string;
  label: string;
  sublabel?: string;
  action: () => void;
  color?: string;
}

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.SavedAddresses]: undefined;
  [CustomerStackRoutes.Wishlist]: undefined;
  [CustomerStackRoutes.PaymentMethods]: undefined;
  [CustomerStackRoutes.PersonalInformation]: undefined;
  [CustomerStackRoutes.Settings]: undefined;
  [CustomerStackRoutes.OtpVerification]: { phone?: string } | undefined;
};

type CustomerProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Profile>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

export function CustomerProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CustomerProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

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

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'user',
          label: 'Personal Information',
          sublabel: 'Manage your personal details',
          action: () => navigation.navigate(CustomerStackRoutes.PersonalInformation),
        },
        ...(!user?.mobileVerified
          ? [
              {
                icon: 'smartphone',
                label: 'Verify Mobile',
                sublabel: 'Secure your account with OTP verification',
                action: () =>
                  navigation.navigate(CustomerStackRoutes.OtpVerification, {
                    phone: user?.phone,
                  }),
                color: '#E60012',
              } satisfies MenuItem,
            ]
          : []),
        { icon: 'map-pin', label: 'Saved Addresses', sublabel: 'View and manage your addresses', action: () => navigation.navigate(CustomerStackRoutes.SavedAddresses as any) },
        { icon: 'credit-card', label: 'Payment Methods', sublabel: 'Manage cards and wallets', action: () => navigation.navigate(CustomerStackRoutes.PaymentMethods) },
        { icon: 'heart', label: 'Wishlist', sublabel: "Items you've saved", action: () => navigation.navigate(CustomerStackRoutes.Wishlist) },
      ],
    },
    {
      title: 'Services',
      items: [
        { icon: 'tool', label: 'My Services', sublabel: 'View and manage service bookings', action: () => navigation.navigate(CustomerTabRoutes.Garage, { initialTab: 'bookings' }) },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: 'bell', label: 'Notifications', sublabel: 'Manage push notifications', action: () => navigation.navigate(CustomerStackRoutes.Notifications) },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header Bar */}
      <ChromeHeader style={styles.header} contentPad={12}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Profile</Text>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => {
              lightHaptic();
              navigation.navigate(CustomerStackRoutes.Settings);
            }}
            hitSlop={8}
          >
            <Feather name="settings" size={22} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Container */}
        <View style={[styles.profileCardWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
          
          {/* Upper details row */}
          <View style={styles.profileHeaderRow}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySubtle }]}>
                <Text style={[styles.avatarInitial, { color: colors.link }]}>{user?.name?.[0] ?? 'U'}</Text>
              </View>
            )}
            
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name ?? 'Arjun Sharma'}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email ?? 'arjun@example.com'}</Text>
              
              <View style={styles.metaBadgesRow}>
                <View style={[styles.customerBadge, { backgroundColor: colors.primarySubtle }]}>
                  <Feather name="user" size={10} color={colors.link} style={{ marginRight: 4 }} />
                  <Text style={[styles.customerBadgeText, { color: colors.link }]}>Customer</Text>
                </View>
                
                <View style={styles.locationContainer}>
                  <Feather name="map-pin" size={10} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {user?.location ?? 'Koramangala, Bengaluru'}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={[styles.editBtn, { backgroundColor: colors.muted }]}
              onPress={() => {
                lightHaptic();
                navigation.navigate(CustomerStackRoutes.PersonalInformation);
              }}
              hitSlop={8}
            >
              <Feather name="edit-2" size={15} color={colors.icon} />
            </Pressable>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

          {/* Inline stats block */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="shopping-bag" size={16} color={colors.link} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>3</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
            </View>
            
            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <View style={[styles.statIconWrapper, { backgroundColor: colors.muted }]}>
                <Feather name="truck" size={16} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>2</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vehicles</Text>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <View style={[styles.statIconWrapper, { backgroundColor: colors.muted }]}>
                <Feather name="star" size={16} color={colors.starActive} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>8</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
            </View>
          </View>

        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.menuItem,
                    i < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    item.action();
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                    <Feather name={item.icon as 'user'} size={18} color={colors.icon} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    {item.sublabel && <Text style={[styles.menuSublabel, { color: colors.textSecondary }]}>{item.sublabel}</Text>}
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { borderColor: colors.destructive, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => {
            lightHaptic();
            setShowLogoutModal(true);
          }}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.textTertiary }]}>Motonode v1.0.0</Text>
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
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  settingsBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  profileCardWrapper: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  customerBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  verticalDivider: {
    width: 1,
    height: 40,
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 },
  sectionCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  menuSublabel: { fontSize: 10, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  logoutText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  version: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 8 },
});
