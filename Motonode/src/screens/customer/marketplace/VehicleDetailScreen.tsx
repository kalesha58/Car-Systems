import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { successHaptic } from '@utils/haptics';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
};

type VehicleDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.VehicleDetail
>;

export function VehicleDetailScreen({ route, navigation }: VehicleDetailScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const vehicle = VEHICLES.find((v) => v.id === id);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Vehicle not found</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]}>
          <Feather name="share-2" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} resizeMode="cover" />

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: colors.primary }]}>{vehicle.brand}</Text>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{vehicle.name}</Text>
            </View>
            <View style={[styles.yearBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.year, { color: colors.textSecondary }]}>{vehicle.year}</Text>
            </View>
          </View>

          <Text style={[styles.price, { color: colors.textPrimary }]}>₹{(vehicle.price / 100000).toFixed(2)}L</Text>

          <View style={styles.quickSpecs}>
            {[
              { icon: 'droplet', label: vehicle.fuel },
              { icon: 'settings', label: vehicle.transmission },
              { icon: 'trending-up', label: vehicle.mileage },
            ].map((spec) => (
              <View key={spec.label} style={[styles.quickSpec, { backgroundColor: colors.card }]}>
                <Feather name={spec.icon as 'droplet'} size={18} color={colors.primary} />
                <Text style={[styles.quickSpecText, { color: colors.textSecondary }]}>{spec.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Specifications</Text>
          <View style={[styles.specsCard, { backgroundColor: colors.card }]}>
            {vehicle.specs.map((spec, i) => (
              <View
                key={spec.label}
                style={[styles.specRow, i < vehicle.specs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
              >
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{spec.label}</Text>
                <Text style={[styles.specValue, { color: colors.textPrimary }]}>{spec.value}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{vehicle.description}</Text>

          <View style={[styles.dealerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.dealerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="briefcase" size={22} color={colors.primary} />
            </View>
            <View style={styles.dealerInfo}>
              <Text style={[styles.dealerName, { color: colors.textPrimary }]}>{vehicle.dealerName}</Text>
              <Text style={[styles.dealerLabel, { color: colors.textTertiary }]}>Authorized Dealer</Text>
            </View>
            <Pressable style={[styles.callBtn, { backgroundColor: colors.primary + '15' }]}>
              <Feather name="phone" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.enquireBtn, { borderColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.enquireBtnText, { color: colors.primary }]}>Enquire</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.testDriveBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
          onPress={() => successHaptic()}
        >
          <Feather name="truck" size={18} color="#fff" />
          <Text style={styles.testDriveBtnText}>Book Test Drive</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  vehicleImage: { width: '100%', height: 280 },
  content: { padding: 20, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  brand: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  name: { fontSize: 24, fontFamily: 'Inter_700Bold', lineHeight: 32, marginTop: 2 },
  yearBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 4 },
  year: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  price: { fontSize: 30, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  quickSpecs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickSpec: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  quickSpecText: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  divider: { height: 1, marginVertical: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  specsCard: { borderRadius: 16, overflow: 'hidden' },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  specLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  specValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  description: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  dealerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginTop: 16 },
  dealerIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  dealerInfo: { flex: 1 },
  dealerName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dealerLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { flexDirection: 'row', gap: 12, borderTopWidth: 1, padding: 16 },
  enquireBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  enquireBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  testDriveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  testDriveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
