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
import { DealerProduct } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.ProductForm
>;

const CATEGORIES = [
  'Filters',
  'Lubricants',
  'Tyres',
  'Batteries',
  'Wipers',
  'Ignition',
  'Brakes',
  'Accessories',
  'Riding Gear',
  'Other',
];

export function ProductFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addProduct, updateProduct, products } = useDealer();
  const editProduct = route.params?.id ? products.find((p) => p.id === route.params?.id) : null;
  const isEdit = !!editProduct;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [form, setForm] = useState({
    name: editProduct?.name ?? '',
    brand: editProduct?.brand ?? '',
    category: editProduct?.category ?? 'Accessories',
    price: editProduct ? String(editProduct.price) : '',
    mrp: editProduct ? String(editProduct.mrp) : '',
    sku: editProduct?.sku ?? '',
    stock: editProduct ? String(editProduct.stock) : '',
    description: editProduct?.description ?? '',
    image: editProduct?.image ?? '',
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
      });
    }
  }, [editProduct]);

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

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
        image:
          form.image ||
          `https://placehold.co/200x200/2563EB/white?text=${encodeURIComponent(form.name.substring(0, 12))}`,
      };
      if (isEdit && route.params?.id) {
        await updateProduct(route.params.id, payload);
      } else {
        await addProduct(payload);
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
          <Text style={styles.title}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Info</Text>

            {[
              { key: 'name', label: 'Product Name *', placeholder: 'e.g. Castrol GTX 20W-50' },
              { key: 'brand', label: 'Brand *', placeholder: 'e.g. Castrol' },
              { key: 'sku', label: 'SKU / Part No.', placeholder: 'e.g. CAS-020' },
              { key: 'description', label: 'Description', placeholder: 'Short product description' },
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
                  value={(form as Record<string, string>)[f.key]}
                  onChangeText={(v) => set(f.key, v)}
                  multiline={f.key === 'description'}
                  numberOfLines={f.key === 'description' ? 3 : 1}
                />
              </View>
            ))}

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
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
              </ScrollView>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Stock</Text>
            <View style={styles.row}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Selling Price (₹) *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(v) => set('price', v)}
                />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>MRP (₹)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={form.mrp}
                  onChangeText={(v) => set('mrp', v)}
                />
              </View>
            </View>
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Stock Quantity</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={form.stock}
                onChangeText={(v) => set('stock', v)}
              />
            </View>
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEdit ? 'Update Product' : 'Add Product'}</Text>
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
  chipRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', gap: 12 },
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
