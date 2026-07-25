import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';

import { BookingPickerSheet } from '@components/booking/pickers/BookingPickerSheet';
import { ChromeHeader } from '@components/common';
import { AddVehicleStepper, DocumentUploadCard } from '@components/garage';
import { DatePickerSheet, formatDateDisplay, PhotoPermissionModal, PhotoPickerSheet, type PhotoPickerOption } from '@components/modals';
import { CustomerStackRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { getDropdownOptions } from '@services/dropdown.service';
import { createUserVehicle } from '@services/userVehicle.service';
import { lookupVehicleByPlate } from '@services/vehicleAlert.service';
import { uploadImage, uploadImagesBatch } from '@services/upload.service';
import { getString, setString } from '@storage/index';
import { StorageKeys } from '@storage/keys';
import type { DropdownOption } from '../../../types/dropdown';
import type { CreateVehicleRequest } from '../../../types/userVehicle';
import { extractAuthErrorMessage } from '@utils/authErrors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import {
  hasPhotoPermission,
  requestPhotoPermission,
  type PhotoSource,
} from '@utils/photoPermissions';

type Props = NativeStackScreenProps<CustomerStackParamList, typeof CustomerStackRoutes.AddVehicle>;

type VehicleTypeKey = 'two' | 'four' | 'other';
type PickerTarget =
  | 'vehiclePhoto'
  | 'rc'
  | 'insurance'
  | 'pollution'
  | 'dl'
  | 'additional';
type DropdownField = 'brand' | 'model' | 'variant' | 'fuel' | 'year' | 'color' | 'relation';

const PLATE_REGEX = /^[A-Z0-9]{6,15}$/i;
const MAX_VEHICLE_IMAGES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const VEHICLE_TYPE_TABS: { key: VehicleTypeKey; label: string }[] = [
  { key: 'two', label: 'Two Wheeler' },
  { key: 'four', label: 'Four Wheeler' },
  { key: 'other', label: 'Other' },
];

const VEHICLE_TYPE_MAP: Record<VehicleTypeKey, 'Bike' | 'Car'> = {
  two: 'Bike',
  four: 'Car',
  other: 'Car',
};

const YEAR_OPTIONS: DropdownOption[] = Array.from({ length: 30 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { label: String(y), value: String(y) };
});

const COLOR_OPTIONS: DropdownOption[] = [
  'White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Brown', 'Orange',
].map((c) => ({ label: c, value: c }));

const FUEL_OPTIONS: DropdownOption[] = [
  'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG',
].map((f) => ({ label: f, value: f }));

const RELATION_OPTIONS: DropdownOption[] = [
  { label: 'Father', value: 'Father' },
  { label: 'Mother', value: 'Mother' },
  { label: 'Spouse', value: 'Spouse' },
  { label: 'Sibling', value: 'Sibling' },
  { label: 'Friend', value: 'Friend' },
  { label: 'Client', value: 'Client' },
  { label: 'Other', value: 'Other' },
];

