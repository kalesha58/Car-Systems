import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { SERVICE_ADDONS } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingAddons
>;

export function ServiceBookingAddonsScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, updateBooking, getTotals } = useServiceBooking();
  const { addonsAmount } = getTotals();

  const toggleAddon = (id: string) => {
    const selected = draft.selectedAddonIds.includes(id);
    updateBooking({
      selectedAddonIds: selected
        ? draft.selectedAddonIds.filter((x) => x !== id)
        : [...draft.selectedAddonIds, id],
    });
  };

  return (
    <BookingFlowLayout
      title="Add Service Add-ons"
      step={4}
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate(CustomerStackRoutes.ServiceBookingSummary)}
      footerExtra={
        <View style={styles.footerRow}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Add-ons Total</Text>
          <Text style={[styles.footerValue, { color: colors.textPrimary }]}>
            ₹{addonsAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      }
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Optional extras to enhance your service
      </Text>

      {SERVICE_ADDONS.map((addon) => {
        const selected = draft.selectedAddonIds.includes(addon.id);
        return (
          <Pressable
            key={addon.id}
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: selected ? '#E60012' : colors.border,
              },
            ]}
            onPress={() => toggleAddon(addon.id)}
          >
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Feather name="check" size={12} color="#fff" />}
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.addonName, { color: colors.textPrimary }]}>{addon.name}</Text>
              <Text style={[styles.addonDesc, { color: colors.textSecondary }]}>
                {addon.description}
              </Text>
            </View>
            <Text style={[styles.addonPrice, { color: colors.textPrimary }]}>
              ₹{addon.price}
            </Text>
          </Pressable>
        );
      })}
    </BookingFlowLayout>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#E60012', borderColor: '#E60012' },
  rowBody: { flex: 1 },
  addonName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  addonDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addonPrice: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  footerValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
