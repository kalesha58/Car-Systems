import React, { useEffect, useMemo, useState } from 'react';
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

import { BookingPickerSheet } from '@components/booking/pickers/BookingPickerSheet';
import { DealerStackRoutes } from '@constants/routes';
import { ChromeHeader } from '@components/common';
import { InventoryImageUploadSection } from '@components/dealer/InventoryImageUploadSection';
import { ProductDetailSkeleton } from '@components/loaders';
import { useColors } from '@hooks/useColors';
import {
  createDealerProduct,
  deleteDealerProduct,
  getDealerProducts,
  updateDealerProduct,
} from '@services/dealer.service';
import { getDropdownOptions } from '@services/dropdown.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getProductId } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import type { DropdownOption } from '../../../types/dropdown';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.ProductForm>;

type DropdownField =
  | 'brand'
  | 'category'
  | 'batteryType'
  | 'vehicleBrand'
  | 'vehicleModel';

const DELIVERY_DAY_OPTIONS = [
  { days: 1, label: 'Within 1 day' },
  { days: 3, label: 'Within 3 days' },
  { days: 5, label: 'Within 5 days' },
  { days: 7, label: 'Within 7 days' },
] as const;

const FALLBACK_CATEGORIES: DropdownOption[] = [
  'Filters',
  'Lubricants',
  'Tyres',
  'Batteries',
  'Batteries & Chargers',
  'Wipers',
  'Ignition',
  'Brakes',
  'Accessories',
  'Riding Gear',
  'Other',
].map((name) => ({ label: name, value: name }));

const MAX_IMAGES = 3;

function isBatteryCategoryLabel(label: string): boolean {
  const lower = label.trim().toLowerCase();
  return lower.includes('batter');
}

