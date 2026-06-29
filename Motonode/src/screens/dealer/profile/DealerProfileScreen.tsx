import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { LogoutModal } from '@components/modals/LogoutModal';
import { DealerStackRoutes, DealerTabRoutes } from '@constants/routes';
import { useAuth, useDealer } from '@context/index';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type DealerTabParamList = {
  [DealerTabRoutes.Dashboard]: undefined;
  [DealerTabRoutes.Inventory]: undefined;
  [DealerTabRoutes.Orders]: undefined;
  [DealerTabRoutes.Drive]: undefined;
  [DealerTabRoutes.Profile]: undefined;
};

type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
};

type DealerProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DealerTabParamList, typeof DealerTabRoutes.Profile>,
  NativeStackNavigationProp<DealerStackParamList>
>;

export function DealerProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DealerProfileNavigationProp>();
  const { user, logout, switchRole } = useAuth();
  const { dealerType, businessProfile, products, orders, resetRegistration } = useDealer();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleEditBusiness = () => {
    Alert.alert(
      'Edit Business Info',
      'This will take you back to Business Registration to update your info.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            lightHaptic();
            await resetRegistration();
            navigation.navigate(DealerStackRoutes.DealerType);
          },
        },
      ],
    );
  };

  const menuItems = [
    { icon: 'briefcase', label: 'Store Settings', sublabel: 'Name, type, location, hours' },
    { icon: 'image', label: 'Store Gallery', sublabel: 'Upload photos' },
    { icon: 'truck', label: 'Test Drive Settings', sublabel: 'Available vehicles and slots' },
    { icon: 'credit-card', label: 'Bank & Payments', sublabel: 'Manage payout account' },
    { icon: 'bell', label: 'Notifications', sublabel: 'Order and booking alerts' },
    { icon: 'help-circle', label: 'Help & Support' },
  ];

  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + o.total, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Store Profile</Text>
          <Pressable style={styles.editBtn} onPress={handleEditBusiness}>
            <Feather name="edit-2" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.storeInfo}>
          <View style={[styles.storeLogo, { backgroundColor: colors.primary }]}>
            <Feather name="briefcase" size={32} color="#fff" />
          </View>
          <View style={styles.storeText}>
            <Text style={styles.storeName}>
              {businessProfile?.businessName ?? user?.name ?? 'Speed Auto Parts'}
            </Text>
            <Text style={styles.storeType}>{dealerType ?? user?.dealerType ?? 'Spare Parts Dealer'}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color="#F59E0B" />
              <Text style={styles.rating}>4.6</Text>
              <Text style={styles.reviewCount}>(256 reviews)</Text>
            </View>
          </View>
        </View>
        <View style={styles.storeStats}>
          {[
            { label: 'Products', value: String(products.length) },
            { label: 'Orders', value: String(deliveredOrders) },
            {
              label: 'Revenue',
              value: totalRevenue > 0 ? `₹${(totalRevenue / 1000).toFixed(0)}K` : '₹2.4L',
            },
          ].map((s) => (
            <View key={s.label} style={styles.storeStat}>
              <Text style={styles.storeStatValue}>{s.value}</Text>
              <Text style={styles.storeStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {businessProfile && (
          <View
            style={[styles.businessCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.businessCardHeader}>
              <View style={[styles.businessIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="file-text" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.businessCardTitle, { color: colors.textPrimary }]}>
                Business Information
              </Text>
              <Pressable onPress={handleEditBusiness}>
                <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
              </Pressable>
            </View>

            {[
              { icon: 'tag', label: 'Dealer Type', value: dealerType ?? '—' },
              { icon: 'briefcase', label: 'Business Name', value: businessProfile.businessName },
              { icon: 'user', label: 'Owner', value: businessProfile.ownerName },
              { icon: 'hash', label: 'GST Number', value: businessProfile.gst || 'Not provided' },
              {
                icon: 'map-pin',
                label: 'City',
                value: `${businessProfile.city}, ${businessProfile.state} ${businessProfile.pincode}`,
              },
              { icon: 'phone', label: 'Mobile', value: businessProfile.mobile },
            ].map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Feather
                  name={row.icon as React.ComponentProps<typeof Feather>['name']}
                  size={14}
                  color={colors.textTertiary}
                />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{row.label}</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{row.value}</Text>
                </View>
              </View>
            ))}

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.statusLabel, { color: '#10B981' }]}>Store Active</Text>
            </View>
          </View>
        )}

        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, i) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                },
              ]}
              onPress={() => lightHaptic()}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather
                  name={item.icon as React.ComponentProps<typeof Feather>['name']}
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                {item.sublabel && (
                  <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>
                    {item.sublabel}
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[
            styles.switchBtn,
            { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
          ]}
          onPress={() => {
            lightHaptic();
            switchRole();
          }}
        >
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={[styles.switchBtnText, { color: colors.primary }]}>
            Switch to Customer View
          </Text>
        </Pressable>

        <Pressable
          style={[styles.logoutBtn, { borderColor: colors.destructive }]}
          onPress={() => {
            lightHaptic();
            setShowLogoutModal(true);
          }}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  editBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  storeInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  storeLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeText: { flex: 1 },
  storeName: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  storeType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { color: '#F59E0B', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  reviewCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  storeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
  },
  storeStat: { alignItems: 'center' },
  storeStatValue: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  storeStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  content: { padding: 16, gap: 14 },
  businessCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  businessCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  businessIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessCardTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold' },
  editLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  infoValue: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  menuCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  menuSublabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  switchBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
