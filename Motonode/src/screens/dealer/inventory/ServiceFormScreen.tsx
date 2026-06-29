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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { DealerService } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.ServiceForm>;

const CATEGORIES: { label: string; icon: string }[] = [
  { label: 'Detailing', icon: 'star' },
  { label: 'Service', icon: 'settings' },
  { label: 'AC Service', icon: 'wind' },
  { label: 'Wash', icon: 'droplet' },
  { label: 'Protection', icon: 'shield' },
  { label: 'Body Work', icon: 'truck' },
  { label: 'Tyres', icon: 'circle' },
  { label: 'Electrical', icon: 'zap' },
  { label: 'Other', icon: 'more-horizontal' },
];

const DURATIONS = ['30 min', '45 min', '1 hr', '1.5 hrs', '2 hrs', '3 hrs', '4 hrs', '6 hrs', '1 day', '2 days'];

export function ServiceFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addService, updateService, services } = useDealer();
  const editService = route.params?.id ? services.find((s) => s.id === route.params?.id) : null;
  const isEdit = !!editService;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [form, setForm] = useState({
    name: editService?.name ?? '',
    category: editService?.category ?? 'Service',
    price: editService ? String(editService.price) : '',
    duration: editService?.duration ?? '1 hr',
    description: editService?.description ?? '',
    available: editService?.available ?? true,
    slotsPerDay: editService ? String(editService.slotsPerDay) : '6',
    image: editService?.image ?? '',
    onlineBooking: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editService) {
      setForm({
        name: editService.name, category: editService.category,
        price: String(editService.price), duration: editService.duration,
        description: editService.description, available: editService.available,
        slotsPerDay: String(editService.slotsPerDay), image: editService.image,
        onlineBooking: true,
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
        name: form.name, category: form.category,
        price: parseFloat(form.price) || 0, duration: form.duration,
        description: form.description, available: form.available,
        slotsPerDay: parseInt(form.slotsPerDay, 10) || 6,
        image: form.image || `https://placehold.co/400x200/2563EB/white?text=${encodeURIComponent(form.name.substring(0, 16))}`,
      };
      if (isEdit && route.params?.id) {
        await updateService(route.params.id, payload);
      } else {
        await addService(payload);
      }
      successHaptic();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const currentCategoryIcon = CATEGORIES.find((c) => c.label === form.category)?.icon ?? 'settings';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Clean White Header */}
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: '#E2E8F0' }]}>
          <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isEdit ? 'Edit Service' : 'Add Service'}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Add a new service to your catalog</Text>
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
          {/* Section 1: Service Information */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionNumberBadge}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Information</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Basic details about your service</Text>
              </View>
            </View>

            {/* Service Name */}
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Feather name="tool" size={13} color={colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Service Name *</Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Full Car Detailing"
                placeholderTextColor={colors.textTertiary}
                value={form.name}
                onChangeText={(v) => set('name', v)}
              />
            </View>

            {/* Description */}
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Feather name="align-left" size={13} color={colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description *</Text>
              </View>
              <TextInput
                style={[styles.inputMultiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Complete interior and exterior cleaning, polishing, and finishing to make your car look brand new."
                placeholderTextColor={colors.textTertiary}
                value={form.description}
                onChangeText={(v) => set('description', v)}
                multiline numberOfLines={4} maxLength={250}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>{form.description.length}/250</Text>
            </View>

            {/* Category Grid */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Category *</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = form.category === cat.label;
                  return (
                    <Pressable
                      key={cat.label}
                      style={[styles.categoryChip, {
                        borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                      }]}
                      onPress={() => { lightHaptic(); set('category', cat.label); }}
                    >
                      <Feather name={cat.icon as any} size={12} color={isSelected ? '#2563EB' : colors.textSecondary} />
                      <Text style={[styles.categoryChipText, { color: isSelected ? '#2563EB' : colors.textSecondary }]}>{cat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 2: Pricing & Booking */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Booking</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Set price, duration and availability</Text>
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
                  keyboardType="numeric" placeholder="2,499"
                  placeholderTextColor={colors.textTertiary}
                  value={form.price} onChangeText={(v) => set('price', v)}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Feather name="calendar" size={13} color={colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Slots / Day</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  keyboardType="numeric" placeholder="6"
                  placeholderTextColor={colors.textTertiary}
                  value={form.slotsPerDay} onChangeText={(v) => set('slotsPerDay', v)}
                />
              </View>
            </View>

            {/* Duration chips */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Duration</Text>
              <View style={styles.durationGrid}>
                {DURATIONS.map((d) => {
                  const isSelected = form.duration === d;
                  return (
                    <Pressable
                      key={d}
                      style={[styles.durationChip, {
                        borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                      }]}
                      onPress={() => { lightHaptic(); set('duration', d); }}
                    >
                      <Feather name="clock" size={10} color={isSelected ? '#2563EB' : colors.textSecondary} />
                      <Text style={[styles.durationChipText, { color: isSelected ? '#2563EB' : colors.textSecondary }]}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Duration Info Banner */}
            {form.duration ? (
              <View style={styles.durationInfoBanner}>
                <Feather name="calendar" size={13} color="#10B981" />
                <Text style={styles.durationInfoText}>
                  This service will take approximately <Text style={styles.durationInfoBold}>{form.duration}</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* Section 3: Additional Settings */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Additional Settings</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>More options for your service</Text>
              </View>
            </View>

            <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Feather name="calendar" size={14} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Enable Online Booking</Text>
                  <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>Allow customers to book this service</Text>
                </View>
              </View>
              <Switch
                value={form.onlineBooking as boolean}
                onValueChange={(v) => set('onlineBooking', v)}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </ScrollView>

        {/* Service Preview Footer */}
        <View style={[styles.previewFooter, { borderTopColor: colors.border }]}>
          <View style={[styles.previewIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Feather name={currentCategoryIcon as any} size={18} color="#2563EB" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Service Preview</Text>
            <Text style={[styles.previewName, { color: colors.textPrimary }]}>{form.name || 'Service Name'}</Text>
            <View style={styles.previewTagRow}>
              {form.duration ? (
                <View style={[styles.previewTag, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.previewTagText, { color: '#2563EB' }]}>{form.duration}</Text>
                </View>
              ) : null}
              {form.slotsPerDay ? (
                <View style={[styles.previewTag, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.previewTagText, { color: '#2563EB' }]}>{form.slotsPerDay} Slots/Day</Text>
                </View>
              ) : null}
              {form.price ? (
                <View style={[styles.previewTag, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.previewTagText, { color: '#2563EB' }]}>₹{form.price}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Price</Text>
            <Text style={[styles.previewPrice, { color: '#2563EB' }]}>₹{Number(form.price || 0).toLocaleString('en-IN')}</Text>
            <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Duration</Text>
            <Text style={[styles.previewStock, { color: '#1E3A8A' }]}>{form.duration || '-'}</Text>
          </View>
        </View>

        {/* Sticky Add Button */}
        <View style={[styles.stickyAddBtn, { paddingBottom: bottomPad + 8 }]}>
          <Pressable
            style={[styles.addBtn, { backgroundColor: saving ? '#93C5FD' : '#2563EB' }]}
            onPress={handleSave} disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>{isEdit ? 'Update Service' : 'Add Service'}</Text>
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNumberBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  sectionNumberText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionSubtitle: { fontSize: 10, marginTop: 1 },
  inputWrapper: { gap: 5 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  groupLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 13, fontFamily: 'Inter_500Medium',
  },
  inputMultiline: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 13, fontFamily: 'Inter_400Regular',
    height: 90, textAlignVertical: 'top',
  },
  charCount: { fontSize: 9, textAlign: 'right' },
  twoColRow: { flexDirection: 'row', gap: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5,
  },
  categoryChipText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5,
  },
  durationChipText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  durationInfoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ECFDF5', borderRadius: 10, padding: 10,
  },
  durationInfoText: { fontSize: 12, color: '#374151', fontFamily: 'Inter_400Regular', flex: 1 },
  durationInfoBold: { color: '#10B981', fontFamily: 'Inter_700Bold' },
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
  previewIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  previewName: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  previewTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  previewTagText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  previewStatLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  previewPrice: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  previewStock: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  stickyAddBtn: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14 },
  addBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