export function ProductFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const editId = route.params?.id;
  const isEdit = !!editId;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const blockStyle = [
    styles.sectionBlock,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  const [loadingProduct, setLoadingProduct] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | ''>('');
  const [isSparePart, setIsSparePart] = useState(false);
  const [vehicleBrandId, setVehicleBrandId] = useState('');
  const [vehicleBrandLabel, setVehicleBrandLabel] = useState('');
  const [vehicleModelId, setVehicleModelId] = useState('');
  const [vehicleModelLabel, setVehicleModelLabel] = useState('');
  const [batteryTypeId, setBatteryTypeId] = useState('');
  const [batteryTypeLabel, setBatteryTypeLabel] = useState('');
  const [voltageV, setVoltageV] = useState('');
  const [color, setColor] = useState('');
  const [weight, setWeight] = useState('');
  const [emissionStandard, setEmissionStandard] = useState<'BS4' | 'BS6' | 'Other' | ''>('');
  const [fitsYear, setFitsYear] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  const [productBrands, setProductBrands] = useState<DropdownOption[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>(FALLBACK_CATEGORIES);
  const [batteryTypes, setBatteryTypes] = useState<DropdownOption[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<DropdownOption[]>([]);
  const [vehicleModels, setVehicleModels] = useState<DropdownOption[]>([]);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownField, setDropdownField] = useState<DropdownField>('brand');
  const [dropdownSearch, setDropdownSearch] = useState('');

  const isBatteryCategory = useMemo(
    () => isBatteryCategoryLabel(categoryLabel || categoryValue),
    [categoryLabel, categoryValue],
  );
  const showCompatibleFields = isSparePart && (vehicleType === 'Car' || vehicleType === 'Bike');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getDropdownOptions();
      if (cancelled) return;
      setProductBrands(data.productBrands.length ? data.productBrands : []);
      setCategories(data.categories.length ? data.categories : FALLBACK_CATEGORIES);
      setBatteryTypes(data.batteryTypes);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!vehicleType) {
      setVehicleBrands([]);
      setVehicleModels([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await getDropdownOptions(vehicleType);
      if (cancelled) return;
      setVehicleBrands(data.brands);
      setVehicleModels([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicleType]);

  useEffect(() => {
    if (!vehicleType || !vehicleBrandId) {
      setVehicleModels([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await getDropdownOptions(vehicleType, vehicleBrandId);
      if (cancelled) return;
      setVehicleModels(data.models);
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicleType, vehicleBrandId]);

  useEffect(() => {
    if (!isBatteryCategory) {
      setBatteryTypeId('');
      setBatteryTypeLabel('');
      setVoltageV('');
    }
  }, [isBatteryCategory]);

  useEffect(() => {
    if (!showCompatibleFields) {
      setVehicleBrandId('');
      setVehicleBrandLabel('');
      setVehicleModelId('');
      setVehicleModelLabel('');
      setColor('');
      setWeight('');
      setEmissionStandard('');
      setFitsYear('');
    }
  }, [showCompatibleFields]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingProduct(true);
        const response = await getDealerProducts({ limit: 1000 });
        const product = (response.Response?.products ?? []).find(
          (item) => getProductId(item) === editId,
        );
        if (!cancelled && product) {
          setName(product.name);
          setBrand(product.brand);
          const rawCategory = product.category || '';
          setCategoryValue(rawCategory);
          setCategoryLabel(rawCategory);
          setPrice(String(product.price));
          setMrp(String(product.originalPrice ?? product.price));
          setSku(product.tags?.[0] || '');
          setTags(product.tags?.slice(1) ?? []);
          setStock(String(product.stock));
          setDescription(product.description || '');
          setImages(product.images?.length ? product.images : []);
          setVehicleType(
            product.vehicleType === 'Car' || product.vehicleType === 'Bike'
              ? product.vehicleType
              : '',
          );
          setIsSparePart(Boolean(product.isSparePart));
          setVehicleBrandId(product.vehicleBrandId || '');
          setVehicleBrandLabel(product.vehicleBrandName || '');
          setVehicleModelId(product.vehicleModelId || '');
          setVehicleModelLabel(product.vehicleModelName || '');
          setBatteryTypeId(product.batteryTypeId || '');
          setBatteryTypeLabel(product.batteryTypeName || '');
          setVoltageV(product.voltageV != null ? String(product.voltageV) : '');
          setColor(product.color || '');
          setWeight(product.weight || '');
          setEmissionStandard((product.emissionStandard as any) || '');
          setFitsYear(product.fitsYear || '');
          setReturnPolicy(product.returnPolicy || '');
          if (product.deliveryTimeMinutes && product.deliveryTimeMinutes > 0) {
            const days = Math.round(product.deliveryTimeMinutes / (24 * 60));
            const match = DELIVERY_DAY_OPTIONS.find((o) => o.days === days);
            setDeliveryDays(match ? match.days : days);
          } else {
            setDeliveryDays(null);
          }
          const specs: Record<string, string> = {};
          if (product.specifications) {
            Object.entries(product.specifications).forEach(([k, v]) => {
              specs[k] = String(v ?? '');
            });
          }
          setSpecifications(specs);
        }
      } catch (error) {
        if (!cancelled) {
          Alert.alert('Error', getApiErrorMessage(error, 'Failed to load product'));
        }
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  // Rematch category / battery labels once dropdown options load
  useEffect(() => {
    if (!categoryValue || !categories.length) return;
    const match = categories.find(
      (c) => c.value === categoryValue || c.label === categoryValue || c.label === categoryLabel,
    );
    if (match) {
      setCategoryValue(match.value);
      setCategoryLabel(match.label);
    }
  }, [categories, categoryValue, categoryLabel]);

  useEffect(() => {
    if (!batteryTypeId || !batteryTypes.length) return;
    const match = batteryTypes.find((t) => t.value === batteryTypeId);
    if (match) setBatteryTypeLabel(match.label);
  }, [batteryTypes, batteryTypeId]);

  const openDropdown = (field: DropdownField) => {
    lightHaptic();
    setDropdownField(field);
    setDropdownSearch('');
    setDropdownVisible(true);
  };

  const dropdownOptions = useMemo((): DropdownOption[] => {
    switch (dropdownField) {
      case 'brand':
        return productBrands;
      case 'category':
        return categories;
      case 'batteryType':
        return batteryTypes;
      case 'vehicleBrand':
        return vehicleBrands;
      case 'vehicleModel':
        return vehicleModels;
      default:
        return [];
    }
  }, [dropdownField, productBrands, categories, batteryTypes, vehicleBrands, vehicleModels]);

  const filteredDropdownOptions = useMemo(() => {
    const query = dropdownSearch.trim().toLowerCase();
    if (!query) return dropdownOptions;
    return dropdownOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    );
  }, [dropdownOptions, dropdownSearch]);

  const dropdownTitle = useMemo(() => {
    switch (dropdownField) {
      case 'brand':
        return 'Select Brand';
      case 'category':
        return 'Select Category';
      case 'batteryType':
        return 'Select Battery Type';
      case 'vehicleBrand':
        return 'Select Compatible Brand';
      case 'vehicleModel':
        return 'Select Compatible Model';
      default:
        return 'Select';
    }
  }, [dropdownField]);

  const selectedDropdownValue = useMemo(() => {
    switch (dropdownField) {
      case 'brand':
        return productBrands.find((o) => o.label === brand)?.value ?? brand;
      case 'category':
        return categoryValue;
      case 'batteryType':
        return batteryTypeId;
      case 'vehicleBrand':
        return vehicleBrandId;
      case 'vehicleModel':
        return vehicleModelId;
      default:
        return '';
    }
  }, [
    dropdownField,
    productBrands,
    brand,
    categoryValue,
    batteryTypeId,
    vehicleBrandId,
    vehicleModelId,
  ]);

  const handleDropdownSelect = (option: DropdownOption) => {
    switch (dropdownField) {
      case 'brand':
        setBrand(option.label);
        break;
      case 'category':
        setCategoryValue(option.value);
        setCategoryLabel(option.label);
        break;
      case 'batteryType':
        setBatteryTypeId(option.value);
        setBatteryTypeLabel(option.label);
        break;
      case 'vehicleBrand':
        setVehicleBrandId(option.value);
        setVehicleBrandLabel(option.label);
        setVehicleModelId('');
        setVehicleModelLabel('');
        break;
      case 'vehicleModel':
        setVehicleModelId(option.value);
        setVehicleModelLabel(option.label);
        break;
      default:
        break;
    }
    setDropdownSearch('');
    setDropdownVisible(false);
  };

  const addTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    if (tags.includes(next) || next === sku.trim()) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, next]);
    setTagInput('');
  };

  const addSpec = () => {
    const key = specKey.trim();
    const value = specValue.trim();
    if (!key || !value) {
      Alert.alert('Specifications', 'Enter both a key and a value.');
      return;
    }
    setSpecifications((prev) => ({ ...prev, [key]: value }));
    setSpecKey('');
    setSpecValue('');
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedBrand = brand.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = parseFloat(price);
    const stockNum = parseInt(stock, 10);
    const parsedMrp = parseFloat(mrp) || parsedPrice;

    if (!trimmedName || !trimmedBrand || !categoryValue) {
      Alert.alert('Missing Fields', 'Please fill in Name, Brand, and Category.');
      return;
    }
    if (!trimmedDescription) {
      Alert.alert('Missing Fields', 'Please enter a product description.');
      return;
    }
    if (!vehicleType) {
      Alert.alert('Missing Fields', 'Please select Vehicle Type (Car or Bike).');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Price', 'Price must be greater than 0.');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      Alert.alert('Invalid Stock', 'Stock must be 0 or greater.');
      return;
    }
    if (isBatteryCategory) {
      if (!batteryTypeId) {
        Alert.alert('Missing Fields', 'Please select a Battery Type.');
        return;
      }
      const voltageNum = parseFloat(voltageV);
      if (!Number.isFinite(voltageNum) || voltageNum <= 0) {
        Alert.alert('Invalid Voltage', 'Please enter a valid voltage greater than 0.');
        return;
      }
    }
    if (showCompatibleFields && !vehicleBrandId) {
      Alert.alert('Missing Fields', 'Please select a Compatible Brand for spare parts.');
      return;
    }

    lightHaptic();
    setSaving(true);
    try {
      const finalTags = [
        ...(sku.trim() ? [sku.trim()] : []),
        ...tags.filter((t) => t.trim() && t.trim() !== sku.trim()),
      ];
      const payloadImages = images;

      const basePayload = {
        name: trimmedName,
        brand: trimmedBrand,
        category: categoryValue,
        price: parsedPrice,
        originalPrice: parsedMrp,
        stock: stockNum,
        description: trimmedDescription,
        images: payloadImages,
        vehicleType: vehicleType as 'Car' | 'Bike',
        isSparePart,
        tags: finalTags.length ? finalTags : undefined,
        specifications: Object.keys(specifications).length ? specifications : undefined,
        returnPolicy: returnPolicy.trim() || undefined,
        deliveryTimeMinutes:
          deliveryDays != null ? deliveryDays * 24 * 60 : undefined,
        ...(isBatteryCategory
          ? {
              batteryTypeId,
              voltageV: parseFloat(voltageV),
            }
          : {
              batteryTypeId: null as string | null,
              voltageV: null as number | null,
            }),
        ...(showCompatibleFields
          ? {
              vehicleBrandId,
              vehicleModelId: vehicleModelId || undefined,
              color: color.trim() || undefined,
              weight: weight.trim() || undefined,
              emissionStandard: emissionStandard || undefined,
              fitsYear: fitsYear.trim() || undefined,
            }
          : {
              vehicleBrandId: null as string | null,
              vehicleModelId: null as string | null,
              color: null as string | null,
              weight: null as string | null,
              emissionStandard: null as string | null,
              fitsYear: null as string | null,
            }),
      };

      if (isEdit && editId) {
        await updateDealerProduct(editId, basePayload);
      } else {
        const { batteryTypeId: batId, voltageV: volt, vehicleBrandId: vbId, vehicleModelId: vmId, ...createRest } =
          basePayload;
        await createDealerProduct({
          ...createRest,
          ...(isBatteryCategory
            ? { batteryTypeId: batId as string, voltageV: volt as number }
            : {}),
          ...(showCompatibleFields
            ? {
                vehicleBrandId: vbId as string,
                ...(vmId ? { vehicleModelId: vmId as string } : {}),
              }
            : {}),
        });
      }
      successHaptic();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to save product'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert('Delete Product', 'Remove this product from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await deleteDealerProduct(editId);
            successHaptic();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to delete product'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loadingProduct) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ProductDetailSkeleton />
      </View>
    );
  }

  const renderSelectRow = (
    label: string,
    value: string,
    placeholder: string,
    onPress: () => void,
    icon: string,
    required?: boolean,
    disabled?: boolean,
  ) => (
    <Pressable
      onPress={() => {
        if (disabled) return;
        onPress();
      }}
      style={[
        styles.selectField,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
        <Feather name={icon as 'folder'} size={14} color={colors.icon} />
      </View>
      <View style={styles.selectFieldTextContainer}>
        <Text style={[styles.selectFieldLabel, { color: colors.textSecondary }]}>
          {label}
          {required ? ' *' : ''}
        </Text>
        <Text
          style={[
            styles.selectFieldValue,
            {
              color: value ? colors.textPrimary : colors.textTertiary,
              paddingVertical: Platform.OS === 'ios' ? 4 : 0,
            },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
      </View>
      <Feather
        name="chevron-down"
        size={16}
        color={colors.textTertiary}
        style={styles.dropdownIcon}
      />
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader style={styles.header} contentPad={8}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
          >
            <Feather name="arrow-left" size={20} color={colors.headerForeground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>
              {isEdit ? 'Edit Product' : 'Add Product'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.72)' }]}>
              Add new product to your inventory
            </Text>
          </View>
          <Pressable style={styles.saveHeaderBtn} onPress={() => void handleSave()} disabled={saving}>
            <Feather name="save" size={13} color="#ffffff" style={{ marginRight: 5 }} />
            <Text style={styles.saveHeaderText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          {isEdit ? (
            <Pressable
              style={[styles.saveHeaderBtn, { backgroundColor: '#EF4444', marginLeft: 8 }]}
              onPress={handleDelete}
              disabled={saving}
            >
              <Feather name="trash-2" size={13} color="#ffffff" />
            </Pressable>
          ) : null}
        </ChromeHeader>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Images */}
          <View style={blockStyle}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumberBadge}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Product Images
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Optional — up to {MAX_IMAGES} images
                </Text>
              </View>
            </View>
            <InventoryImageUploadSection
              imageUris={images}
              maxImages={MAX_IMAGES}
              title="Upload clear images of your product"
              onImagesChange={setImages}
            />
          </View>

          {/* 2. Basic Information */}
          <View style={blockStyle}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#1E3A8A' }]}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Information</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Product Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="Castrol GTX 20W-50"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {productBrands.length > 0
              ? renderSelectRow('Brand', brand, 'Select brand', () => openDropdown('brand'), 'shield', true)
              : (
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Brand *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Castrol"
                    placeholderTextColor={colors.textTertiary}
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
              )}

            {renderSelectRow(
              'Category',
              categoryLabel || categoryValue,
              'Select category',
              () => openDropdown('category'),
              'folder',
              true,
            )}

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Type *</Text>
              <View style={styles.chipRow}>
                {(['Car', 'Bike'] as const).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      lightHaptic();
                      setVehicleType(type);
                      setVehicleBrandId('');
                      setVehicleBrandLabel('');
                      setVehicleModelId('');
                      setVehicleModelLabel('');
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: vehicleType === type ? '#E60012' : colors.card,
                        borderColor: vehicleType === type ? '#E60012' : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: vehicleType === type ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SKU / Part No.</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="CAS-020"
                placeholderTextColor={colors.textTertiary}
                value={sku}
                onChangeText={setSku}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description *</Text>
              <TextInput
                style={[
                  styles.inputMultiline,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="High performance engine oil for superior protection and mileage."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* 3. Pricing & Inventory */}
          <View style={blockStyle}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Inventory</Text>
            </View>
            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Selling Price (₹) *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="1150"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MRP (₹)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="1450"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={mrp}
                  onChangeText={setMrp}
                />
              </View>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Stock Quantity *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="34"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>
          </View>

          {/* 4. Spare part / Battery */}
          <View style={blockStyle}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.sectionNumberText}>4</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Compatibility</Text>
            </View>

            <View
              style={[
                styles.toggleSettingRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.toggleSettingLeft}>
                <View style={[styles.toggleSettingIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="tool" size={14} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleSettingTitle, { color: colors.textPrimary }]}>Spare Part</Text>
                  <Text style={[styles.toggleSettingSubtitle, { color: colors.textSecondary }]}>
                    Mark if this is a vehicle spare part
                  </Text>
                </View>
              </View>
              <Switch
                value={isSparePart}
                onValueChange={(v) => {
                  lightHaptic();
                  setIsSparePart(v);
                }}
                trackColor={{ false: '#E2E8F0', true: '#E60012' }}
                thumbColor="#ffffff"
              />
            </View>

            {showCompatibleFields ? (
              <>
                {renderSelectRow(
                  'Compatible Brand',
                  vehicleBrandLabel,
                  vehicleType ? 'Select brand' : 'Select vehicle type first',
                  () => openDropdown('vehicleBrand'),
                  'truck',
                  true,
                  !vehicleType,
                )}
                {renderSelectRow(
                  'Compatible Model',
                  vehicleModelLabel,
                  vehicleBrandId ? 'Optional' : 'Select brand first',
                  () => openDropdown('vehicleModel'),
                  'git-branch',
                  false,
                  !vehicleBrandId,
                )}

                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="e.g. Red, Black, Silver"
                    placeholderTextColor={colors.textTertiary}
                    value={color}
                    onChangeText={setColor}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="e.g. 500g, 1.5kg"
                    placeholderTextColor={colors.textTertiary}
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Emission Standard</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    {(['BS4', 'BS6', 'Other'] as const).map((std) => {
                      const selected = emissionStandard === std;
                      return (
                        <Pressable
                          key={std}
                          onPress={() => {
                            lightHaptic();
                            setEmissionStandard(selected ? '' : std);
                          }}
                          style={{
                            flex: 1,
                            height: 40,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary + '10' : colors.card,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: 'Inter_700Bold',
                              color: selected ? colors.primary : colors.textSecondary,
                            }}
                          >
                            {std}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Fits Year</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="e.g. 2020, 2018-2022"
                    placeholderTextColor={colors.textTertiary}
                    value={fitsYear}
                    onChangeText={setFitsYear}
                  />
                </View>
              </>
            ) : null}

            {isBatteryCategory ? (
              <>
                {renderSelectRow(
                  'Battery Type',
                  batteryTypeLabel,
                  'Select battery type',
                  () => openDropdown('batteryType'),
                  'zap',
                  true,
                )}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Voltage (V) *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="12"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={voltageV}
                    onChangeText={setVoltageV}
                  />
                </View>
              </>
            ) : null}
          </View>

          {/* 5. Specs, tags, return policy */}
          <View style={blockStyle}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.sectionNumberText}>5</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Additional Details{' '}
                <Text style={[styles.optionalTag, { color: colors.textSecondary }]}>(Optional)</Text>
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Specifications</Text>
              {Object.entries(specifications).map(([key, value]) => (
                <View key={key} style={[styles.specRow, { borderColor: colors.border }]}>
                  <Text style={[styles.specText, { color: colors.textPrimary }]}>
                    {key}: {value}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setSpecifications((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      })
                    }
                    hitSlop={8}
                  >
                    <Feather name="x" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
              <View style={styles.twoColRow}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Key"
                  placeholderTextColor={colors.textTertiary}
                  value={specKey}
                  onChangeText={setSpecKey}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Value"
                  placeholderTextColor={colors.textTertiary}
                  value={specValue}
                  onChangeText={setSpecValue}
                />
              </View>
              <Pressable style={styles.addChipBtn} onPress={addSpec}>
                <Feather name="plus" size={14} color="#E60012" />
                <Text style={styles.addChipBtnText}>Add specification</Text>
              </Pressable>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tags</Text>
              <View style={styles.chipRow}>
                {sku.trim() ? (
                  <View style={[styles.tagChip, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.tagChipText, { color: colors.textPrimary }]}>{sku.trim()}</Text>
                  </View>
                ) : null}
                {tags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={[styles.tagChip, { backgroundColor: colors.muted }]}
                    onPress={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  >
                    <Text style={[styles.tagChipText, { color: colors.textPrimary }]}>{tag}</Text>
                    <Feather name="x" size={12} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.stockRow}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Add tag"
                  placeholderTextColor={colors.textTertiary}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                />
                <Pressable style={styles.addChipBtn} onPress={addTag}>
                  <Text style={styles.addChipBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Delivery time
              </Text>
              <View style={styles.chipRow}>
                {DELIVERY_DAY_OPTIONS.map((opt) => {
                  const selected = deliveryDays === opt.days;
                  return (
                    <Pressable
                      key={opt.days}
                      onPress={() => {
                        lightHaptic();
                        setDeliveryDays(selected ? null : opt.days);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? '#E60012' : colors.card,
                          borderColor: selected ? '#E60012' : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? '#fff' : colors.textSecondary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Return Policy</Text>
              <TextInput
                style={[
                  styles.inputMultiline,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="e.g. 7-day return on unused items"
                placeholderTextColor={colors.textTertiary}
                value={returnPolicy}
                onChangeText={setReturnPolicy}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.previewFooter, { backgroundColor: '#F2F2F2', borderTopColor: colors.border }]}>
          <View style={[styles.previewIconBox, { backgroundColor: '#F2F2F2' }]}>
            <Feather name="box" size={18} color={colors.icon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: '#1E3A8A' }]}>Product Summary</Text>
            <Text style={[styles.previewSub, { color: '#FF1A1A' }]}>
              {name || 'Product Name'} • {categoryLabel || categoryValue || 'Category'} •{' '}
              {vehicleType || 'Type'}
            </Text>
          </View>
          <View style={styles.previewStats}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Stock</Text>
              <Text style={[styles.previewStatValue, { color: '#10B981' }]}>{stock || '0'} units</Text>
            </View>
            <View style={{ alignItems: 'center', marginLeft: 14 }}>
              <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Price</Text>
              <Text style={[styles.previewStatValue, { color: colors.textSecondary }]}>
                ₹{price || '0'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.stickyAddBtn, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
          <Pressable
            style={[styles.addBtn, { backgroundColor: saving ? '#93C5FD' : '#E60012' }]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>{isEdit ? 'Update Product' : 'Add Product'}</Text>
          </Pressable>
        </View>

        <BookingPickerSheet
          visible={dropdownVisible}
          title={dropdownTitle}
          onClose={() => {
            setDropdownSearch('');
            setDropdownVisible(false);
          }}
        >
          <View
            style={[
              styles.pickerSearchRow,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Feather name="search" size={16} color={colors.textTertiary} />
            <TextInput
              style={[styles.pickerSearchInput, { color: colors.textPrimary }]}
              placeholder={`Search ${dropdownTitle.replace(/^Select\s+/i, '').toLowerCase()}…`}
              placeholderTextColor={colors.textTertiary}
              value={dropdownSearch}
              onChangeText={setDropdownSearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {dropdownSearch.length > 0 ? (
              <Pressable
                onPress={() => setDropdownSearch('')}
                hitSlop={8}
              >
                <Feather name="x-circle" size={16} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {dropdownOptions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, paddingVertical: 12 }}>No options available</Text>
          ) : filteredDropdownOptions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, paddingVertical: 12 }}>
              No matches for “{dropdownSearch.trim()}”
            </Text>
          ) : (
            filteredDropdownOptions.map((option) => {
              const selected =
                option.value === selectedDropdownValue || option.label === selectedDropdownValue;
              return (
                <Pressable
                  key={`${option.value}-${option.label}`}
                  style={[
                    styles.pickerOption,
                    {
                      backgroundColor: selected ? colors.primarySubtle : colors.muted,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    handleDropdownSelect(option);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>
                    {option.label}
                  </Text>
                  {selected ? <Feather name="check" size={16} color={colors.primary} /> : null}
                </Pressable>
              );
            })
          )}
        </BookingPickerSheet>
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
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 10, marginTop: 1 },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveHeaderText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 16 },
  sectionBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E60012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionSubtitle: { fontSize: 10, marginTop: 1 },
  optionalTag: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  twoColRow: { flexDirection: 'row', gap: 12 },
  inputWrapper: { gap: 5 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 52,
  },
  fieldIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectFieldTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  selectFieldLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  selectFieldValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    padding: 0,
    marginTop: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  inputMultiline: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleSettingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleSettingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSettingTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  toggleSettingSubtitle: { fontSize: 10, marginTop: 1 },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  specText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium' },
  addChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addChipBtnText: { color: '#E60012', fontSize: 12, fontFamily: 'Inter_700Bold' },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagChipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  previewIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  previewSub: { fontSize: 10, marginTop: 2 },
  previewStats: { flexDirection: 'row', alignItems: 'center' },
  previewStatLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  previewStatValue: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  stickyAddBtn: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  addBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickerOptionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    paddingVertical: Platform.OS === 'ios' ? 2 : 8,
  },
});
