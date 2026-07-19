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
import { ChromeHeader } from '@components/common';
import { InventoryImageUploadSection } from '@components/dealer/InventoryImageUploadSection';
import { VehicleDetailSkeleton } from '@components/loaders';
import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import {
  createDealerVehicle,
  deleteDealerVehicle,
  getDealerInventoryVehicles,
  updateDealerVehicle,
} from '@services/dealer.service';
import { getDropdownOptions } from '@services/dropdown.service';
import { themeLight } from '@theme/colors';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getVehicleId } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import type {
  FuelType,
  TransmissionType,
  VehicleAvailability,
  VehicleCondition,
  VehicleType,
} from '@app-types/vehicle';
import type { DropdownOption } from '../../../types/dropdown';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.VehicleForm>;

type DropdownField =
  | 'brand'
  | 'model'
  | 'fuelType'
  | 'transmission'
  | 'condition'
  | 'availability';

const MAX_IMAGES = 3;

const FUEL_OPTIONS: DropdownOption[] = [
  { label: 'Petrol', value: 'Petrol' },
  { label: 'Diesel', value: 'Diesel' },
  { label: 'Electric', value: 'Electric' },
  { label: 'Hybrid', value: 'Hybrid' },
];

const TRANSMISSION_OPTIONS: DropdownOption[] = [
  { label: 'Manual', value: 'Manual' },
  { label: 'Automatic', value: 'Automatic' },
];

const CONDITION_OPTIONS: DropdownOption[] = [
  { label: 'New', value: 'New' },
  { label: 'Used', value: 'Used' },
  { label: 'Certified Pre-owned', value: 'Certified Pre-owned' },
];

