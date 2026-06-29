import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { DealerVehicle } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.VehicleForm>;

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT', 'AMT'];
const STATUS_OPTIONS: { value: DealerVehicle['status']; label: string; icon: string; color: string }[] = [
  { value: 'available', label: 'Available', icon: 'check-circle', color: '#10B981' },
  { value: 'reserved', label: 'Reserved', icon: 'clock', color: '#F59E0B' },
  { value: 'sold', label: 'Sold', icon: 'shopping-cart', color: '#6B7280' },
];

const FUEL_ICONS: Record<string, string> = {
  Petrol: 'droplet', Diesel: 'droplet', Electric: 'zap', CNG: 'wind', Hybrid: 'refresh-cw',
};

export function VehicleFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addVehicle, updateVehicle, vehicles } = useDealer();
  const editVehicle = route.params?.id ? vehicles.find((v) => v.id === route.params?.id) : null;
  const isEdit = !!editVehicle;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [form, setForm] = useState({
    name: editVehicle?.name ?? '',
    brand: editVehicle?.brand ?? '',
    type: editVehicle?.type ?? ('car' as 'car' | 'bike'),
    year: editVehicle ? String(editVehicle.year) : String(new Date().getFullYear()),
    price: editVehicle ? String(editVehicle.price) : '',
    fuel: editVehicle?.fuel ?? 'Petrol',
    transmission: editVehicle?.transmission ?? 'Manual',
    color: editVehicle?.color ?? '',
    mileage: editVehicle?.mileage ?? '',
    stock: editVehicle ? String(editVehicle.stock) : '1',
    status: editVehicle?.status ?? ('available' as DealerVehicle['status']),
    testDriveEnabled: editVehicle?.testDriveEnabled ?? true,
    description: editVehicle?.description ?? '',
    image: editVehicle?.image ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editVehicle) {
      setForm({
        name: editVehicle.name, brand: editVehicle.brand, type: editVehicle.type,
        year: String(editVehicle.year), price: String(editVehicle.price),
        fuel: editVehicle.fuel, transmission: editVehicle.transmission, color: editVehicle.color,
        mileage: editVehicle.mileage, stock: String(editVehicle.stock), status: editVehicle.status,
        testDriveEnabled: editVehicle.testDriveEnabled, description: editVehicle.description, image: editVehicle.image,
      });
    }
  }, [editVehicle]);

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.price) {
      Alert.alert('Missing Fields', 'Please fill in Name, Brand, and Price.');
      return;
    }
    lightHaptic();
    setSaving(true);
    try {
      const payload: Omit<DealerVehicle, 'id'> = {
        name: form.name, brand: form.brand, type: form.type,
        year: parseInt(form.year, 10) || new Date().getFullYear(),
        price: parseFloat(form.price) || 0, fuel: form.fuel,
        transmission: form.transmission, color: form.color, mileage: form.mileage,
        stock: parseInt(form.stock, 10) || 1, status: form.status,
        testDriveEnabled: form.testDriveEnabled, description: form.description,
        image: form.image || `https://placehold.co/400x250/2563EB/white?text=${encodeURIComponent(form.name.substring(0, 14))}`,
      };
      if (isEdit && route.params?.id) {
        await updateVehicle(route.params.id, payload);
      } else {
        await addVehicle(payload);
      }
      successHaptic();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const vehicleImage = form.type === 'bike'
    ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&auto=format&fit=crop&q=80';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Clean White Header */}
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: '#E2E8F0' }]}>
          <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Add a new vehicle to your fleet</Text>
          </View>
          <Pressable style={styles.saveHeaderBtn} onPress={handleSave} disabled={saving}>
            <Feather name="save" size={13} color="#ffffff" style={{ marginRight: 5 }} />
            <Text style={styles.saveHeaderText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Vehicle Details */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionLeft}>
                <View style={styles.sectionNumberBadge}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vehicle Details</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Basic information about the vehicle</Text>
                </View>
              </View>
              <Image source={{ uri: vehicleImage }} style={styles.vehiclePreviewSmall} resizeMode="contain" />
            </View>

            {/* Car / Bike toggle */}
            <View style={styles.typeToggleRow}>
              {(['car', 'bike'] as const).map((t) => {
                const isSelected = form.type === t;
                return (
                  <Pressable
                    key={t}
                    style={[styles.typeBtn, {
                      borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                      backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                    }]}
                    onPress={() => { lightHaptic(); set('type', t); }}
                  >
                    <Feather name={t === 'car' ? 'truck' : 'wind'} size={15} color={isSelected ? '#2563EB' : colors.textSecondary} />
                    <Text style={[styles.typeBtnText, { color: isSelected ? '#2563EB' : colors.textSecondary }]}>
                      {t === 'car' ? 'Car' : 'Bike'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Vehicle Name */}
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Feather name="truck" size={13} color={colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Name *</Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="KTM Duke 390"
                placeholderTextColor={colors.textTertiary}
                value={form.name}
                onChangeText={(v) => set('name', v)}
              />
            </View>

            {/* Brand */}
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Feather name="shield" size={13} color={colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Brand *</Text>
              </View>
              <View style={[styles.inputDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput style={[styles.inputInner, { color: colors.textPrimary }]} placeholder="KTM" placeholderTextColor={colors.textTertiary} value={form.brand} onChangeText={(v) => set('brand', v)} />
                <Feather name="chevron-down" size={14} color={colors.textSecondary} />
              </View>
            </View>

            {/* Color */}
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Feather name="settings" size={13} color={colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color</Text>
              </View>
              <View style={[styles.inputDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput style={[styles.inputInner, { color: colors.textPrimary }]} placeholder="Orange" placeholderTextColor={colors.textTertiary} value={form.color} onChangeText={(v) => set('color', v)} />
                <Feather name="chevron-down" size={14} color={colors.textSecondary} />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Feather name="align-left" size={13} color={colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
              </View>
              <TextInput
                style={[styles.inputMultiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="High performance sports bike for city and highway rides."
                placeholderTextColor={colors.textTertiary}
                value={form.description}
                onChangeText={(v) => set('description', v)}
                multiline numberOfLines={3} maxLength={250}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>{form.description.length}/250</Text>
            </View>
          </View>

          {/* Section 2: Specifications */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionLeft}>
                <View style={[styles.sectionNumberBadge, { backgroundColor: '#1E3A8A' }]}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Specifications</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Technical specifications</Text>
                </View>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Feather name="calendar" size={13} color={colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Year</Text>
                </View>
                <View style={[styles.inputDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput style={[styles.inputInner, { color: colors.textPrimary }]} keyboardType="numeric" value={form.year} onChangeText={(v) => set('year', v)} />
                  <Feather name="chevron-down" size={14} color={colors.textSecondary} />
                </View>
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Feather name="activity" size={13} color={colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mileage</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="30 kmpl"
                  placeholderTextColor={colors.textTertiary}
                  value={form.mileage}
                  onChangeText={(v) => set('mileage', v)}
                />
              </View>
            </View>

            {/* Fuel Type */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Fuel Type</Text>
              <View style={styles.chipWrap}>
                {FUEL_TYPES.map((f) => {
                  const isSelected = form.fuel === f;
                  return (
                    <Pressable
                      key={f}
                      style={[styles.specChip, {
                        borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                      }]}
                      onPress={() => { lightHaptic(); set('fuel', f); }}
                    >
                      <Feather name={(FUEL_ICONS[f] || 'droplet') as any} size={12} color={isSelected ? '#2563EB' : colors.textSecondary} />
                      <Text style={[styles.specChipText, { color: isSelected ? '#2563EB' : colors.textSecondary }]}>{f}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Transmission */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Transmission</Text>
              <View style={styles.chipWrap}>
                {TRANSMISSIONS.map((t) => {
                  const isSelected = form.transmission === t;
                  return (
                    <Pressable
                      key={t}
                      style={[styles.specChip, {
                        borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                      }]}
                      onPress={() => { lightHaptic(); set('transmission', t); }}
                    >
                      <Feather name="sliders" size={12} color={isSelected ? '#2563EB' : colors.textSecondary} />
                      <Text style={[styles.specChipText, { color: isSelected ? '#2563EB' : colors.textSecondary }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 3: Pricing & Availability */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionLeft}>
                <View style={[styles.sectionNumberBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Availability</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Set price and availability</Text>
                </View>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Feather name="tag" size={13} color={colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Price (₹) *</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  keyboardType="numeric" placeholder="1,80,000"
                  placeholderTextColor={colors.textTertiary}
                  value={form.price} onChangeText={(v) => set('price', v)}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Feather name="package" size={13} color={colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Stock Units</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  keyboardType="numeric" placeholder="1"
                  placeholderTextColor={colors.textTertiary}
                  value={form.stock} onChangeText={(v) => set('stock', v)}
                />
              </View>
            </View>

            {/* Status */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.chipWrap}>
                {STATUS_OPTIONS.map((s) => {
                  const isSelected = form.status === s.value;
                  return (
                    <Pressable
                      key={s.value}
                      style={[styles.specChip, {
                        borderColor: isSelected ? s.color : '#E2E8F0',
                        backgroundColor: isSelected ? s.color + '15' : '#ffffff',
                        flex: 1,
                        justifyContent: 'center',
                      }]}
                      onPress={() => { lightHaptic(); set('status', s.value); }}
                    >
                      <Feather name={s.icon as any} size={12} color={isSelected ? s.color : colors.textSecondary} />
                      <Text style={[styles.specChipText, { color: isSelected ? s.color : colors.textSecondary }]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Test Drive Toggle */}
            <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="calendar" size={14} color="#2563EB" />
                </View>
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Enable Test Drive Bookings</Text>
                  <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>Allow customers to book test drives</Text>
                </View>
              </View>
              <Switch
                value={form.testDriveEnabled as boolean}
                onValueChange={(v) => set('testDriveEnabled', v)}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </ScrollView>

        {/* Vehicle Preview Footer */}
        <View style={[styles.previewFooter, { borderTopColor: colors.border }]}>
          <Image source={{ uri: vehicleImage }} style={styles.previewVehicleThumb} resizeMode="contain" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Vehicle Preview</Text>
            <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
              {form.brand || 'Brand'} • {form.year} • {form.fuel} • {form.transmission}
            </Text>
            <View style={[styles.availBadge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.availBadgeText}>Available</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Price</Text>
            <Text style={[styles.previewPrice, { color: '#2563EB' }]}>₹{Number(form.price || 0).toLocaleString('en-IN')}</Text>
            <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Stock</Text>
            <Text style={[styles.previewStock, { color: '#1E3A8A' }]}>{form.stock || '1'} Unit</Text>
          </View>
        </View>

        {/* Sticky Add Button */}
        <View style={[styles.stickyAddBtn, { paddingBottom: bottomPad + 8 }]}>
          <Pressable
            style={[styles.addBtn, { backgroundColor: saving ? '#93C5FD' : '#2563EB' }]}
            onPress={handleSave} disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>{isEdit ? 'Update Vehicle' : 'Add Vehicle'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, backgroundColor: '#ffffff',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 10, marginTop: 1 },
  saveHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  saveHeaderText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 16 },
  sectionBlock: {
    backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 16, gap: 14,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionNumberBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  sectionNumberText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionSubtitle: { fontSize: 10, marginTop: 1 },
  vehiclePreviewSmall: { width: 70, height: 50, borderRadius: 8 },
  typeToggleRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
  },
  typeBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  inputWrapper: { gap: 5 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  groupLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 13, fontFamily: 'Inter_500Medium',
  },
  inputDropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  inputInner: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  inputMultiline: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 13, fontFamily: 'Inter_400Regular',
    height: 80, textAlignVertical: 'top',
  },
  charCount: { fontSize: 9, textAlign: 'right' },
  twoColRow: { flexDirection: 'row', gap: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5,
  },
  specChipText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleIconBox: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  toggleSubtitle: { fontSize: 10, marginTop: 1 },
  previewFooter: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderTopWidth: 1, backgroundColor: '#F8FBFF', gap: 12,
  },
  previewVehicleThumb: { width: 60, height: 40, borderRadius: 6 },
  previewTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  previewSub: { fontSize: 10 },
  availBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  availBadgeText: { color: '#10B981', fontSize: 9, fontFamily: 'Inter_700Bold' },
  previewStatLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  previewPrice: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  previewStock: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  stickyAddBtn: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14 },
  addBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
