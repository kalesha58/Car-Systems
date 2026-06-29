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

import { LogoutModal } from '@components/modals/LogoutModal';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { successHaptic } from '@utils/haptics';
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
};

type CustomerProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Profile>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

export function CustomerProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CustomerProfileScreenNavigationProp>();
  const { user, logout, switchRole } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
        { icon: 'user', label: 'Personal Information', action: () => {} },
        { icon: 'map-pin', label: 'Saved Addresses', action: () => {} },
        { icon: 'credit-card', label: 'Payment Methods', action: () => {} },
        { icon: 'heart', label: 'Wishlist', action: () => {} },
      ],
    },
    {
      title: 'Orders & Services',
      items: [
        { icon: 'package', label: 'My Orders', sublabel: 'Track and manage orders', action: () => {} },
        { icon: 'calendar', label: 'Service Bookings', sublabel: 'View upcoming bookings', action: () => {} },
        { icon: 'clock', label: 'Service History', action: () => {} },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: 'bell', label: 'Notifications', action: () => navigation.navigate(CustomerStackRoutes.Notifications) },
        { icon: 'moon', label: 'Appearance', sublabel: 'Light / Dark Mode', action: () => {} },
        { icon: 'globe', label: 'Language', sublabel: 'English', action: () => {} },
        { icon: 'help-circle', label: 'Help & Support', action: () => {} },
        { icon: 'briefcase', label: 'Switch to Dealer', sublabel: 'Manage your store', action: switchRole, color: colors.primary },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.settingsBtn}>
            <Feather name="settings" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.profileCard}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>{user?.name?.[0] ?? 'U'}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Guest User'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            <View style={styles.profileMeta}>
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + '30' }]}>
                <Text style={[styles.roleText, { color: '#60A5FA' }]}>{user?.role === 'dealer' ? 'Dealer' : 'Customer'}</Text>
              </View>
              {user?.location && (
                <Text style={styles.locationText}>{user.location}</Text>
              )}
            </View>
          </View>
          <Pressable style={[styles.editBtn, { borderColor: 'rgba(255,255,255,0.4)' }]}>
            <Feather name="edit-2" size={16} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          {[
            { value: '3', label: 'Orders' },
            { value: '2', label: 'Vehicles' },
            { value: '8', label: 'Reviews' },
          ].map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 34 }]}
        showsVerticalScrollIndicator={false}
      >
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
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={item.action}
                >
                  <View style={[styles.menuIcon, { backgroundColor: (item.color || colors.primary) + '15' }]}>
                    <Feather name={item.icon as 'user'} size={18} color={item.color || colors.primary} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: item.color || colors.textPrimary }]}>{item.label}</Text>
                    {item.sublabel && <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>{item.sublabel}</Text>}
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { borderColor: colors.destructive, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => setShowLogoutModal(true)}
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
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  settingsBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 28, fontFamily: 'Inter_700Bold' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  profileEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  locationText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  editBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  menuSublabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 8 },
});
