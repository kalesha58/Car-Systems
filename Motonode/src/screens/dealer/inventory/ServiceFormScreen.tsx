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
import { DealerService } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.ServiceForm
>;

const CATEGORIES = [
  'Detailing',
  'Service',
  'AC Service',
  'Wash',
  'Protection',
  'Body Work',
  'Tyres',
  'Electrical',
  'Other',
];
const DURATIONS = [
  '30 min',
  '45 min',
  '1 hr',
  '1.5 hrs',
  '2 hrs',
  '3 hrs',
  '4 hrs',
  '6 hrs',
  '1 day',
  '2 days',
];

export function ServiceFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addService, updateService, services } = useDealer();
  const editService = route.params?.id ? services.find((s) => s.id === route.params?.id) : null;
  const isEdit = !!editService;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [form, setForm] = useState({
    name: editService?.name ?? '',
    category: editService?.category ?? 'Service',
    price: editService ? String(editService.price) : '',
    duration: editService?.duration ?? '1 hr',
    description: editService?.description ?? '',
    available: editService?.available ?? true,
    slotsPerDay: editService ? String(editService.slotsPerDay) : '6',
    image: editService?.image ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editService) {
      setForm({
        name: editService.name,
        category: editService.category,
        price: String(editService.price),
        duration: editService.duration,
        description: editService.description,
        available: editService.available,
        slotsPerDay: String(editService.slotsPerDay),
        image: editService.image,
      });
    }
  }, [editService]);

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!form.name || !form.price) {
      Alert.alert('Missing Fields', 'Please fill in Name and Price.');
      return;
    }
    lightHaptic();
    setSaving(true);
    try {
      const payload: Omit<DealerService, 'id'> = {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price) || 0,
        duration: form.duration,
        description: form.description,
        available: form.available,
        slotsPerDay: parseInt(form.slotsPerDay, 10) || 6,
        image:
          form.image ||
          `https://placehold.co/400x200/2563EB/white?text=${encodeURIComponent(form.name.substring(0, 16))}`,
      };
      if (isEdit && route.params?.id) {
        await updateService(route.params.id, payload);
      } else {
        await addService(payload);
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
          <Text style={styles.title}>{isEdit ? 'Edit Service' : 'Add Service'}</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Info</Text>

            {[
              { key: 'name', label: 'Service Name *', placeholder: 'e.g. Full Car Detailing' },
              { key: 'description', label: 'Description', placeholder: 'What does this service include?' },
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
                  numberOfLines={f.key === 'description' ? 3 : 1}
                />
              </View>
            ))}

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
              <View style={styles.chipWrap}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.category === cat ? colors.primary : colors.background,
                        borderColor: form.category === cat ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      lightHaptic();
                      set('category', cat);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: form.category === cat ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Booking</Text>
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Slots/Day</Text>
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
                  placeholder="6"
                  placeholderTextColor={colors.textTertiary}
                  value={form.slotsPerDay}
                  onChangeText={(v) => set('slotsPerDay', v)}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Duration</Text>
              <View style={styles.chipWrap}>
                {DURATIONS.map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.duration === d ? colors.primary : colors.background,
                        borderColor: form.duration === d ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      lightHaptic();
                      set('duration', d);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: form.duration === d ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={styles.toggleRow}
              onPress={() => {
                lightHaptic();
                set('available', !form.available);
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: form.available ? '#10B981' : colors.background,
                    borderColor: form.available ? '#10B981' : colors.border,
                  },
                ]}
              >
                {form.available && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                Service is currently available
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEdit ? 'Update Service' : 'Add Service'}</Text>
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', gap: 12 },
  toggleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
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
