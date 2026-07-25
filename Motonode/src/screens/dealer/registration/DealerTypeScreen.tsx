import React, { useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { DEALER_TYPE_LIST, DealerType } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: { mode?: 'edit' | 'create' } | undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
};

type DealerTypeNavigationProp = NativeStackNavigationProp<
  DealerStackParamList,
  typeof DealerStackRoutes.DealerType
>;

export function DealerTypeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DealerTypeNavigationProp>();
  const { saveDealerType } = useDealer();
  const [selected, setSelected] = useState<DealerType | null>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleContinue = async () => {
    if (!selected) return;
    lightHaptic();
    await saveDealerType(selected);
    navigation.replace(DealerStackRoutes.BusinessRegistration, { mode: 'create' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Select Business Type</Text>
        <Text style={styles.subtitle}>Choose the type that best describes your dealership</Text>
      </View>

      <FlatList
        data={DEALER_TYPE_LIST}
        keyExtractor={(item) => item.type}
        contentContainerStyle={[styles.list, Platform.OS === 'web' && { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selected === item.type;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isSelected ? item.color + '15' : colors.card,
                  borderColor: isSelected ? item.color : colors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              onPress={() => {
                lightHaptic();
                setSelected(item.type);
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color + '20' }]}>
                <Feather
                  name={item.icon as React.ComponentProps<typeof Feather>['name']}
                  size={26}
                  color={item.color}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.type}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
              <View style={[styles.radio, { borderColor: isSelected ? item.color : colors.border }]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: item.color }]} />}
              </View>
            </Pressable>
          );
        }}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: botPad + 12, backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[styles.continueBtn, { backgroundColor: selected ? colors.primary : colors.muted }]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text
            style={[styles.continueBtnText, { color: selected ? '#fff' : colors.textTertiary }]}
          >
            Continue
          </Text>
          <Feather
            name="arrow-right"
            size={18}
            color={selected ? '#fff' : colors.textTertiary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  title: { color: '#fff', fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontFamily: 'Inter_400Regular' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  cardDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  footer: { 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    borderTopWidth: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  continueBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