export function AddVehicleScreen({ navigation }: Props) {
  const colors = useColors();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicleTypeKey, setVehicleTypeKey] = useState<VehicleTypeKey>('four');
  const [ownerName, setOwnerName] = useState(user?.name ?? '');
  const [isOwnVehicle, setIsOwnVehicle] = useState(true);
  const [relation, setRelation] = useState('Self');
  const [numberPlate, setNumberPlate] = useState('');
  const [plateVerified, setPlateVerified] = useState(false);
  const [verifyingPlate, setVerifyingPlate] = useState(false);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseDatePickerVisible, setPurchaseDatePickerVisible] = useState(false);

  const [brandOptions, setBrandOptions] = useState<DropdownOption[]>([]);
  const [modelOptions, setModelOptions] = useState<DropdownOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [vehicleImageUris, setVehicleImageUris] = useState<string[]>([]);
  const [rcUri, setRcUri] = useState<string | null>(null);
  const [insuranceUri, setInsuranceUri] = useState<string | null>(null);
  const [pollutionUri, setPollutionUri] = useState<string | null>(null);
  const [dlUri, setDlUri] = useState<string | null>(null);
  const [additionalUri, setAdditionalUri] = useState<string | null>(null);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('vehiclePhoto');
  const [permissionVisible, setPermissionVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [pendingSource, setPendingSource] = useState<PhotoSource | null>(null);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownField, setDropdownField] = useState<DropdownField>('brand');

  const apiVehicleType = VEHICLE_TYPE_MAP[vehicleTypeKey];

  const purchaseDateMinimum = year
    ? new Date(parseInt(year, 10), 0, 1)
    : new Date(1990, 0, 1);
  const purchaseDateMaximum = new Date();

  useEffect(() => {
    const loadBrands = async () => {
      setLoadingBrands(true);
      try {
        const data = await getDropdownOptions(apiVehicleType);
        setBrandOptions(data.brands);
        setBrand('');
        setBrandId('');
        setModel('');
        setModelOptions([]);
      } finally {
        setLoadingBrands(false);
      }
    };
    void loadBrands();
  }, [apiVehicleType]);

  useEffect(() => {
    if (!brandId) {
      setModelOptions([]);
      return;
    }
    const loadModels = async () => {
      const data = await getDropdownOptions(apiVehicleType, brandId);
      setModelOptions(data.models);
      setModel('');
    };
    void loadModels();
  }, [apiVehicleType, brandId]);

  const openDropdown = (field: DropdownField) => {
    lightHaptic();
    setDropdownField(field);
    setDropdownVisible(true);
  };

  const getDropdownOptionsForField = (): DropdownOption[] => {
    switch (dropdownField) {
      case 'brand':
        return brandOptions;
      case 'model':
        return modelOptions;
      case 'fuel':
        return FUEL_OPTIONS;
      case 'year':
        return YEAR_OPTIONS;
      case 'color':
        return COLOR_OPTIONS;
      case 'variant':
        return modelOptions.length > 0
          ? modelOptions
          : [{ label: 'Standard', value: 'standard' }];
      case 'relation':
        return RELATION_OPTIONS;
      default:
        return [];
    }
  };

  const handleDropdownSelect = (value: string) => {
    const options = getDropdownOptionsForField();
    const selected = options.find((o) => o.value === value);
    if (!selected) return;

    switch (dropdownField) {
      case 'brand':
        setBrand(selected.label);
        setBrandId(selected.value);
        break;
      case 'model':
        setModel(selected.label);
        break;
      case 'variant':
        setVariant(selected.label);
        break;
      case 'fuel':
        setFuelType(selected.label);
        break;
      case 'year':
        setYear(selected.label);
        break;
      case 'color':
        setColor(selected.label);
        break;
      case 'relation':
        setRelation(selected.label);
        break;
    }
    setDropdownVisible(false);
  };

  const getSelectedDropdownValue = (): string => {
    switch (dropdownField) {
      case 'brand':
        return brandId;
      case 'model':
        return modelOptions.find((o) => o.label === model)?.value ?? '';
      case 'variant':
        return variant;
      case 'fuel':
        return fuelType;
      case 'year':
        return year;
      case 'color':
        return color;
      case 'relation':
        return relation;
      default:
        return '';
    }
  };

  const verifyPlate = async () => {
    lightHaptic();
    const plate = numberPlate.trim().toUpperCase();
    setPlateError(null);

    if (!plate) {
      setPlateError('Please enter a registration number.');
      setPlateVerified(false);
      return;
    }
    if (!PLATE_REGEX.test(plate)) {
      setPlateError('Number plate must be 6–15 alphanumeric characters.');
      setPlateVerified(false);
      return;
    }

    if (user?.isGuest) {
      Alert.alert('Sign in required', 'Please sign in to verify your vehicle.');
      return;
    }

    setVerifyingPlate(true);
    try {
      const result = await lookupVehicleByPlate(plate);
      if (result.found) {
        setPlateVerified(false);
        setPlateError('A vehicle with this number plate already exists.');
        return;
      }
      setPlateVerified(true);
      successHaptic();
    } catch (err) {
      setPlateVerified(false);
      setPlateError(extractAuthErrorMessage(err));
    } finally {
      setVerifyingPlate(false);
    }
  };

  useEffect(() => {
    if (step !== 4) return;
    const timer = setTimeout(() => {
      navigation.goBack();
    }, 2000);
    return () => clearTimeout(timer);
  }, [step, navigation]);

  const filterAssets = (assets: Asset[], label: string): Asset[] => {
    const oversized = assets.filter(
      (a) => typeof a.fileSize === 'number' && a.fileSize > MAX_FILE_BYTES,
    );
    if (oversized.length > 0) {
      Alert.alert('File too large', `${label} must be under 5MB.`);
    }
    return assets.filter((a) => !a.fileSize || a.fileSize <= MAX_FILE_BYTES);
  };

  const applyPickedImages = useCallback(
    (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) {
        if (response.errorCode === 'permission') {
          setPendingSource(null);
          setPermissionDenied(true);
          setPermissionVisible(true);
        }
        return;
      }

      const valid = filterAssets(response.assets ?? [], 'File');
      const uris = valid.map((a) => a.uri).filter((u): u is string => Boolean(u));
      if (uris.length === 0) return;

      switch (pickerTarget) {
        case 'vehiclePhoto':
          setVehicleImageUris((prev) => [...prev, ...uris].slice(0, MAX_VEHICLE_IMAGES));
          break;
        case 'rc':
          setRcUri(uris[0]);
          break;
        case 'insurance':
          setInsuranceUri(uris[0]);
          break;
        case 'pollution':
          setPollutionUri(uris[0]);
          break;
        case 'dl':
          setDlUri(uris[0]);
          break;
        case 'additional':
          setAdditionalUri(uris[0]);
          break;
        default:
          break;
      }
    },
    [pickerTarget],
  );

  const openNativePicker = (source: PhotoSource) => {
    const isVehicle = pickerTarget === 'vehiclePhoto';
    const remaining = MAX_VEHICLE_IMAGES - vehicleImageUris.length;
    const options = {
      mediaType: 'photo' as const,
      selectionLimit: isVehicle ? remaining : 1,
      quality: 0.8 as const,
      maxWidth: 1600,
      maxHeight: 1600,
      includeBase64: false,
    };

    if (source === 'camera') {
      launchCamera(options, applyPickedImages);
    } else {
      launchImageLibrary(options, applyPickedImages);
    }
  };

  const beginPhotoPick = async (source: PhotoSource) => {
    setPendingSource(source);
    const rationaleAccepted = await getString(StorageKeys.PHOTO_PERMISSION_RATIONALE);
    const systemGranted = await hasPhotoPermission(source);

    if (rationaleAccepted === 'true' && systemGranted) {
      openNativePicker(source);
      setPendingSource(null);
      return;
    }

    setPermissionDenied(false);
    setPermissionVisible(true);
  };

  const openPhotoFlow = (target: PickerTarget) => {
    lightHaptic();
    setPickerTarget(target);
    if (target === 'vehiclePhoto' && vehicleImageUris.length >= MAX_VEHICLE_IMAGES) {
      Alert.alert('Limit reached', `You can add up to ${MAX_VEHICLE_IMAGES} photos.`);
      return;
    }
    setPickerVisible(true);
  };

  const handlePhotoPickerSelect = (option: PhotoPickerOption) => {
    void beginPhotoPick(option);
  };

  const handlePermissionAllow = async () => {
    if (!pendingSource) return;
    setPermissionLoading(true);
    try {
      await setString(StorageKeys.PHOTO_PERMISSION_RATIONALE, 'true');
      const granted = await requestPhotoPermission(pendingSource);
      if (granted) {
        setPermissionVisible(false);
        const source = pendingSource;
        setPendingSource(null);
        setPermissionDenied(false);
        openNativePicker(source);
        return;
      }
      setPermissionDenied(true);
    } finally {
      setPermissionLoading(false);
    }
  };

  const handlePermissionDeny = () => {
    setPermissionVisible(false);
    setPermissionDenied(false);
    setPendingSource(null);
  };

  const uploadDocument = async (uri: string | null): Promise<string | undefined> => {
    if (!uri) return undefined;
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    return uploadImage(uri);
  };

  const validateStep1 = (): boolean => {
    if (!brand.trim() || !model.trim()) {
      Alert.alert('Required', 'Please select brand and model.');
      return false;
    }
    if (!numberPlate.trim() || !plateVerified) {
      Alert.alert('Required', 'Please enter and verify your registration number.');
      return false;
    }
    if (!rcUri) {
      Alert.alert('Required', 'Please upload your RC document.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!dlUri) {
      Alert.alert('Required', 'Please upload your driving licence.');
      return false;
    }
    return true;
  };

  const uploadedDocCount = [rcUri, insuranceUri, pollutionUri, dlUri].filter(Boolean).length;

  const handleContinue = () => {
    lightHaptic();
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 4) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1 && step < 4) {
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (user?.isGuest) {
      Alert.alert('Sign in required', 'Please sign in to add a vehicle.');
      return;
    }

    lightHaptic();
    setSubmitting(true);
    setError(null);

    try {
      const uploadedImages = vehicleImageUris.length > 0
        ? await uploadImagesBatch(vehicleImageUris.map((uri) => ({ uri })))
        : [];

      const [rcUrl, insuranceUrl, pollutionUrl, dlUrl] = await Promise.all([
        uploadDocument(rcUri),
        uploadDocument(insuranceUri),
        uploadDocument(pollutionUri),
        uploadDocument(dlUri),
      ]);

      const payload: CreateVehicleRequest = {
        brand: brand.trim(),
        model: model.trim(),
        numberPlate: numberPlate.trim().toUpperCase(),
        images: uploadedImages,
        year: year ? parseInt(year, 10) : undefined,
        color: color.trim() || undefined,
        isOwnVehicle,
        relation: isOwnVehicle ? 'Self' : relation,
        documents: {
          ...(rcUrl ? { rc: rcUrl } : {}),
          ...(insuranceUrl ? { insurance: insuranceUrl } : {}),
          ...(pollutionUrl ? { pollution: pollutionUrl } : {}),
          ...(dlUrl ? { dl: dlUrl } : {}),
        },
      };

      await createUserVehicle(payload);
      successHaptic();
      setStep(4);
    } catch (err) {
      setError(extractAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderDropdownField = (
    label: string,
    value: string,
    field: DropdownField,
    placeholder: string,
  ) => (
    <Pressable
      style={[styles.fieldHalf, { borderColor: colors.border, backgroundColor: colors.card }]}
      onPress={() => openDropdown(field)}
    >
      <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>{label}</Text>
      <View style={styles.fieldValueRow}>
        <Text
          style={[
            styles.fieldValue,
            { color: value ? colors.textPrimary : colors.placeholder },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Feather name="chevron-down" size={14} color={colors.textTertiary} />
      </View>
    </Pressable>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.introHeader}>
        <Text style={[styles.introTitleText, { color: colors.textPrimary }]}>
          Add your vehicle details
        </Text>
        <Text style={[styles.introSubText, { color: colors.textSecondary }]}>
          Get personalised services and recommendations for your vehicle.
        </Text>
      </View>

      {/* Vehicle Cover Photo Banner */}
      <Pressable
        style={[styles.coverBannerContainer, { borderColor: colors.border }]}
        onPress={() => {
          lightHaptic();
          openPhotoFlow('vehiclePhoto');
        }}
      >
        {vehicleImageUris.length > 0 ? (
          <View style={styles.coverImageWrapper}>
            <Image source={{ uri: vehicleImageUris[0] }} style={styles.coverImage} resizeMode="cover" />
            <View style={styles.coverEditBadge}>
              <Feather name="camera" size={12} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.coverEditText}>Edit Cover Photo</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: colors.primarySubtle }]}>
            <Feather name="camera" size={24} color={colors.primary} />
            <Text style={[styles.coverPlaceholderTitle, { color: colors.textPrimary }]}>
              Add Cover Photo
            </Text>
            <Text style={[styles.coverPlaceholderSub, { color: colors.textSecondary }]}>
              Upload a cover photo for your vehicle (Optional)
            </Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vehicle Type</Text>
      <View style={[styles.typeTabsRow, { borderBottomColor: colors.border }]}>
        {VEHICLE_TYPE_TABS.map((item) => {
          const selected = vehicleTypeKey === item.key;
          return (
            <Pressable
              key={item.key}
              style={styles.typeTab}
              onPress={() => {
                lightHaptic();
                setVehicleTypeKey(item.key);
              }}
            >
              <Text
                style={[
                  styles.typeTabText,
                  {
                    color: selected ? colors.primary : colors.textSecondary,
                    fontFamily: selected ? 'Inter_700Bold' : 'Inter_500Medium',
                  },
                ]}
              >
                {item.label}
              </Text>
              {selected ? (
                <View style={[styles.typeTabIndicator, { backgroundColor: colors.primary }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Registration Number</Text>
      <View style={[styles.plateRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.platePrefix}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={[styles.indText, { color: colors.textSecondary }]}>IND</Text>
        </View>
        <TextInput
          style={[styles.plateInput, { color: colors.textPrimary }]}
          placeholder="KA 01 AB 1234"
          placeholderTextColor={colors.placeholder}
          value={numberPlate}
          onChangeText={(t) => {
            setNumberPlate(t.toUpperCase());
            setPlateVerified(false);
            setPlateError(null);
          }}
          autoCapitalize="characters"
        />
        <Pressable
          style={[
            styles.verifyBtn,
            {
              backgroundColor: plateVerified ? colors.success : colors.primary,
              opacity: verifyingPlate ? 0.7 : 1,
            },
          ]}
          onPress={() => void verifyPlate()}
          disabled={verifyingPlate}
        >
          {verifyingPlate ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.verifyText, { color: colors.primaryForeground }]}>
              {plateVerified ? 'Verified' : 'Verify'}
            </Text>
          )}
        </Pressable>
      </View>
      {plateError ? (
        <Text style={[styles.plateError, { color: colors.destructive }]}>{plateError}</Text>
      ) : plateVerified ? (
        <Text style={[styles.plateSuccess, { color: colors.success }]}>
          Registration number is available.
        </Text>
      ) : null}

      <Text style={[styles.fieldLabelFull, { color: colors.textTertiary }]}>Vehicle Owner Name</Text>
      <TextInput
        style={[styles.textField, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.card }]}
        value={ownerName}
        onChangeText={setOwnerName}
        placeholder="Full name as on RC"
        placeholderTextColor={colors.placeholder}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary }}>Is this vehicle owned by you?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['Yes', 'No'] as const).map((opt) => {
            const selected = opt === 'Yes' ? isOwnVehicle : !isOwnVehicle;
            return (
              <Pressable
                key={opt}
                onPress={() => {
                  lightHaptic();
                  setIsOwnVehicle(opt === 'Yes');
                  if (opt === 'Yes') {
                    setRelation('Self');
                    setOwnerName(user?.name ?? '');
                  } else {
                    setRelation('Father');
                    setOwnerName('');
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '10' : colors.card,
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: selected ? colors.primary : colors.textSecondary }}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!isOwnVehicle ? (
        <View style={{ marginBottom: 12, flexDirection: 'row' }}>
          {renderDropdownField('Relation', relation, 'relation', 'Select relation')}
        </View>
      ) : null}

      <View style={styles.fieldRow}>
        {renderDropdownField('Brand', brand, 'brand', loadingBrands ? 'Loading…' : 'Select brand')}
        {renderDropdownField('Model', model, 'model', brandId ? 'Select model' : 'Select brand first')}
      </View>

      <View style={styles.fieldRow}>
        {renderDropdownField('Variant', variant, 'variant', 'Select variant')}
        {renderDropdownField('Fuel Type', fuelType, 'fuel', 'Select fuel')}
      </View>

      <View style={styles.fieldRow}>
        {renderDropdownField('Year', year, 'year', 'Select year')}
        {renderDropdownField('Color', color, 'color', 'Select color')}
      </View>

      <Text style={[styles.fieldLabelFull, { color: colors.textTertiary }]}>
        Purchase Date (Optional)
      </Text>
      <Pressable
        style={[styles.dateField, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => {
          lightHaptic();
          setPurchaseDatePickerVisible(true);
        }}
      >
        <Feather name="calendar" size={18} color={colors.icon} />
        <Text
          style={[
            styles.dateFieldText,
            { color: purchaseDate ? colors.textPrimary : colors.placeholder },
          ]}
        >
          {purchaseDate ? formatDateDisplay(purchaseDate) : 'Select purchase date'}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.textTertiary} />
      </Pressable>

      <View style={styles.docSectionHeader}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
          Documents
        </Text>
      </View>
      <Text style={[styles.docSub, { color: colors.textTertiary }]}>
        Securely upload your vehicle documents
      </Text>

      <View style={styles.docGrid}>
        <DocumentUploadCard
          title="RC (Registration Certificate)"
          required
          icon="file-text"
          iconColor="#10B981"
          uri={rcUri}
          onPress={() => openPhotoFlow('rc')}
          onRemove={() => setRcUri(null)}
        />
        <DocumentUploadCard
          title="Insurance Certificate"
          icon="shield"
          iconColor="#3B82F6"
          uri={insuranceUri}
          onPress={() => openPhotoFlow('insurance')}
          onRemove={() => setInsuranceUri(null)}
        />
        <DocumentUploadCard
          title="PUC Certificate"
          icon="wind"
          iconColor="#8B5CF6"
          uri={pollutionUri}
          onPress={() => openPhotoFlow('pollution')}
          onRemove={() => setPollutionUri(null)}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <DocumentUploadCard
        title="Driving License"
        required
        icon="credit-card"
        iconColor="#E60012"
        uri={dlUri}
        onPress={() => openPhotoFlow('dl')}
        onRemove={() => setDlUri(null)}
      />

      <DocumentUploadCard
        title="Additional Documents (Optional)"
        icon="paperclip"
        iconColor="#64748B"
        uri={additionalUri}
        onPress={() => openPhotoFlow('additional')}
        onRemove={() => setAdditionalUri(null)}
      />

      <View style={[styles.infoBox, { backgroundColor: colors.primarySubtle }]}>
        <Text style={[styles.infoTitle, { color: colors.primary }]}>Why we need these documents?</Text>
        {[
          'Verify vehicle ownership for service bookings',
          'Enable insurance and PUC expiry reminders',
          'Keep your garage documents in one place',
        ].map((item) => (
          <View key={item} style={styles.infoRow}>
            <Feather name="check-circle" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.tipsBox, { backgroundColor: '#FEF9C3' }]}>
        <Text style={[styles.infoTitle, { color: '#A16207' }]}>Document Tips</Text>
        {[
          'Ensure documents are clear and readable',
          'All corners of the document should be visible',
          'File size must be under 5MB',
        ].map((item) => (
          <View key={item} style={styles.infoRow}>
            <View style={styles.tipDot} />
            <Text style={[styles.infoText, { color: '#854D0E' }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Review & Confirm</Text>

      <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {vehicleImageUris[0] ? (
          <Image source={{ uri: vehicleImageUris[0] }} style={styles.reviewImage} resizeMode="cover" />
        ) : null}
        <View style={styles.reviewBody}>
          <Text style={[styles.reviewName, { color: colors.textPrimary }]}>
            {brand} {model}
          </Text>
          {variant ? (
            <Text style={[styles.reviewMeta, { color: colors.textSecondary }]}>{variant}</Text>
          ) : null}
          <Text style={[styles.reviewPlate, { color: colors.textPrimary }]}>{numberPlate}</Text>
          <View style={styles.reviewChips}>
            {year ? <Chip label={year} colors={colors} /> : null}
            {fuelType ? <Chip label={fuelType} colors={colors} /> : null}
            {color ? <Chip label={color} colors={colors} /> : null}
          </View>
          {ownerName ? (
            <Text style={[styles.reviewMeta, { color: colors.textSecondary }]}>
              Owner: {ownerName}
            </Text>
          ) : null}
          {purchaseDate ? (
            <Text style={[styles.reviewMeta, { color: colors.textSecondary }]}>
              Purchased: {formatDateDisplay(purchaseDate)}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Documents Uploaded ({uploadedDocCount}/4)
      </Text>
      {[
        { label: 'RC Certificate', done: Boolean(rcUri) },
        { label: 'Insurance', done: Boolean(insuranceUri) },
        { label: 'PUC Certificate', done: Boolean(pollutionUri) },
        { label: 'Driving License', done: Boolean(dlUri) },
      ].map((doc) => (
        <View key={doc.label} style={styles.checkRow}>
          <Feather
            name={doc.done ? 'check-circle' : 'circle'}
            size={16}
            color={doc.done ? colors.success : colors.textTertiary}
          />
          <Text style={[styles.checkText, { color: colors.textSecondary }]}>{doc.label}</Text>
        </View>
      ))}

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      <View style={styles.secureNote}>
        <Feather name="lock" size={12} color={colors.textTertiary} />
        <Text style={[styles.secureText, { color: colors.textTertiary }]}>
          Your information is encrypted and secure.
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={[styles.completeWrap, styles.stepContent]}>
      <View style={[styles.completeIconRing, { borderColor: colors.success }]}>
        <View style={[styles.completeIcon, { backgroundColor: colors.success }]}>
          <Feather name="check" size={40} color="#fff" />
        </View>
      </View>
      <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>Vehicle Added!</Text>
      <Text style={[styles.completeSub, { color: colors.textSecondary }]}>
        Your vehicle has been added to your garage successfully.
      </Text>

      <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {vehicleImageUris[0] ? (
          <Image source={{ uri: vehicleImageUris[0] }} style={styles.successImage} resizeMode="cover" />
        ) : null}
        <View style={styles.successCardBody}>
          <Text style={[styles.successVehicleName, { color: colors.textPrimary }]}>
            {brand} {model}
          </Text>
          <Text style={[styles.successPlate, { color: colors.textSecondary }]}>{numberPlate}</Text>
          <View style={styles.successChips}>
            {year ? <Chip label={year} colors={colors} /> : null}
            {color ? <Chip label={color} colors={colors} /> : null}
          </View>
        </View>
      </View>

      <View style={styles.redirectRow}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.redirectText, { color: colors.textTertiary }]}>
          Taking you to My Garage…
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PhotoPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handlePhotoPickerSelect}
      />

      <PhotoPermissionModal
        visible={permissionVisible && pendingSource !== null}
        source={pendingSource ?? 'gallery'}
        variant={permissionDenied ? 'denied' : 'request'}
        loading={permissionLoading}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />

      <DatePickerSheet
        visible={purchaseDatePickerVisible}
        onClose={() => setPurchaseDatePickerVisible(false)}
        title="Purchase Date"
        selectedDate={purchaseDate || undefined}
        minimumDate={purchaseDateMinimum}
        maximumDate={purchaseDateMaximum}
        onDateSelect={setPurchaseDate}
      />

      <BookingPickerSheet
        visible={dropdownVisible}
        title={`Select ${dropdownField}`}
        onClose={() => setDropdownVisible(false)}
      >
        {getDropdownOptionsForField().map((option) => {
          const selected = getSelectedDropdownValue() === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.pickerOption,
                {
                  backgroundColor: selected ? colors.primarySubtle : colors.muted,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleDropdownSelect(option.value)}
            >
              <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>
                {option.label}
              </Text>
              {selected ? <Feather name="check" size={16} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </BookingPickerSheet>

      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={handleBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>
            Add Your Vehicle
          </Text>
          <View style={styles.headerBtn} />
        </View>
        {step < 4 && <AddVehicleStepper currentStep={step} />}
      </ChromeHeader>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        {step < 4 && (
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            {step === 3 ? (
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: submitting ? colors.disabled : colors.primary }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                    Add Vehicle
                  </Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleContinue}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Continue</Text>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function Chip({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <Text style={[chipStyles.text, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: { paddingBottom: 24 },
  stepContent: { padding: 16, gap: 14 },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  introText: { flex: 1, gap: 4 },
  introTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  introSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  typeTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  typeTabText: {
    fontSize: 12,
    textAlign: 'center',
  },
  typeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '12%',
    right: '12%',
    height: 2.5,
    borderRadius: 2,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  platePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  flag: { fontSize: 14 },
  indText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  plateInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  verifyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    margin: 4,
    borderRadius: 8,
  },
  verifyText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  plateError: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: -6,
  },
  plateSuccess: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: -6,
  },
  fieldLabelFull: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginBottom: -8,
  },
  textField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateFieldText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  fieldValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldValue: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  docSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  docSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: -8 },
  docGrid: { gap: 10 },
  extraPhotos: { marginTop: -4 },
  extraThumbWrap: { marginRight: 8, position: 'relative' },
  extraThumb: { width: 64, height: 64, borderRadius: 8 },
  removeThumb: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: { borderRadius: 12, padding: 14, gap: 8 },
  tipsBox: { borderRadius: 12, padding: 14, gap: 8 },
  infoTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A16207',
    marginTop: 5,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reviewImage: { width: '100%', height: 140 },
  reviewBody: { padding: 14, gap: 4 },
  reviewName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  reviewMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  reviewPlate: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  reviewChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  secureText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  completeWrap: { alignItems: 'center', paddingTop: 32 },
  completeIconRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  completeSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  successCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  successImage: { width: '100%', height: 120 },
  successCardBody: { padding: 14, gap: 4 },
  successVehicleName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  successPlate: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  successChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  redirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redirectText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
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
  introHeader: {
    marginBottom: 16,
    gap: 4,
  },
  introTitleText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  introSubText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  coverBannerContainer: {
    height: 150,
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 16,
  },
  coverImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverEditBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  coverEditText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 4,
  },
  coverPlaceholderTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginTop: 6,
  },
  coverPlaceholderSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
