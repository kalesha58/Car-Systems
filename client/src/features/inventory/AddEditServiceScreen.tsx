import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenHeight, screenWidth} from '@utils/Scaling';
import { Fonts, fontStyle } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import CustomDropdownBottomSheet, {IDropdownOption} from '@components/ui/CustomDropdownBottomSheet';
import {getDropdownOptions} from '@service/dropdownService';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';
import {useTranslation} from 'react-i18next';
import {useBusinessRegistration} from '@hooks/useBusinessRegistration';
import {
  createDealerService,
  updateDealerService,
  deleteDealerService,
  ICreateDealerServiceRequest,
  IUpdateDealerServiceRequest,
} from '@service/dealerService';
import {uploadImagesBatch} from '@service/postService';
import {getCurrentLocationWithAddress} from '@utils/addressUtils';
import {ILocationData} from '../../types/address/IAddress';
import {IService} from '../../types/service/IService';
import {
  getSectionsForBusinessType,
  getSectionByServiceType,
  getSectionById,
  type ServiceTypeValue,
} from '@config/serviceCategoryConfig';
import {
  DealerServiceType,
  getAllowedDealerServiceTypes,
} from '@config/dealerServiceTypeConfig';

const MAX_IMAGES = 8;

type ServiceType = DealerServiceType;

const resolveInitialSectionId = (svc?: IService): string => {
  if (!svc?.serviceType) return '';
  if (svc.serviceType === 'general') return 'general';
  const section = getSectionByServiceType(
    svc.serviceType as ServiceTypeValue,
    svc.vehicleType,
  );
  return section?.id || '';
};

interface RouteParams {
  service?: IService;
}

const AddEditServiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {showSuccess, showError} = useToast();
  const {t} = useTranslation();
  const {businessRegistration} = useBusinessRegistration();
  const params = (route.params as RouteParams) || {};

  const isEditMode = !!params.service;
  const service = params.service;

  // Get allowed service types based on business registration
  const allowedServiceTypes = getAllowedDealerServiceTypes(businessRegistration?.type);
  const allowedSections = useMemo(
    () => getSectionsForBusinessType(businessRegistration?.type),
    [businessRegistration?.type],
  );
  const showGeneralOption = allowedServiceTypes.includes('general');

  const [sectionId, setSectionId] = useState(resolveInitialSectionId(service));
  const selectedSection = useMemo(() => {
    if (sectionId === 'general' || !sectionId) return null;
    return allowedSections.find(s => s.id === sectionId) ?? getSectionById(sectionId) ?? null;
  }, [sectionId, allowedSections]);
  
  // Check if existing service type is allowed for current business type
  const isExistingServiceTypeAllowed = service?.serviceType 
    ? allowedServiceTypes.includes(service.serviceType as ServiceType)
    : true;

  const [name, setName] = useState(service?.name || '');
  const [price, setPrice] = useState(service?.price?.toString() || '');
  const [durationMinutes, setDurationMinutes] = useState(service?.durationMinutes?.toString() || '');
  const [homeService, setHomeService] = useState(service?.homeService || false);
  const [category, setCategory] = useState(service?.category || '');
  const [description, setDescription] = useState(service?.description || '');
  const [isActive, setIsActive] = useState(service?.isActive !== undefined ? service.isActive : true);
  const [serviceType, setServiceType] = useState<ServiceType | undefined>(service?.serviceType as ServiceType | undefined);
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | undefined>(service?.vehicleType);
  const [vehicleBrandId, setVehicleBrandId] = useState(service?.vehicleBrandId || '');
  const [vehicleModelId, setVehicleModelId] = useState(service?.vehicleModelId || '');
  const [catalogBrands, setCatalogBrands] = useState<IDropdownOption[]>([]);
  const [catalogModels, setCatalogModels] = useState<IDropdownOption[]>([]);
  const [catalogDropdownVisible, setCatalogDropdownVisible] = useState(false);
  const [catalogDropdownType, setCatalogDropdownType] = useState<'brand' | 'model'>('brand');
  const [serviceSubCategory, setServiceSubCategory] = useState(service?.serviceSubCategory || '');
  const [servicePackage, setServicePackage] = useState<'premium' | 'basic'>(service?.servicePackage || 'basic');
  const [slotBookingEnabled, setSlotBookingEnabled] = useState(service?.slotBookingEnabled || false);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(service?.slotDurationMinutes?.toString() || '30');

  const handleSectionChange = (newSectionId: string) => {
    if (!isExistingServiceTypeAllowed && isEditMode) {
      return;
    }
    setSectionId(newSectionId);
    if (newSectionId === 'general') {
      setServiceType('general');
      setServiceSubCategory('');
      setVehicleType(undefined);
      setVehicleBrandId('');
      setVehicleModelId('');
      return;
    }
    const section = allowedSections.find(s => s.id === newSectionId);
    if (!section) return;
    setServiceType(section.serviceType);
    setServiceSubCategory('');
    setServicePackage('basic');
    if (section.vehicleType === 'Car') {
      setVehicleType('Car');
    } else if (section.vehicleType === 'Bike') {
      setVehicleType('Bike');
    } else {
      setVehicleType(undefined);
      setVehicleBrandId('');
      setVehicleModelId('');
    }
    if (section.hasDeliveryModes && section.deliveryModes?.length) {
      setHomeService(section.deliveryModes[0].value === 'home');
    }
  };

  const legacySubcategoryHint =
    isEditMode &&
    service?.serviceSubCategory &&
    selectedSection &&
    !selectedSection.subcategories.some(s => s.id === serviceSubCategory);

  useEffect(() => {
    const loadBrands = async () => {
      if (serviceType !== 'bike_automobile') {
        setCatalogBrands([]);
        return;
      }
      const options = await getDropdownOptions('Bike');
      setCatalogBrands(options.brands || []);
    };
    loadBrands().catch(() => setCatalogBrands([]));
  }, [serviceType]);

  useEffect(() => {
    const loadModels = async () => {
      if (!vehicleBrandId) {
        setCatalogModels([]);
        return;
      }
      const options = await getDropdownOptions('Bike', vehicleBrandId);
      setCatalogModels(options.models || []);
    };
    loadModels().catch(() => setCatalogModels([]));
  }, [vehicleBrandId]);
  const [location, setLocation] = useState<ILocationData | null>(
    service?.location
      ? {
          latitude: service.location.latitude,
          longitude: service.location.longitude,
          address: service.location.address || '',
          formattedAddress: service.location.address || '',
        }
      : null,
  );
  const [imageUris, setImageUris] = useState<string[]>(service?.images || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Pre-select service type if only one option is available and not in edit mode
  useEffect(() => {
    if (!isEditMode && allowedServiceTypes.length === 1 && !serviceType) {
      const singleType = allowedServiceTypes[0];
      setServiceType(singleType);
      if (singleType === 'car_automobile') {
        setVehicleType('Car');
      } else if (singleType === 'bike_automobile') {
        setVehicleType('Bike');
      }
    }
  }, [allowedServiceTypes, isEditMode, serviceType]);

  useEffect(() => {
    // Fetch location address if we have coordinates
    if (service?.location && !location?.address) {
      // Location address would need to be fetched separately if needed
    }
  }, []);

  const handleImagePicker = () => {
    if (imageUris.length >= MAX_IMAGES) {
      Alert.alert(t('dealer.limitReached'), t('dealer.maxImagesReached', {max: MAX_IMAGES}));
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        // Downscale/compress to reduce upload payload and avoid 413 errors.
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
        includeBase64: false,
        selectionLimit: MAX_IMAGES - imageUris.length,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const selectedImages = response.assets || [];
        if (selectedImages.length > 0) {
          const newUris = selectedImages.map(asset => asset.uri || '').filter(Boolean);
          setImageUris(prev => [...prev, ...newUris]);
        }
      },
    );
  };

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationPicker = async () => {
    setIsGettingLocation(true);
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        setLocation(locationData);
      } else {
        showError(t('dealer.locationFailed'));
      }
    } catch (error) {
      showError(t('dealer.locationFailed'));
    } finally {
      setIsGettingLocation(false);
    }
  };

  const removeLocation = () => {
    setLocation(null);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageUris.length === 0) {
      return [];
    }

    setIsUploadingImages(true);
    try {
      const urls = await uploadImagesBatch(imageUris.map((uri) => ({ uri })));
      return urls;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to upload images. Please try again.');
      throw err;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError(t('dealer.serviceNameRequired'));
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showError(t('dealer.priceRequired'));
      return;
    }
    if (!durationMinutes || parseInt(durationMinutes) < 1) {
      showError(t('dealer.durationRequired'));
      return;
    }
    if (!sectionId && !serviceType) {
      showError(t('dealer.selectServiceType') || 'Please select a service section');
      return;
    }
    if (
      sectionId &&
      sectionId !== 'general' &&
      selectedSection &&
      selectedSection.subcategories.length > 0 &&
      !serviceSubCategory.trim()
    ) {
      showError(t('dealer.subCategoryRequired') || 'Subcategory is required');
      return;
    }

    setIsLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();

      if (isEditMode && service) {
        const updateData: IUpdateDealerServiceRequest = {
          name: name.trim(),
          price: parseFloat(price),
          durationMinutes: parseInt(durationMinutes),
          homeService,
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
          location: location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address || location.formattedAddress,
              }
            : undefined,
          isActive,
          serviceType,
          vehicleType,
          vehicleBrandId: vehicleBrandId || undefined,
          vehicleModelId: vehicleModelId || undefined,
          serviceSubCategory: serviceSubCategory.trim() || undefined,
          servicePackage,
          slotBookingEnabled,
          slotDurationMinutes: slotBookingEnabled ? parseInt(slotDurationMinutes) : undefined,
        };

        await updateDealerService(service.id, updateData);
        showSuccess(t('dealer.serviceUpdated'));
      } else {
        const createData: ICreateDealerServiceRequest = {
          name: name.trim(),
          price: parseFloat(price),
          durationMinutes: parseInt(durationMinutes),
          homeService,
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
          location: location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address || location.formattedAddress,
              }
            : undefined,
          isActive: true, // New services are active by default
          serviceType,
          vehicleType,
          vehicleBrandId: vehicleBrandId || undefined,
          vehicleModelId: vehicleModelId || undefined,
          serviceSubCategory: serviceSubCategory.trim() || undefined,
          servicePackage,
          slotBookingEnabled,
          slotDurationMinutes: slotBookingEnabled ? parseInt(slotDurationMinutes) : undefined,
        };

        await createDealerService(createData);
        showSuccess(t('dealer.serviceCreated'));
      }

      setTimeout(() => {
        (navigation as any).navigate('DealerTabs', {
          screen: 'Inventory',
          params: {activeTab: 'services'},
        });
      }, 1500);
    } catch (error: any) {
      showError(error?.message || t('dealer.operationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!service) return;

    Alert.alert(t('dealer.deleteService'), t('dealer.deleteServiceConfirm'), [
      {text: t('dealer.cancel'), style: 'cancel'},
      {
        text: t('dealer.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteDealerService(service.id);
            showSuccess(t('dealer.serviceDeleted'));
            setTimeout(() => {
              navigation.goBack();
            }, 1500);
          } catch (error: any) {
            showError(error?.message || t('dealer.deleteFailed'));
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const isSubmitting = isLoading || isUploadingImages;
  const isFormValid =
    name.trim().length > 0 &&
    price &&
    parseFloat(price) > 0 &&
    durationMinutes &&
    parseInt(durationMinutes) >= 1 &&
    !isSubmitting;

  const softBorder = `${colors.border}99`;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    scrollContent: {
      paddingHorizontal: screenWidth * 0.04,
      paddingTop: screenHeight * 0.018,
      paddingBottom: screenHeight * 0.05,
    },
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: RFValue(14),
      padding: screenWidth * 0.04,
      borderWidth: 1,
      borderColor: softBorder,
    },
    sectionGroup: {
      marginBottom: screenHeight * 0.024,
    },
    sectionHeader: {
      fontSize: RFValue(11),
      ...fontStyle(Fonts.SemiBold),
      color: colors.text,
      marginBottom: screenHeight * 0.014,
      letterSpacing: 0.3,
    },
    fieldDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: softBorder,
      marginVertical: screenHeight * 0.018,
    },
    row: {
      flexDirection: 'row',
      gap: screenWidth * 0.03,
    },
    halfField: {
      flex: 1,
      minWidth: 0,
    },
    section: {
      marginBottom: screenHeight * 0.016,
    },
    label: {
      fontSize: RFValue(10),
      ...fontStyle(Fonts.Medium),
      color: colors.textSecondary,
      marginBottom: screenHeight * 0.008,
      letterSpacing: 0.2,
    },
    required: {
      color: colors.error,
    },
    helpText: {
      fontSize: RFValue(8),
      ...fontStyle(Fonts.Regular),
      color: colors.error,
      marginTop: screenHeight * 0.008,
    },
    field: {
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(10),
      borderWidth: 1,
      borderColor: softBorder,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.013,
      minHeight: screenHeight * 0.052,
    },
    dropdownField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownPlaceholder: {
      color: colors.disabled,
    },
    textInput: {
      fontSize: RFValue(11),
      ...fontStyle(Fonts.Regular),
      color: colors.text,
      paddingVertical: 0,
    },
    textInputMultiline: {
      minHeight: screenHeight * 0.14,
      textAlignVertical: 'top',
      paddingTop: 2,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: screenHeight * 0.012,
    },
    switchLabel: {
      fontSize: RFValue(11),
      ...fontStyle(Fonts.Medium),
      color: colors.text,
      flex: 1,
      marginRight: screenWidth * 0.02,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.iceBlue,
      borderRadius: RFValue(10),
      borderWidth: 1,
      borderColor: softBorder,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.014,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.iceBlue,
      borderRadius: RFValue(10),
      borderWidth: 1,
      borderColor: softBorder,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.016,
    },
    buttonText: {
      fontSize: RFValue(10),
      ...fontStyle(Fonts.Medium),
      color: colors.winterBlueDark,
      marginLeft: screenWidth * 0.025,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: screenWidth * 0.025,
      marginTop: screenHeight * 0.012,
    },
    chipPill: {
      paddingHorizontal: screenWidth * 0.04,
      paddingVertical: screenHeight * 0.012,
      borderRadius: RFValue(10),
      borderWidth: 1,
      borderColor: softBorder,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
    },
    chipPillSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.secondary + '22',
    },
    chipPillText: {
      fontSize: RFValue(10),
      ...fontStyle(Fonts.Medium),
      color: colors.text,
    },
    chipPillTextSelected: {
      color: colors.secondary,
    },
    imagesContainer: {
      flexDirection: 'row',
      gap: screenWidth * 0.03,
      marginTop: screenHeight * 0.012,
      paddingVertical: 4,
    },
    imageWrapper: {
      position: 'relative',
      width: screenWidth * 0.26,
      height: screenWidth * 0.26,
      borderRadius: RFValue(10),
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: softBorder,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    removeImageButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      borderRadius: 14,
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationContainer: {
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(10),
      borderWidth: 1,
      borderColor: softBorder,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.014,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.012,
    },
    locationText: {
      flex: 1,
      fontSize: RFValue(10),
      ...fontStyle(Fonts.Regular),
      color: colors.text,
      marginLeft: screenWidth * 0.02,
    },
    removeLocationButton: {
      padding: 4,
    },
    stickyButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: screenWidth * 0.04,
      paddingVertical: screenHeight * 0.018,
      paddingBottom: screenHeight * 0.028,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    editDeleteRow: {
      flexDirection: 'row',
      gap: screenWidth * 0.025,
    },
    submitButtonTouchable: {
      borderRadius: RFValue(14),
      overflow: 'hidden',
      width: '100%',
    },
    editButton: {
      flex: 1,
      minWidth: 0,
    },
    submitButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    submitButtonText: {
      fontSize: RFValue(11),
      ...fontStyle(Fonts.SemiBold),
      color: '#fff',
    },
    deleteButton: {
      backgroundColor: colors.error,
      borderRadius: RFValue(14),
      paddingVertical: screenHeight * 0.018,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    deleteButtonHalf: {
      flex: 1,
    },
    deleteButtonText: {
      fontSize: RFValue(10),
      ...fontStyle(Fonts.SemiBold),
      color: '#fff',
    },
    primaryGradient: {
      paddingVertical: screenHeight * 0.018,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    fullWidthPrimary: {
      width: '100%',
    },
  });

  const gradientPrimary: [string, string] = [
    colors.secondary,
    isDark ? '#0b5c16' : '#095a14',
  ];
  const stickyFooterBottomOffset = Math.max(
    insets.bottom + (Platform.OS === 'android' ? 8 : 0),
    screenHeight * 0.012,
  );
  const stickyFooterContentHeight = isEditMode ? 132 : 112;
  const scrollBottomInset = stickyFooterBottomOffset + stickyFooterContentHeight;

  return (
    <View style={styles.container}>
      <CustomHeader
        title={isEditMode ? t('dealer.editService') : t('dealer.addService')}
        backgroundColor="#0d8320"
        titleColor="#fff"
        iconColor="#fff"
        showNotificationIcon={false}
        rightComponent={<View style={{width: RFValue(28)}} />}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: scrollBottomInset}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionBasicInfo')}</CustomText>
            <View style={styles.section}>
            <CustomText style={styles.label}>
              {t('dealer.serviceName')} <CustomText style={styles.required}>*</CustomText>
            </CustomText>
            <View style={styles.field}>
              <TextInput
                style={styles.textInput}
                placeholder={t('dealer.enterServiceName')}
                placeholderTextColor={colors.disabled}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionPricing')}</CustomText>
          <View style={[styles.section, styles.row]}>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>
                {t('dealer.price')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterPrice')}
                  placeholderTextColor={colors.disabled}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>
                {t('dealer.durationMinutes')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterDuration')}
                  placeholderTextColor={colors.disabled}
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {!selectedSection?.hasDeliveryModes && (
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <CustomText style={styles.switchLabel}>
                {t('dealer.homeService')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <Switch
                value={homeService}
                onValueChange={setHomeService}
                trackColor={{false: colors.disabled, true: colors.secondary + '80'}}
                thumbColor={homeService ? colors.secondary : colors.disabled}
              />
            </View>
          </View>
          )}

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <CustomText style={styles.switchLabel}>
                Enable Slot Booking
              </CustomText>
              <Switch
                value={slotBookingEnabled}
                onValueChange={setSlotBookingEnabled}
                trackColor={{false: colors.disabled, true: colors.secondary + '80'}}
                thumbColor={slotBookingEnabled ? colors.secondary : colors.disabled}
              />
            </View>
            {slotBookingEnabled && (
              <View style={{ marginTop: 12 }}>
                <CustomText style={styles.label}>
                  Slot Duration (Minutes) <CustomText style={styles.required}>*</CustomText>
                </CustomText>
                <View style={styles.field}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 30"
                    placeholderTextColor={colors.disabled}
                    value={slotDurationMinutes}
                    onChangeText={setSlotDurationMinutes}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
          </View>
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionClassification')}</CustomText>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.serviceSection') || 'Service Section'}</CustomText>
            {!isExistingServiceTypeAllowed && (
              <CustomText style={styles.helpText}>
                {t('dealer.serviceTypeNotAllowed') ||
                  'This service type is not allowed for your business type. You can edit other fields but cannot change the service type.'}
              </CustomText>
            )}
            <View style={styles.chipGrid}>
              {allowedSections.map(sec => (
                <TouchableOpacity
                  key={sec.id}
                  style={[
                    styles.chipPill,
                    sectionId === sec.id && styles.chipPillSelected,
                    !isExistingServiceTypeAllowed && isEditMode && {opacity: 0.5},
                  ]}
                  onPress={() => handleSectionChange(sec.id)}
                  disabled={!isExistingServiceTypeAllowed && isEditMode}
                  activeOpacity={0.75}>
                  <CustomText
                    style={[
                      styles.chipPillText,
                      sectionId === sec.id && styles.chipPillTextSelected,
                    ]}>
                    {sec.label}
                  </CustomText>
                </TouchableOpacity>
              ))}
              {showGeneralOption && (
                <TouchableOpacity
                  key="general"
                  style={[
                    styles.chipPill,
                    sectionId === 'general' && styles.chipPillSelected,
                    !isExistingServiceTypeAllowed && isEditMode && {opacity: 0.5},
                  ]}
                  onPress={() => handleSectionChange('general')}
                  disabled={!isExistingServiceTypeAllowed && isEditMode}
                  activeOpacity={0.75}>
                  <CustomText
                    style={[
                      styles.chipPillText,
                      sectionId === 'general' && styles.chipPillTextSelected,
                    ]}>
                    General
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {selectedSection?.hasPackages && (selectedSection.packages ?? []).length > 0 && (
          <View style={styles.section}>
            <CustomText style={styles.label}>Service Package</CustomText>
            <View style={styles.chipGrid}>
              {(selectedSection.packages ?? []).map(pkg => (
                <TouchableOpacity
                  key={pkg.value}
                  style={[
                    styles.chipPill,
                    servicePackage === pkg.value && styles.chipPillSelected,
                  ]}
                  onPress={() => setServicePackage(pkg.value)}
                  activeOpacity={0.75}>
                  <CustomText
                    style={[
                      styles.chipPillText,
                      servicePackage === pkg.value && styles.chipPillTextSelected,
                    ]}>
                    {pkg.label}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          )}

          {selectedSection?.hasDeliveryModes && (selectedSection.deliveryModes ?? []).length > 0 && (
          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.deliveryMode') || 'Delivery Mode'}</CustomText>
            <View style={styles.chipGrid}>
              {(selectedSection.deliveryModes ?? []).map(dm => (
                <TouchableOpacity
                  key={dm.value}
                  style={[
                    styles.chipPill,
                    (dm.value === 'home' ? homeService : !homeService) && styles.chipPillSelected,
                  ]}
                  onPress={() => setHomeService(dm.value === 'home')}
                  activeOpacity={0.75}>
                  <CustomText
                    style={[
                      styles.chipPillText,
                      (dm.value === 'home' ? homeService : !homeService) && styles.chipPillTextSelected,
                    ]}>
                    {dm.label}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          )}

          {selectedSection?.vehicleType === 'Both' && (
            <View style={styles.section}>
              <CustomText style={styles.label}>{t('dealer.vehicleType')}</CustomText>
              <View style={styles.chipGrid}>
                {(['Car', 'Bike'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chipPill,
                      vehicleType === type && styles.chipPillSelected,
                    ]}
                    onPress={() => setVehicleType(type)}
                    activeOpacity={0.75}>
                    <CustomText
                      style={[
                        styles.chipPillText,
                        vehicleType === type && styles.chipPillTextSelected,
                      ]}>
                      {type}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {(serviceType === 'car_automobile' || serviceType === 'bike_automobile') && selectedSection?.vehicleType !== 'Both' && (
            <View style={styles.section}>
              <CustomText style={styles.label}>{t('dealer.vehicleType')}</CustomText>
              <View style={styles.hintRow}>
                <Icon name="car-outline" size={RFValue(18)} color={colors.winterBlueDark} />
                <CustomText style={styles.buttonText}>{vehicleType || t('dealer.selectVehicleType')}</CustomText>
              </View>
            </View>
          )}

          {serviceType === 'bike_automobile' && (
            <>
              <View style={styles.section}>
                <CustomText style={styles.label}>{t('dealer.vehicleBrand')}</CustomText>
                <TouchableOpacity
                  style={[styles.field, styles.dropdownField]}
                  onPress={() => {
                    setCatalogDropdownType('brand');
                    setCatalogDropdownVisible(true);
                  }}>
                  <CustomText
                    style={[
                      styles.textInput,
                      ...(!vehicleBrandId ? [styles.dropdownPlaceholder] : []),
                    ]}>
                    {catalogBrands.find(b => b.value === vehicleBrandId)?.label ||
                      t('dealer.selectCompatibleBrand')}
                  </CustomText>
                  <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <CustomText style={styles.label}>{t('dealer.vehicleModel')}</CustomText>
                <TouchableOpacity
                  style={[styles.field, styles.dropdownField, !vehicleBrandId && {opacity: 0.6}]}
                  onPress={() => {
                    setCatalogDropdownType('model');
                    setCatalogDropdownVisible(true);
                  }}
                  disabled={!vehicleBrandId}>
                  <CustomText
                    style={[
                      styles.textInput,
                      ...(!vehicleModelId ? [styles.dropdownPlaceholder] : []),
                    ]}>
                    {catalogModels.find(m => m.value === vehicleModelId)?.label ||
                      t('dealer.selectCompatibleModel')}
                  </CustomText>
                  <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {selectedSection && selectedSection.subcategories.length > 0 && (
            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('dealer.serviceSubCategory')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              {legacySubcategoryHint && (
                <CustomText style={styles.helpText}>
                  Current value "{serviceSubCategory}" is outdated — please pick a valid subcategory.
                </CustomText>
              )}
              <View style={styles.chipGrid}>
                {selectedSection.subcategories.map(subCat => (
                  <TouchableOpacity
                    key={subCat.id}
                    style={[
                      styles.chipPill,
                      serviceSubCategory === subCat.id && styles.chipPillSelected,
                    ]}
                    onPress={() => setServiceSubCategory(subCat.id)}
                    activeOpacity={0.75}>
                    <CustomText
                      style={[
                        styles.chipPillText,
                        serviceSubCategory === subCat.id && styles.chipPillTextSelected,
                      ]}>
                      {subCat.label}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {(sectionId === 'general' || (!sectionId && serviceType === 'general')) && (
            <View style={styles.section}>
              <CustomText style={styles.label}>{t('dealer.serviceSubCategory')}</CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterSubCategory')}
                  placeholderTextColor={colors.disabled}
                  value={serviceSubCategory}
                  onChangeText={setServiceSubCategory}
                />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.category')}</CustomText>
            <View style={styles.field}>
              <TextInput
                style={styles.textInput}
                placeholder={t('dealer.enterCategory')}
                placeholderTextColor={colors.disabled}
                value={category}
                onChangeText={setCategory}
              />
            </View>
          </View>
          </View>

          <View style={styles.fieldDivider} />

          <View style={[styles.sectionGroup, {marginBottom: 0}]}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionDetails')}</CustomText>
          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.description')}</CustomText>
            <View style={styles.field}>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder={t('dealer.enterDescription')}
                placeholderTextColor={colors.disabled}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.images')}</CustomText>
            <TouchableOpacity style={styles.button} onPress={handleImagePicker} activeOpacity={0.8}>
              <Icon name="images-outline" size={RFValue(20)} color={colors.winterBlueDark} />
              <CustomText style={styles.buttonText}>
                {t('dealer.addImages')} ({imageUris.length}/{MAX_IMAGES})
              </CustomText>
            </TouchableOpacity>
            {imageUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesContainer}>
                {imageUris.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{uri}} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}>
                      <Icon name="close" size={RFValue(14)} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={[styles.section, {marginBottom: 0}]}>
            <CustomText style={styles.label}>{t('dealer.location')}</CustomText>
            {!location ? (
              <TouchableOpacity
                style={styles.button}
                onPress={handleLocationPicker}
                disabled={isGettingLocation}
                activeOpacity={0.8}>
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={colors.winterBlueDark} />
                ) : (
                  <Icon name="location-outline" size={RFValue(20)} color={colors.winterBlueDark} />
                )}
                <CustomText style={styles.buttonText}>
                  {isGettingLocation ? t('dealer.gettingLocation') : t('dealer.addLocation')}
                </CustomText>
              </TouchableOpacity>
            ) : (
              <View style={styles.locationContainer}>
                <Icon name="location" size={RFValue(18)} color={colors.secondary} />
                <CustomText style={styles.locationText} numberOfLines={2}>
                  {location.address || location.formattedAddress}
                </CustomText>
                <TouchableOpacity style={styles.removeLocationButton} onPress={removeLocation}>
                  <Icon name="close-circle" size={RFValue(18)} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyButtonContainer, {bottom: stickyFooterBottomOffset}]}>
        {isEditMode ? (
          <View style={styles.editDeleteRow}>
            <View style={styles.editButton}>
              <TouchableOpacity
                style={styles.submitButtonTouchable}
                onPress={handleSubmit}
                disabled={!isFormValid}
                activeOpacity={0.88}>
                {isSubmitting ? (
                  <LinearGradient colors={gradientPrimary} style={styles.primaryGradient}>
                    <ActivityIndicator size="small" color="#fff" />
                  </LinearGradient>
                ) : isFormValid ? (
                  <LinearGradient colors={gradientPrimary} style={styles.primaryGradient}>
                    <Icon name="create-outline" size={RFValue(18)} color="#fff" />
                    <CustomText style={styles.submitButtonText}>{t('dealer.updateService')}</CustomText>
                  </LinearGradient>
                ) : (
                  <View style={[styles.primaryGradient, styles.submitButtonDisabled]}>
                    <Icon name="create-outline" size={RFValue(18)} color="rgba(255,255,255,0.85)" />
                    <CustomText style={styles.submitButtonText}>{t('dealer.updateService')}</CustomText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonHalf]}
              onPress={handleDelete}
              disabled={isSubmitting}
              activeOpacity={0.88}>
              <Icon name="trash-outline" size={RFValue(17)} color="#fff" />
              <CustomText style={styles.deleteButtonText}>{t('dealer.deleteService')}</CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fullWidthPrimary}>
            <TouchableOpacity
              style={styles.submitButtonTouchable}
              onPress={handleSubmit}
              disabled={!isFormValid}
              activeOpacity={0.88}>
              {isSubmitting ? (
                <LinearGradient colors={gradientPrimary} style={styles.primaryGradient}>
                  <ActivityIndicator size="small" color="#fff" />
                </LinearGradient>
              ) : isFormValid ? (
                <LinearGradient colors={gradientPrimary} style={styles.primaryGradient}>
                  <CustomText style={styles.submitButtonText}>{t('dealer.createService')}</CustomText>
                </LinearGradient>
              ) : (
                <View style={[styles.primaryGradient, styles.submitButtonDisabled]}>
                  <CustomText style={styles.submitButtonText}>{t('dealer.createService')}</CustomText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <CustomDropdownBottomSheet
        visible={catalogDropdownVisible}
        onClose={() => setCatalogDropdownVisible(false)}
        title={
          catalogDropdownType === 'brand'
            ? t('dealer.selectCompatibleBrand')
            : t('dealer.selectCompatibleModel')
        }
        options={catalogDropdownType === 'brand' ? catalogBrands : catalogModels}
        selectedValue={catalogDropdownType === 'brand' ? vehicleBrandId : vehicleModelId}
        onSelect={(value) => {
          if (catalogDropdownType === 'brand') {
            setVehicleBrandId(value);
            setVehicleModelId('');
          } else {
            setVehicleModelId(value);
          }
        }}
        searchable={true}
      />
    </View>
  );
};

export default AddEditServiceScreen;

