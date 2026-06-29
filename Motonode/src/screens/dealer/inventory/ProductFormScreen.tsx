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
import { DealerProduct } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.ProductForm>;

const CATEGORIES = ['Filters', 'Lubricants', 'Tyres', 'Batteries', 'Wipers', 'Ignition', 'Brakes', 'Accessories', 'Riding Gear', 'Other'];

export function ProductFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addProduct, updateProduct, products } = useDealer();
  const editProduct = route.params?.id ? products.find((p) => p.id === route.params?.id) : null;
  const isEdit = !!editProduct;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [form, setForm] = useState({
    name: editProduct?.name ?? '',
    brand: editProduct?.brand ?? '',
    category: editProduct?.category ?? 'Lubricants',
    price: editProduct ? String(editProduct.price) : '',
    mrp: editProduct ? String(editProduct.mrp) : '',
    sku: editProduct?.sku ?? '',
    stock: editProduct ? String(editProduct.stock) : '',
    description: editProduct?.description ?? '',
    image: editProduct?.image ?? '',
    hsnCode: '',
    weight: '',
    lowStockAlert: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        brand: editProduct.brand,
        category: editProduct.category,
        price: String(editProduct.price),
        mrp: String(editProduct.mrp),
        sku: editProduct.sku,
        stock: String(editProduct.stock),
        description: editProduct.description,
        image: editProduct.image,
        hsnCode: '',
        weight: '',
        lowStockAlert: true,
      });
    }
  }, [editProduct]);

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

  const getStatus = (stock: number): DealerProduct['status'] => {
    if (stock === 0) return 'out_of_stock';
    if (stock <= 10) return 'low_stock';
    return 'in_stock';
  };

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.price) {
      Alert.alert('Missing Fields', 'Please fill in Name, Brand, and Price.');
      return;
    }
    lightHaptic();
    setSaving(true);
    try {
      const stockNum = parseInt(form.stock, 10) || 0;
      const payload: Omit<DealerProduct, 'id'> = {
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: parseFloat(form.price) || 0,
        mrp: parseFloat(form.mrp) || parseFloat(form.price) || 0,
        sku: form.sku || `SKU-${Date.now()}`,
        stock: stockNum,
        status: getStatus(stockNum),
        description: form.description,
        image: form.image || `https://placehold.co/200x200/2563EB/white?text=${encodeURIComponent(form.name.substring(0, 12))}`,
      };
      if (isEdit && route.params?.id) {
        await updateProduct(route.params.id, payload);
      } else {
        await addProduct(payload);
      }
      successHaptic();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Clean white header */}
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: '#ffffff', borderBottomColor: '#E2E8F0' }]}>
          <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Add new product to your inventory</Text>
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
          {/* Section 1: Product Images */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumberBadge}><Text style={styles.sectionNumberText}>1</Text></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Images</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Upload clear images of your product</Text>
              </View>
            </View>
            <View style={styles.imageUploadArea}>
              <View style={[styles.uploadDropZone, { borderColor: '#D9D9D9' }]}>
                <View style={[styles.uploadIcon, { backgroundColor: '#F2F2F2' }]}>
                  <Feather name="upload-cloud" size={22} color={colors.icon} />
                </View>
                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Drag & drop images here</Text>
                <Text style={[styles.uploadOr, { color: colors.textTertiary }]}>or</Text>
                <Pressable style={styles.galleryBtn} onPress={() => lightHaptic()}>
                  <Feather name="image" size={13} color={colors.icon} style={{ marginRight: 5 }} />
                  <Text style={styles.galleryBtnText}>Upload from Gallery</Text>
                </Pressable>
                <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>JPG, PNG up to 5MB</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Basic Information */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#1E3A8A' }]}><Text style={styles.sectionNumberText}>2</Text></View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Information</Text>
            </View>
            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="package" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Product Name *</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Castrol GTX 20W-50"
                  placeholderTextColor={colors.textTertiary}
                  value={form.name}
                  onChangeText={(v) => set('name', v)}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="shield" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Brand *</Text>
                </View>
                <View style={[styles.inputDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.inputInner, { color: colors.textPrimary }]}
                    placeholder="Castrol"
                    placeholderTextColor={colors.textTertiary}
                    value={form.brand}
                    onChangeText={(v) => set('brand', v)}
                  />
                  <Feather name="chevron-down" size={14} color={colors.textSecondary} />
                </View>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="hash" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SKU / Part No. *</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="CAS-020"
                  placeholderTextColor={colors.textTertiary}
                  value={form.sku}
                  onChangeText={(v) => set('sku', v)}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="folder" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category *</Text>
                </View>
                <View style={[styles.inputDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.inputInner, { color: colors.textPrimary }]}>{form.category}</Text>
                  <Feather name="chevron-down" size={14} color={colors.textSecondary} />
                </View>
                {/* Category chips shown inline */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => { lightHaptic(); set('category', cat); }}
                      style={[styles.smallChip, {
                        backgroundColor: form.category === cat ? '#E60012' : colors.card,
                        borderColor: form.category === cat ? '#E60012' : colors.border,
                      }]}
                    >
                      <Text style={[styles.smallChipText, { color: form.category === cat ? '#fff' : colors.textSecondary }]}>{cat}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIconRow}>
                <Feather name="align-left" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
              </View>
              <TextInput
                style={[styles.inputMultiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="High performance engine oil for superior protection and mileage."
                placeholderTextColor={colors.textTertiary}
                value={form.description}
                onChangeText={(v) => set('description', v)}
                multiline
                numberOfLines={3}
                maxLength={250}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>{form.description.length}/250</Text>
            </View>
          </View>

          {/* Section 3: Pricing */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#10B981' }]}><Text style={styles.sectionNumberText}>3</Text></View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing</Text>
            </View>
            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="dollar-sign" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Selling Price (₹) *</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="1,150"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(v) => set('price', v)}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="tag" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MRP (₹)</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="1,450"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={form.mrp}
                  onChangeText={(v) => set('mrp', v)}
                />
              </View>
            </View>
          </View>

          {/* Section 4: Inventory */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#F59E0B' }]}><Text style={styles.sectionNumberText}>4</Text></View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Inventory</Text>
            </View>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconRow}>
                <Feather name="box" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Stock Quantity *</Text>
              </View>
              <View style={styles.stockRow}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="34"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={form.stock}
                  onChangeText={(v) => set('stock', v)}
                />
                <Text style={[styles.unitsLabel, { color: colors.textSecondary }]}>units</Text>
              </View>
            </View>
          </View>

          {/* Section 5: Additional Details */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#8B5CF6' }]}><Text style={styles.sectionNumberText}>5</Text></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Additional Details <Text style={[styles.optionalTag, { color: colors.textSecondary }]}>(Optional)</Text></Text>
              </View>
            </View>
            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="layers" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>HSN Code</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Enter HSN code"
                  placeholderTextColor={colors.textTertiary}
                  value={form.hsnCode}
                  onChangeText={(v) => set('hsnCode', v)}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <View style={styles.inputIconRow}>
                  <Feather name="activity" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight</Text>
                </View>
                <View style={styles.stockRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder="Enter weight"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={form.weight}
                    onChangeText={(v) => set('weight', v)}
                  />
                  <Text style={[styles.unitsLabel, { color: colors.textSecondary }]}>kg</Text>
                </View>
              </View>
            </View>

            {/* Low Stock Toggle */}
            <View style={[styles.toggleSettingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.toggleSettingLeft}>
                <View style={[styles.toggleSettingIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Feather name="bell" size={14} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.toggleSettingTitle, { color: colors.textPrimary }]}>Low Stock Alert</Text>
                  <Text style={[styles.toggleSettingSubtitle, { color: colors.textSecondary }]}>Get notified when stock is running low</Text>
                </View>
              </View>
              <Switch
                value={form.lowStockAlert as boolean}
                onValueChange={(v) => set('lowStockAlert', v)}
                trackColor={{ false: '#E2E8F0', true: '#E60012' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </ScrollView>

        {/* Product Summary Footer */}
        <View style={[styles.previewFooter, { backgroundColor: '#F2F2F2', borderTopColor: colors.border }]}>
          <View style={[styles.previewIconBox, { backgroundColor: '#F2F2F2' }]}>
            <Feather name="box" size={18} color={colors.icon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: '#1E3A8A' }]}>Product Summary</Text>
            <Text style={[styles.previewSub, { color: '#FF1A1A' }]}>
              {form.name || 'Product Name'} • {form.category} • {form.sku || 'SKU'}
            </Text>
          </View>
          <View style={styles.previewStats}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Stock</Text>
              <Text style={[styles.previewStatValue, { color: '#10B981' }]}>{form.stock || '0'} units</Text>
            </View>
            <View style={{ alignItems: 'center', marginLeft: 14 }}>
              <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Price</Text>
              <Text style={[styles.previewStatValue, { color: themeLight.textSecondary }]}>₹{form.price || '0'}</Text>
            </View>
          </View>
        </View>

        {/* Sticky Add button */}
        <View style={[styles.stickyAddBtn, { paddingBottom: bottomPad + 8 }]}>
          <Pressable
            style={[styles.addBtn, { backgroundColor: saving ? '#93C5FD' : '#E60012' }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>{isEdit ? 'Update Product' : 'Add Product'}</Text>
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
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 10, marginTop: 1 },
  saveHeaderBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E60012', paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: 8,
  },
  saveHeaderText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 16 },
  sectionBlock: {
    backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 16, gap: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNumberBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E60012', alignItems: 'center', justifyContent: 'center',
  },
  sectionNumberText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionSubtitle: { fontSize: 10, marginTop: 1 },
  optionalTag: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  imageUploadArea: { gap: 10 },
  uploadDropZone: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14,
    padding: 24, alignItems: 'center', gap: 6, backgroundColor: '#F8FBFF',
  },
  uploadIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  uploadOr: { fontSize: 10 },
  galleryBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E60012', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  galleryBtnText: { color: themeLight.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold' },
  uploadHint: { fontSize: 9, marginTop: 4 },
  twoColRow: { flexDirection: 'row', gap: 12 },
  inputWrapper: { gap: 5 },
  inputIconRow: { flexDirection: 'row', alignItems: 'center' },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
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
  smallChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, marginRight: 6,
  },
  smallChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitsLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  toggleSettingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  toggleSettingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleSettingIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  toggleSettingTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  toggleSettingSubtitle: { fontSize: 10, marginTop: 1 },
  previewFooter: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderTopWidth: 1, gap: 12,
  },
  previewIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  previewSub: { fontSize: 10, marginTop: 2 },
  previewStats: { flexDirection: 'row', alignItems: 'center' },
  previewStatLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  previewStatValue: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  stickyAddBtn: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14,
  },
  addBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
