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
import { ServiceDetailSkeleton } from '@components/loaders';
import { useColors } from '@hooks/useColors';
import {
  createDealerService,
  deleteDealerService,
  getDealerServices,
  updateDealerService,
} from '@services/dealer.service';
import {
  getServiceCategories,
  type DeliveryModeValue,
  type IServiceSection,
  type ServicePackageValue,
  type ServiceTypeValue,
} from '@services/serviceCategory.service';
import { themeLight } from '@theme/colors';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getServiceDurationLabel, getServiceId, parseDurationMinutes } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.ServiceForm>;

type PickerField = 'section' | 'subcategory' | 'package';

const MAX_IMAGES = 3;

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

function resolveSectionForService(
  sections: IServiceSection[],
  serviceType?: ServiceTypeValue | string,
  vehicleType?: 'Car' | 'Bike',
): IServiceSection | undefined {
  if (!serviceType) return undefined;
  const byType = sections.filter((s) => s.serviceType === serviceType);
  if (!byType.length) return undefined;
  if (vehicleType) {
    const exact = byType.find(
      (s) => s.vehicleType === vehicleType || s.vehicleType === 'Both' || !s.vehicleType,
    );
    if (exact) return exact;
  }
  return byType[0];
}

export function ServiceFormScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const editId = route.params?.id;
  const isEdit = !!editId;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [loadingService, setLoadingService] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<IServiceSection[]>([]);

  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [durationLabel, setDurationLabel] = useState('1 hr');
  const [durationMinutes, setDurationMinutes] = useState('60');

  const [sectionId, setSectionId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceTypeValue | undefined>();
  const [serviceSubCategory, setServiceSubCategory] = useState('');
  const [servicePackage, setServicePackage] = useState<ServicePackageValue>('basic');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryModeValue | null>(null);
  const [homeService, setHomeService] = useState(false);
  const [serviceCoverageAreas, setServiceCoverageAreas] = useState('');
  const [travelFeeEnabled, setTravelFeeEnabled] = useState(false);
  const [travelFeeFreeKm, setTravelFeeFreeKm] = useState('');
  const [travelFeePerKm, setTravelFeePerKm] = useState('');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | ''>('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [slotBookingEnabled, setSlotBookingEnabled] = useState(true);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<PickerField>('section');
  const [pickerSearch, setPickerSearch] = useState('');

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === sectionId) ?? null,
    [sections, sectionId],
  );

  const subcategoryRequired = Boolean(
    selectedSection && selectedSection.subcategories.length > 0,
  );

  const subcategoryLabel = useMemo(() => {
    if (!selectedSection || !serviceSubCategory) return '';
    return (
      selectedSection.subcategories.find((s) => s.id === serviceSubCategory)?.label ||
      serviceSubCategory
    );
  }, [selectedSection, serviceSubCategory]);

  const packageLabel = useMemo(() => {
    if (!selectedSection?.packages?.length) {
      return servicePackage === 'premium' ? 'Premium' : 'Basic';
    }
    return (
      selectedSection.packages.find((p) => p.value === servicePackage)?.label ||
      servicePackage
    );
  }, [selectedSection, servicePackage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getServiceCategories();
      if (!cancelled) setSections(data.sections);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingService(true);
        const [categories, response] = await Promise.all([
          getServiceCategories(),
          getDealerServices({ limit: 1000 }),
        ]);
        if (cancelled) return;
        setSections(categories.sections);

        const service = (response.Response?.services ?? []).find(
          (item) => getServiceId(item) === editId,
        );
        if (!service) return;

        setName(service.name);
        setPrice(String(service.price));
        setDescription(service.description || '');
        setImages(service.images?.length ? service.images : []);
        setIsActive(service.isActive !== false);
        setSlotBookingEnabled(service.slotBookingEnabled ?? true);
        setHomeService(Boolean(service.homeService));
        setServiceCoverageAreas(service.serviceCoverageAreas || '');
        setTravelFeeEnabled(Boolean(service.travelFeeEnabled));
        setTravelFeeFreeKm(
          service.travelFeeFreeKm != null ? String(service.travelFeeFreeKm) : '',
        );
        setTravelFeePerKm(
          service.travelFeePerKm != null ? String(service.travelFeePerKm) : '',
        );
        setVehicleBrand(service.vehicleBrand || '');
        setVehicleModel(service.vehicleModel || '');
        setServiceSubCategory(service.serviceSubCategory || '');
        setServicePackage(service.servicePackage === 'premium' ? 'premium' : 'basic');
        setServiceType(service.serviceType as ServiceTypeValue | undefined);

        const mins = service.durationMinutes || 60;
        setDurationMinutes(String(mins));
        setDurationLabel(getServiceDurationLabel(service));

        if (service.vehicleType === 'Car' || service.vehicleType === 'Bike') {
          setVehicleType(service.vehicleType);
        } else {
          setVehicleType('');
        }

        const matched = resolveSectionForService(
          categories.sections,
          service.serviceType,
          service.vehicleType,
        );
        if (matched) {
          setSectionId(matched.id);
          setServiceType(matched.serviceType);
          if (matched.hasDeliveryModes && matched.deliveryModes?.length) {
            const mode = service.homeService
              ? matched.deliveryModes.find((d) => d.value === 'home')?.value
              : matched.deliveryModes.find((d) => d.value !== 'home')?.value;
            setDeliveryMode(mode ?? matched.deliveryModes[0].value);
            setHomeService(Boolean(service.homeService));
          } else {
            setDeliveryMode(null);
          }
          if (matched.vehicleType === 'Car' || matched.vehicleType === 'Bike') {
            setVehicleType(matched.vehicleType);
          }
        }
      } catch (error) {
        if (!cancelled) {
          Alert.alert('Error', getApiErrorMessage(error, 'Failed to load service'));
        }
      } finally {
        if (!cancelled) setLoadingService(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const applySection = (section: IServiceSection) => {
    setSectionId(section.id);
    setServiceType(section.serviceType);
    setServiceSubCategory('');
    setServicePackage('basic');
    setDeliveryMode(null);
    setHomeService(false);
    setServiceCoverageAreas('');
    setTravelFeeEnabled(false);
    setTravelFeeFreeKm('');
    setTravelFeePerKm('');

    if (section.vehicleType === 'Car' || section.vehicleType === 'Bike') {
      setVehicleType(section.vehicleType);
    } else {
      setVehicleType('');
    }

    if (section.hasDeliveryModes && section.deliveryModes?.length) {
      const first = section.deliveryModes[0];
      setDeliveryMode(first.value);
      setHomeService(first.value === 'home');
    }
  };

  const handleSectionChange = (nextId: string) => {
    const section = sections.find((s) => s.id === nextId);
    if (!section) return;
    applySection(section);
  };

  const openPicker = (field: PickerField) => {
    lightHaptic();
    setPickerField(field);
    setPickerSearch('');
    setPickerVisible(true);
  };

  const pickerTitle = useMemo(() => {
    if (pickerField === 'section') return 'Select Service Section';
    if (pickerField === 'subcategory') return 'Select Subcategory';
    return 'Select Package';
  }, [pickerField]);

  const pickerOptions = useMemo(() => {
    if (pickerField === 'section') {
      return sections.map((s) => ({ value: s.id, label: s.label }));
    }
    if (pickerField === 'subcategory') {
      return (selectedSection?.subcategories ?? []).map((s) => ({
        value: s.id,
        label: s.label,
      }));
    }
    const packages =
      selectedSection?.packages?.length
        ? selectedSection.packages
        : [
            { value: 'basic' as const, label: 'Basic' },
            { value: 'premium' as const, label: 'Premium' },
          ];
    return packages.map((p) => ({ value: p.value, label: p.label }));
  }, [pickerField, sections, selectedSection]);

  const filteredPickerOptions = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return pickerOptions;
    return pickerOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [pickerOptions, pickerSearch]);

  const selectedPickerValue = useMemo(() => {
    if (pickerField === 'section') return sectionId;
    if (pickerField === 'subcategory') return serviceSubCategory;
    return servicePackage;
  }, [pickerField, sectionId, serviceSubCategory, servicePackage]);

  const handlePickerSelect = (value: string) => {
    if (pickerField === 'section') {
      handleSectionChange(value);
    } else if (pickerField === 'subcategory') {
      setServiceSubCategory(value);
    } else {
      setServicePackage(value as ServicePackageValue);
    }
    setPickerSearch('');
    setPickerVisible(false);
  };

  const setDurationFromChip = (label: string) => {
    setDurationLabel(label);
    setDurationMinutes(String(parseDurationMinutes(label)));
  };

  const setDurationFromMinutes = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setDurationMinutes(cleaned);
    const mins = parseInt(cleaned, 10);
    if (!Number.isNaN(mins) && mins > 0) {
      const match = DURATIONS.find((d) => parseDurationMinutes(d) === mins);
      setDurationLabel(match || `${mins} min`);
    } else {
      setDurationLabel('');
    }
  };

  const handleDeliveryModeSelect = (mode: DeliveryModeValue) => {
    lightHaptic();
    setDeliveryMode(mode);
    const isHome = mode === 'home';
    setHomeService(isHome);
    if (!isHome) {
      setServiceCoverageAreas('');
      setTravelFeeEnabled(false);
      setTravelFeeFreeKm('');
      setTravelFeePerKm('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Fields', 'Please enter a service name.');
      return;
    }
    const priceNum = parseFloat(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Missing Fields', 'Please enter a valid price greater than 0.');
      return;
    }
    const durationNum = parseInt(durationMinutes, 10);
    if (!durationMinutes || Number.isNaN(durationNum) || durationNum < 1) {
      Alert.alert('Missing Fields', 'Please set a duration of at least 1 minute.');
      return;
    }
    if (!sectionId || !serviceType) {
      Alert.alert('Missing Fields', 'Please select a service section.');
      return;
    }
    if (subcategoryRequired && !serviceSubCategory.trim()) {
      Alert.alert('Missing Fields', 'Please select a subcategory.');
      return;
    }
    let resolvedVehicleType: 'Car' | 'Bike' | undefined;
    if (selectedSection?.vehicleType === 'Both') {
      if (vehicleType !== 'Car' && vehicleType !== 'Bike') {
        Alert.alert('Missing Fields', 'Please select Car or Bike.');
        return;
      }
      resolvedVehicleType = vehicleType;
    } else if (selectedSection?.vehicleType === 'Car' || selectedSection?.vehicleType === 'Bike') {
      resolvedVehicleType = selectedSection.vehicleType;
    } else if (vehicleType === 'Car' || vehicleType === 'Bike') {
      resolvedVehicleType = vehicleType;
    }

    const resolvedHomeService = selectedSection?.hasDeliveryModes
      ? deliveryMode === 'home'
      : homeService;

    let freeKmNum: number | undefined;
    let perKmNum: number | undefined;
    if (resolvedHomeService && travelFeeEnabled) {
      freeKmNum = parseFloat(travelFeeFreeKm);
      perKmNum = parseFloat(travelFeePerKm);
      if (!Number.isFinite(freeKmNum) || freeKmNum < 0) {
        Alert.alert('Missing Fields', 'Enter free travel distance in km (0 or more).');
        return;
      }
      if (!Number.isFinite(perKmNum) || perKmNum < 0) {
        Alert.alert('Missing Fields', 'Enter travel charge per km (₹).');
        return;
      }
    }

    lightHaptic();
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: selectedSection?.label || undefined,
        price: priceNum,
        durationMinutes: durationNum,
        homeService: resolvedHomeService,
        description: description.trim() || undefined,
        images: images.length ? images : undefined,
        isActive,
        serviceType,
        vehicleType: resolvedVehicleType,
        vehicleBrand: vehicleBrand.trim() || undefined,
        vehicleModel: vehicleModel.trim() || undefined,
        serviceSubCategory: serviceSubCategory.trim() || undefined,
        servicePackage: selectedSection?.hasPackages ? servicePackage : undefined,
        slotBookingEnabled,
        serviceCoverageAreas: resolvedHomeService
          ? serviceCoverageAreas.trim() || undefined
          : undefined,
        travelFeeEnabled: resolvedHomeService ? travelFeeEnabled : false,
        travelFeeFreeKm: resolvedHomeService && travelFeeEnabled ? freeKmNum : undefined,
        travelFeePerKm: resolvedHomeService && travelFeeEnabled ? perKmNum : undefined,
      };

      if (isEdit && editId) {
        await updateDealerService(editId, payload);
      } else {
        await createDealerService(payload);
      }
      successHaptic();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to save service'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert('Delete Service', 'Remove this service from your catalog?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await deleteDealerService(editId);
            successHaptic();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', getApiErrorMessage(error, 'Failed to delete service'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

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

  if (loadingService) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ServiceDetailSkeleton />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
              {isEdit ? 'Edit Service' : 'Add Service'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.72)' }]}>
              {isEdit ? 'Update your service listing' : 'Add a new service to your catalog'}
            </Text>
          </View>
          <Pressable
            style={styles.saveHeaderBtn}
            onPress={() => void handleSave()}
            disabled={saving}
          >
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
                  Service Images
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Optional — up to {MAX_IMAGES} images
                </Text>
              </View>
            </View>
            <InventoryImageUploadSection
              imageUris={images}
              maxImages={MAX_IMAGES}
              title="Upload clear images of your service"
              onImagesChange={setImages}
            />
          </View>

          {/* 2. Classification */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#1E3A8A' }]}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Classification
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Section, subcategory, and delivery options
                </Text>
              </View>
            </View>

            {renderSelectRow(
              'Service Section',
              selectedSection?.label || '',
              'Select service section',
              () => openPicker('section'),
              'layers',
              true,
            )}

            {subcategoryRequired
              ? renderSelectRow(
                  'Subcategory',
                  subcategoryLabel,
                  'Select subcategory',
                  () => openPicker('subcategory'),
                  'list',
                  true,
                )
              : null}

            {selectedSection?.hasPackages
              ? renderSelectRow(
                  'Package',
                  packageLabel,
                  'Select package',
                  () => openPicker('package'),
                  'package',
                  false,
                )
              : null}

            {selectedSection?.hasDeliveryModes &&
            (selectedSection.deliveryModes?.length ?? 0) > 0 ? (
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Delivery Mode
                </Text>
                <View style={styles.chipRow}>
                  {(selectedSection.deliveryModes ?? []).map((dm) => {
                    const selected = deliveryMode === dm.value;
                    return (
                      <Pressable
                        key={dm.value}
                        onPress={() => handleDeliveryModeSelect(dm.value)}
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
                          {dm.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : selectedSection ? (
              <View
                style={[
                  styles.toggleSettingRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.toggleSettingLeft}>
                  <View style={[styles.toggleSettingIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="home" size={14} color="#1E3A8A" />
                  </View>
                  <View>
                    <Text style={[styles.toggleSettingTitle, { color: colors.textPrimary }]}>
                      Home Service Available
                    </Text>
                    <Text style={[styles.toggleSettingSubtitle, { color: colors.textSecondary }]}>
                      Offer this service at the customer's location
                    </Text>
                  </View>
                </View>
                <Switch
                  value={homeService}
                  onValueChange={(v) => {
                    setHomeService(v);
                    if (!v) {
                      setServiceCoverageAreas('');
                      setTravelFeeEnabled(false);
                      setTravelFeeFreeKm('');
                      setTravelFeePerKm('');
                    }
                  }}
                  trackColor={{ false: '#E2E8F0', true: '#E60012' }}
                  thumbColor="#ffffff"
                />
              </View>
            ) : null}

            {homeService || deliveryMode === 'home' ? (
              <View style={styles.homeTravelBlock}>
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Service areas / places
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputMultiline,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={serviceCoverageAreas}
                    onChangeText={setServiceCoverageAreas}
                    placeholder="e.g. Gachibowli, Madhapur, Hitech City"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                  />
                </View>

                <View
                  style={[
                    styles.toggleSettingRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.toggleSettingLeft}>
                    <View style={[styles.toggleSettingIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Feather name="navigation" size={14} color="#D97706" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.toggleSettingTitle, { color: colors.textPrimary }]}>
                        Charge travel fee?
                      </Text>
                      <Text style={[styles.toggleSettingSubtitle, { color: colors.textSecondary }]}>
                        Fee after free distance is exceeded
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={travelFeeEnabled}
                    onValueChange={setTravelFeeEnabled}
                    trackColor={{ false: '#E2E8F0', true: '#E60012' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {travelFeeEnabled ? (
                  <View style={styles.twoColRow}>
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                        Free until (km)
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                          },
                        ]}
                        value={travelFeeFreeKm}
                        onChangeText={setTravelFeeFreeKm}
                        keyboardType="decimal-pad"
                        placeholder="e.g. 5"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                        ₹ per km after
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                          },
                        ]}
                        value={travelFeePerKm}
                        onChangeText={setTravelFeePerKm}
                        keyboardType="decimal-pad"
                        placeholder="e.g. 15"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedSection?.vehicleType === 'Both' ? (
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Vehicle Type *
                </Text>
                <View style={styles.chipRow}>
                  {(['Car', 'Bike'] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => {
                        lightHaptic();
                        setVehicleType(type);
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
            ) : selectedSection?.vehicleType === 'Car' ||
              selectedSection?.vehicleType === 'Bike' ? (
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Vehicle Type
                </Text>
                <View
                  style={[
                    styles.readOnlyBadge,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                >
                  <Feather name="truck" size={14} color={colors.icon} />
                  <Text style={[styles.readOnlyBadgeText, { color: colors.textPrimary }]}>
                    {selectedSection.vehicleType}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Vehicle Brand
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Optional"
                  placeholderTextColor={colors.textTertiary}
                  value={vehicleBrand}
                  onChangeText={setVehicleBrand}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Vehicle Model
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Optional"
                  placeholderTextColor={colors.textTertiary}
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />
              </View>
            </View>
          </View>

          {/* 3. Service Information */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Service Information
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Name, price, duration, and description
                </Text>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Service Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Full Car Detailing"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Price (₹) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="2499"
                  placeholderTextColor={colors.textTertiary}
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Duration (min) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor={colors.textTertiary}
                  value={durationMinutes}
                  onChangeText={setDurationFromMinutes}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Quick Duration
              </Text>
              <View style={styles.chipRow}>
                {DURATIONS.map((d) => {
                  const selected = parseDurationMinutes(d) === parseInt(durationMinutes, 10);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        lightHaptic();
                        setDurationFromChip(d);
                      }}
                      style={[
                        styles.durationChip,
                        {
                          borderColor: selected ? '#E60012' : colors.border,
                          backgroundColor: selected ? '#F2F2F2' : colors.card,
                        },
                      ]}
                    >
                      <Feather
                        name="clock"
                        size={10}
                        color={selected ? '#E60012' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.durationChipText,
                          { color: selected ? '#E60012' : colors.textSecondary },
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {durationLabel ? (
              <View style={styles.durationInfoBanner}>
                <Feather name="calendar" size={13} color="#10B981" />
                <Text style={styles.durationInfoText}>
                  This service will take approximately{' '}
                  <Text style={styles.durationInfoBold}>{durationLabel}</Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[
                  styles.inputMultiline,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Describe what’s included in this service…"
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                {description.length}/500
              </Text>
            </View>
          </View>

          {/* 4. Settings */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionNumberBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.sectionNumberText}>4</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Additional Settings
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Availability and booking options
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.toggleSettingRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.toggleSettingLeft}>
                <View style={[styles.toggleSettingIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Feather name="check-circle" size={14} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.toggleSettingTitle, { color: colors.textPrimary }]}>
                    Active
                  </Text>
                  <Text style={[styles.toggleSettingSubtitle, { color: colors.textSecondary }]}>
                    Show this service in your catalog
                  </Text>
                </View>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#E2E8F0', true: '#E60012' }}
                thumbColor="#ffffff"
              />
            </View>

            <View
              style={[
                styles.toggleSettingRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.toggleSettingLeft}>
                <View style={[styles.toggleSettingIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Feather name="calendar" size={14} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.toggleSettingTitle, { color: colors.textPrimary }]}>
                    Enable Online Booking
                  </Text>
                  <Text style={[styles.toggleSettingSubtitle, { color: colors.textSecondary }]}>
                    Allow customers to book this service
                  </Text>
                </View>
              </View>
              <Switch
                value={slotBookingEnabled}
                onValueChange={setSlotBookingEnabled}
                trackColor={{ false: '#E2E8F0', true: '#E60012' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.previewFooter, { backgroundColor: '#F2F2F2', borderTopColor: colors.border }]}>
          <View style={[styles.previewIconBox, { backgroundColor: '#F2F2F2' }]}>
            <Feather name="tool" size={18} color={colors.icon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: '#1E3A8A' }]}>Service Summary</Text>
            <Text style={[styles.previewSub, { color: '#FF1A1A' }]}>
              {name || 'Service Name'} • {selectedSection?.label || 'Section'} •{' '}
              {durationLabel || `${durationMinutes || '—'} min`}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.previewStatLabel, { color: '#64748B' }]}>Price</Text>
            <Text style={[styles.previewStatValue, { color: themeLight.textSecondary }]}>
              ₹{Number(price || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={[styles.stickyAddBtn, { paddingBottom: bottomPad + 8 }]}>
          <Pressable
            style={[styles.addBtn, { backgroundColor: saving ? '#93C5FD' : '#E60012' }]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Feather
              name={isEdit ? 'check' : 'plus'}
              size={16}
              color="#ffffff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.addBtnText}>{isEdit ? 'Update Service' : 'Add Service'}</Text>
          </Pressable>
        </View>

        <BookingPickerSheet
          visible={pickerVisible}
          title={pickerTitle}
          onClose={() => {
            setPickerSearch('');
            setPickerVisible(false);
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
              placeholder={`Search ${pickerTitle.replace(/^Select\s+/i, '').toLowerCase()}…`}
              placeholderTextColor={colors.textTertiary}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {pickerSearch.length > 0 ? (
              <Pressable onPress={() => setPickerSearch('')} hitSlop={8}>
                <Feather name="x-circle" size={16} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {pickerOptions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, paddingVertical: 12 }}>
              No options available
            </Text>
          ) : filteredPickerOptions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, paddingVertical: 12 }}>
              No matches for “{pickerSearch.trim()}”
            </Text>
          ) : (
            filteredPickerOptions.map((option) => {
              const selected = option.value === selectedPickerValue;
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
                    handlePickerSelect(option.value);
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
  twoColRow: { flexDirection: 'row', gap: 12 },
  homeTravelBlock: { gap: 12 },
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
  charCount: { fontSize: 9, textAlign: 'right' },
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
  dropdownIcon: { marginLeft: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  durationChipText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  durationInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 10,
  },
  durationInfoText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  durationInfoBold: { color: '#10B981', fontFamily: 'Inter_700Bold' },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
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
