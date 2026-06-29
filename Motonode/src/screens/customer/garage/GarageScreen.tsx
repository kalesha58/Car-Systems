import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { GarageCard } from '@components/cards/GarageCard';
import { OrderCard } from '@components/cards/OrderCard';
import { GARAGE_VEHICLES, ORDERS } from '@data/mockData';
import { useColors } from '@hooks/useColors';

const TABS = ['My Vehicles', 'Orders', 'Documents'];

export function GarageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Garage</Text>
          <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab, i) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === i && [styles.tabActive, { backgroundColor: colors.primary }]]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabText, { color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.7)' }]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 34 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 0 && (
          <>
            {GARAGE_VEHICLES.map((v) => (
              <GarageCard key={v.id} vehicle={v} />
            ))}
            <Pressable style={[styles.addVehicleBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}>
              <Feather name="plus-circle" size={24} color={colors.primary} />
              <Text style={[styles.addVehicleText, { color: colors.primary }]}>Add a Vehicle</Text>
            </Pressable>
          </>
        )}

        {activeTab === 1 && (
          <>
            {ORDERS.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {ORDERS.length === 0 && (
              <View style={styles.empty}>
                <Feather name="package" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Your order history will appear here</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 2 && (
          <View style={styles.docsContainer}>
            {[
              { icon: 'file-text', label: 'RC Book', status: 'Uploaded', color: '#10B981' },
              { icon: 'shield', label: 'Insurance', status: 'Expires Dec 2026', color: '#F59E0B' },
              { icon: 'check-square', label: 'PUC Certificate', status: 'Valid till Aug 2026', color: '#10B981' },
              { icon: 'credit-card', label: 'Driving License', status: 'Upload Required', color: '#EF4444' },
            ].map((doc, i) => (
              <Pressable key={i} style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.docIcon, { backgroundColor: doc.color + '20' }]}>
                  <Feather name={doc.icon as 'file-text'} size={22} color={doc.color} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={[styles.docLabel, { color: colors.textPrimary }]}>{doc.label}</Text>
                  <Text style={[styles.docStatus, { color: doc.color }]}>{doc.status}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: 8, paddingBottom: 16 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  tabActive: {},
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 16 },
  addVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addVehicleText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 10 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  docsContainer: { gap: 12 },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
  docIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  docStatus: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