const AVAILABILITY_OPTIONS: DropdownOption[] = [
  { label: 'Available', value: 'available' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Sold', value: 'sold' },
];

function availabilityLabel(value: VehicleAvailability): string {
  return AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function VehicleFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const editId = route.params?.id;
  const isEdit = !!editId;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [loadingVehicle, setLoadingVehicle] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [vehicleBrandId, setVehicleBrandId] = useState('');
  const [vehicleBrandLabel, setVehicleBrandLabel] = useState('');
  const [vehicleModelId, setVehicleModelId] = useState('');
  const [vehicleModelLabel, setVehicleModelLabel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [fuelType, setFuelType] = useState<FuelType | ''>('');
  const [transmission, setTransmission] = useState<TransmissionType | ''>('');
  const [condition, setCondition] = useState<VehicleCondition | ''>('');
  const [availability, setAvailability] = useState<VehicleAvailability | ''>('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [allowTestDrive, setAllowTestDrive] = useState(true);

  const [vehicleBrands, setVehicleBrands] = useState<DropdownOption[]>([]);
  const [vehicleModels, setVehicleModels] = useState<DropdownOption[]>([]);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownField, setDropdownField] = useState<DropdownField>('brand');
  const [dropdownSearch, setDropdownSearch] = useState('');

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
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingVehicle(true);
        const response = await getDealerInventoryVehicles({ limit: 1000 });
        const vehicle = (response.Response?.vehicles ?? []).find(
          (item) => getVehicleId(item) === editId,
        );
        if (!cancelled && vehicle) {
          setImages(vehicle.images?.length ? vehicle.images : []);
          setVehicleType(
            vehicle.vehicleType === 'Car' || vehicle.vehicleType === 'Bike'
              ? vehicle.vehicleType
              : '',
          );
          setVehicleBrandId(vehicle.vehicleBrandId || '');
          setVehicleBrandLabel(vehicle.brand || '');
          setVehicleModelId(vehicle.vehicleModelId || '');
          setVehicleModelLabel(vehicle.vehicleModel || '');
          setNumberPlate(vehicle.numberPlate || '');
          setYear(String(vehicle.year || new Date().getFullYear()));
          setPrice(String(vehicle.price ?? ''));
          setColor(vehicle.color || '');
          setMileage(vehicle.mileage != null ? String(vehicle.mileage) : '');
          setDescription(vehicle.description || '');
          setFuelType(vehicle.fuelType || '');
          setTransmission(vehicle.transmission || '');
          setCondition(vehicle.condition || '');
          setAvailability(vehicle.availability || '');
          setFeatures(vehicle.features ?? []);
          setAllowTestDrive(vehicle.allowTestDrive ?? true);
        }
      } catch (error) {
        if (!cancelled) {
          Alert.alert('Error', getApiErrorMessage(error, 'Failed to load vehicle'));
        }
      } finally {
        if (!cancelled) setLoadingVehicle(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  useEffect(() => {
    if (!vehicleBrandId || !vehicleBrands.length) return;
    const match = vehicleBrands.find((b) => b.value === vehicleBrandId);
    if (match) setVehicleBrandLabel(match.label);
  }, [vehicleBrands, vehicleBrandId]);

  useEffect(() => {
    if (!vehicleModelId || !vehicleModels.length) return;
    const match = vehicleModels.find((m) => m.value === vehicleModelId);
    if (match) setVehicleModelLabel(match.label);
  }, [vehicleModels, vehicleModelId]);

  const openDropdown = (field: DropdownField) => {
    lightHaptic();
    setDropdownField(field);
    setDropdownSearch('');
    setDropdownVisible(true);
  };

  const dropdownOptions = useMemo((): DropdownOption[] => {
    switch (dropdownField) {
      case 'brand':
        return vehicleBrands;
      case 'model':
        return vehicleModels;
      case 'fuelType':
        return FUEL_OPTIONS;
      case 'transmission':
        return TRANSMISSION_OPTIONS;
      case 'condition':
        return CONDITION_OPTIONS;
      case 'availability':
        return AVAILABILITY_OPTIONS;
      default:
        return [];
    }
  }, [dropdownField, vehicleBrands, vehicleModels]);

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
      case 'model':
        return 'Select Model';
      case 'fuelType':
        return 'Select Fuel Type';
      case 'transmission':
        return 'Select Transmission';
      case 'condition':
        return 'Select Condition';
      case 'availability':
        return 'Select Availability';
      default:
        return 'Select';
    }
  }, [dropdownField]);

  const selectedDropdownValue = useMemo(() => {
    switch (dropdownField) {
      case 'brand':
        return vehicleBrandId;
      case 'model':
        return vehicleModelId;
      case 'fuelType':
        return fuelType;
      case 'transmission':
        return transmission;
      case 'condition':
        return condition;
      case 'availability':
        return availability;
      default:
        return '';
    }
  }, [
    dropdownField,
    vehicleBrandId,
    vehicleModelId,
    fuelType,
    transmission,
    condition,
    availability,
  ]);

  const handleDropdownSelect = (option: DropdownOption) => {
    switch (dropdownField) {
      case 'brand':
        setVehicleBrandId(option.value);
        setVehicleBrandLabel(option.label);
        setVehicleModelId('');
        setVehicleModelLabel('');
        break;
      case 'model':
        setVehicleModelId(option.value);
        setVehicleModelLabel(option.label);
        break;
      case 'fuelType':
        setFuelType(option.value as FuelType);
        break;
      case 'transmission':
        setTransmission(option.value as TransmissionType);
        break;
      case 'condition':
        setCondition(option.value as VehicleCondition);
        break;
      case 'availability':
        setAvailability(option.value as VehicleAvailability);
        break;
      default:
        break;
    }
    setDropdownSearch('');
    setDropdownVisible(false);
  };

  const addFeature = () => {
    const next = featureInput.trim();
    if (!next) return;
    if (features.includes(next)) {
      setFeatureInput('');
      return;
    }
    setFeatures((prev) => [...prev, next]);
    setFeatureInput('');
  };

  const handleSave = async () => {
    if (!vehicleType) {
      Alert.alert('Missing Fields', 'Please select Vehicle Type (Car or Bike).');
      return;
    }
    if (!vehicleBrandId || !vehicleBrandLabel.trim()) {
      Alert.alert('Missing Fields', 'Please select a Brand.');
      return;
    }
    if (!vehicleModelId || !vehicleModelLabel.trim()) {
      Alert.alert('Missing Fields', 'Please select a Model.');
      return;
    }
    if (!numberPlate.trim()) {
      Alert.alert('Missing Fields', 'Please enter a Number Plate.');
      return;
    }
    const parsedYear = parseInt(year, 10);
    if (!Number.isFinite(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Price', 'Price must be greater than 0.');
      return;
    }
    if (!color.trim()) {
      Alert.alert('Missing Fields', 'Please enter a Color.');
      return;
    }
    const parsedMileage = parseInt(mileage, 10);
    if (!Number.isFinite(parsedMileage) || parsedMileage < 0) {
      Alert.alert('Invalid Mileage', 'Please enter a valid mileage (0 or greater).');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Fields', 'Please enter a Description.');
      return;
    }
    if (!fuelType) {
      Alert.alert('Missing Fields', 'Please select a Fuel Type.');
      return;
    }
    if (!transmission) {
      Alert.alert('Missing Fields', 'Please select a Transmission.');
      return;
    }
    if (!condition) {
      Alert.alert('Missing Fields', 'Please select a Condition.');
      return;
    }
    if (!availability) {
      Alert.alert('Missing Fields', 'Please select Availability.');
      return;
    }
    lightHaptic();
    setSaving(true);
    try {
      const payload = {
        vehicleType: vehicleType as VehicleType,
        vehicleBrandId,
        vehicleModelId,
        brand: vehicleBrandLabel.trim(),
        vehicleModel: vehicleModelLabel.trim(),
        year: parsedYear,
        price: parsedPrice,
        availability: availability as VehicleAvailability,
        images,
        numberPlate: numberPlate.trim().toUpperCase(),
        mileage: parsedMileage,
        color: color.trim(),
        fuelType: fuelType as FuelType,
        transmission: transmission as TransmissionType,
        description: description.trim(),
        features,
        condition: condition as VehicleCondition,
        allowTestDrive,
      };

      if (isEdit && editId) {
        await updateDealerVehicle(editId, payload);
      } else {
        await createDealerVehicle(payload);
      }
      successHaptic();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to save vehicle'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert('Delete Vehicle', 'Remove this vehicle from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await deleteDealerVehicle(editId);
            successHaptic();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to delete vehicle'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loadingVehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <VehicleDetailSkeleton />
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
              {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.72)' }]}>
              Add a new vehicle to your fleet
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
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumberBadge}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Vehicle Images
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Optional — up to {MAX_IMAGES} images
                </Text>
              </View>
            </View>
            <InventoryImageUploadSection
              imageUris={images}
              maxImages={MAX_IMAGES}
              title="Upload clear photos of your vehicle"
              onImagesChange={setImages}
            />
          </View>

          {/* 2. Basic Information */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#1E3A8A' }]}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Information</Text>
            </View>

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

            {renderSelectRow(
              'Brand',
              vehicleBrandLabel,
              vehicleType ? 'Select brand' : 'Select vehicle type first',
              () => openDropdown('brand'),
              'shield',
              true,
              !vehicleType,
            )}

            {renderSelectRow(
              'Model',
              vehicleModelLabel,
              vehicleBrandId ? 'Select model' : 'Select brand first',
              () => openDropdown('model'),
              'git-branch',
              true,
              !vehicleBrandId,
            )}

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Number Plate *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="MH12AB1234"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                value={numberPlate}
                onChangeText={(v) => setNumberPlate(v.toUpperCase())}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Year *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="2024"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={year}
                  onChangeText={setYear}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="White"
                  placeholderTextColor={colors.textTertiary}
                  value={color}
                  onChangeText={setColor}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description *</Text>
              <TextInput
                style={[
                  styles.inputMultiline,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="Describe the vehicle condition, history, and highlights."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* 3. Specifications */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Specifications</Text>
            </View>

            {renderSelectRow(
              'Fuel Type',
              fuelType,
              'Select fuel type',
              () => openDropdown('fuelType'),
              'droplet',
              true,
            )}

            {renderSelectRow(
              'Transmission',
              transmission,
              'Select transmission',
              () => openDropdown('transmission'),
              'sliders',
              true,
            )}

            {renderSelectRow(
              'Condition',
              condition,
              'Select condition',
              () => openDropdown('condition'),
              'award',
              true,
            )}

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mileage (km) *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="15000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={mileage}
                onChangeText={setMileage}
              />
            </View>
          </View>

          {/* 4. Pricing & Availability */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.sectionNumberText}>4</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Pricing & Availability
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Price (₹) *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="850000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            {renderSelectRow(
              'Availability',
              availability ? availabilityLabel(availability) : '',
              'Select availability',
              () => openDropdown('availability'),
              'check-circle',
              true,
            )}

            <View
              style={[
                styles.toggleSettingRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.toggleSettingLeft}>
                <View style={[styles.toggleSettingIcon, { backgroundColor: '#F2F2F2' }]}>
                  <Feather name="calendar" size={14} color={colors.icon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleSettingTitle, { color: colors.textPrimary }]}>
                    Allow Test Drive
                  </Text>
                  <Text style={[styles.toggleSettingSubtitle, { color: colors.textSecondary }]}>
                    Customers can book a test drive for this vehicle
                  </Text>
                </View>
              </View>
              <Switch
                value={allowTestDrive}
                onValueChange={(v) => {
                  lightHaptic();
                  setAllowTestDrive(v);
                }}
                trackColor={{ false: '#E2E8F0', true: '#E60012' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* 5. Features */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.sectionNumberText}>5</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Features{' '}
                <Text style={[styles.optionalTag, { color: colors.textSecondary }]}>(Optional)</Text>
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.chipRow}>
                {features.map((feature) => (
                  <Pressable
                    key={feature}
                    style={[styles.tagChip, { backgroundColor: colors.muted }]}
                    onPress={() => setFeatures((prev) => prev.filter((f) => f !== feature))}
                  >
                    <Text style={[styles.tagChipText, { color: colors.textPrimary }]}>{feature}</Text>
                    <Feather name="x" size={12} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.featureInputRow}>
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
                  placeholder="Add feature (e.g. Sunroof)"
                  placeholderTextColor={colors.textTertiary}
                  value={featureInput}
                  onChangeText={setFeatureInput}
                  onSubmitEditing={addFeature}
                />
                <Pressable style={styles.addChipBtn} onPress={addFeature}>
                  <Text style={styles.addChipBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.previewFooter, { backgroundColor: '#F2F2F2', borderTopColor: colors.border }]}>
          <View style={[styles.previewIconBox, { backgroundColor: '#F2F2F2' }]}>
            <Feather name="truck" size={18} color={colors.icon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: '#1E3A8A' }]}>Vehicle Summary</Text>
            <Text style={[styles.previewSub, { color: '#FF1A1A' }]}>
              {vehicleBrandLabel || 'Brand'} • {vehicleModelLabel || 'Model'} •{' '}
              {vehicleType || 'Type'}
            </Text>
          </View>
          <View style={styles.previewStats}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Year</Text>
              <Text style={[styles.previewStatValue, { color: '#10B981' }]}>{year || '—'}</Text>
            </View>
            <View style={{ alignItems: 'center', marginLeft: 14 }}>
              <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Price</Text>
              <Text style={[styles.previewStatValue, { color: themeLight.textSecondary }]}>
                ₹{price || '0'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.stickyAddBtn, { paddingBottom: bottomPad + 8 }]}>
          <Pressable
            style={[styles.addBtn, { backgroundColor: saving ? '#93C5FD' : '#E60012' }]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Feather name={isEdit ? 'check' : 'plus'} size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>{isEdit ? 'Update Vehicle' : 'Add Vehicle'}</Text>
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
              <Pressable onPress={() => setDropdownSearch('')} hitSlop={8}>
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
  featureInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
