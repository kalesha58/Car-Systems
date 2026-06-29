import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { DealerVehicle } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.VehicleForm
>;

export function VehicleFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addVehicle, updateVehicle, vehicles } = useDealer();
  const editVehicle = route.params?.id ? vehicles.find((v) => v.id === route.params?.id) : null;
  const isEdit = !!editVehicle;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
        name: editVehicle.name,
        brand: editVehicle.brand,
        type: editVehicle.type,
        year: String(editVehicle.year),
        price: String(editVehicle.price),
        fuel: editVehicle.fuel,
        transmission: editVehicle.transmission,
        color: editVehicle.color,
        mileage: editVehicle.mileage,
        stock: String(editVehicle.stock),
        status: editVehicle.status,
        testDriveEnabled: editVehicle.testDriveEnabled,
        description: editVehicle.description,
        image: editVehicle.image,
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
        name: form.name,
        brand: form.brand,
        type: form.type,
        year: parseInt(form.year, 10) || new Date().getFullYear(),
        price: parseFloat(form.price) || 0,
        fuel: form.fuel,
        transmission: form.transmission,
        color: form.color,
        mileage: form.mileage,
        stock: parseInt(form.stock, 10) || 1,
        status: form.status,
        testDriveEnabled: form.testDriveEnabled,
        description: form.description,
        image:
          form.image ||
          `https://placehold.co/400x250/2563EB/white?text=${encodeURIComponent(form.name.substring(0, 14))}`,
      };
      if (isEdit && route.params?.id) {
        await updateVehicle(route.params.id, payload);
      } else {
        await addVehicle(payload);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.title}>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
          <Pressable
            style={[styles.saveHeaderBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveHeaderText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vehicle Details</Text>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle Type</Text>
              <View style={styles.toggleRow}>
                {(['car', 'bike'] as const).map((t) => (
                  <Pressable
                    key={t}
                    style={[
                      styles.toggleBtn,
                      {
                        backgroundColor: form.type === t ? colors.primary : colors.background,
                        borderColor: form.type === t ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      lightHaptic();
                      set('type', t);
                    }}
                  >
                    <Feather
                      name={t === 'car' ? 'truck' : 'wind'}
                      size={16}
                      color={form.type === t ? '#fff' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        { color: form.type === t ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {t === 'car' ? 'Car' : 'Bike'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {[
              { key: 'name', label: 'Vehicle Name *', placeholder: 'e.g. KTM Duke 390' },
              { key: 'brand', label: 'Brand *', placeholder: 'e.g. KTM' },
              { key: 'color', label: 'Color', placeholder: 'e.g. Orange' },
              { key: 'description', label: 'Description', placeholder: 'Short description' },
            ].map((f) => (
              <View key={f.key} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{f.label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textTertiary}
                  value={(form as Record<string, string | boolean>)[f.key] as string}
                  onChangeText={(v) => set(f.key, v)}
                  multiline={f.key === 'description'}
                />
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Specifications</Text>
            <View style={styles.row}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Year</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  keyboardType="numeric"
                  value={form.year}
                  onChangeText={(v) => set('year', v)}
                />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Mileage</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g. 30 kmpl"
                  placeholderTextColor={colors.textTertiary}
                  value={form.mileage}
                  onChangeText={(v) => set('mileage', v)}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Fuel Type</Text>
              <View style={styles.chipWrap}>
                {['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'].map((f) => (
                  <Pressable
                    key={f}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.fuel === f ? colors.primary : colors.background,
                        borderColor: form.fuel === f ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      lightHaptic();
                      set('fuel', f);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: form.fuel === f ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {f}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Transmission</Text>
              <View style={styles.chipWrap}>
                {['Manual', 'Automatic', 'CVT', 'AMT'].map((t) => (
                  <Pressable
                    key={t}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.transmission === t ? colors.primary : colors.background,
                        borderColor: form.transmission === t ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      lightHaptic();
                      set('transmission', t);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: form.transmission === t ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Pricing & Availability
            </Text>
            <View style={styles.row}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Price (₹) *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  value={form.price}
                  onChangeText={(v) => set('price', v)}
                />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Stock Units</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textTertiary}
                  value={form.stock}
                  onChangeText={(v) => set('stock', v)}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.chipWrap}>
                {(['available', 'reserved', 'sold'] as const).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.status === s ? colors.primary : colors.background,
                        borderColor: form.status === s ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      lightHaptic();
                      set('status', s);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: form.status === s ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={styles.toggleRow}
              onPress={() => {
                lightHaptic();
                set('testDriveEnabled', !form.testDriveEnabled);
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: form.testDriveEnabled ? colors.primary : colors.background,
                    borderColor: form.testDriveEnabled ? colors.primary : colors.border,
                  },
                ]}
              >
                {form.testDriveEnabled && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                Enable Test Drive bookings
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEdit ? 'Update Vehicle' : 'Add Vehicle'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  saveHeaderBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveHeaderText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 16, gap: 16 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  toggleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
