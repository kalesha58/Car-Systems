import React, {useState, useEffect} from 'react';
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
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
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

const MAX_IMAGES = 8;

type ServiceType = 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'tire_service' | 'battery_service' | 'general';

const SERVICE_SUB_CATEGORIES: Record<string, string[]> = {
  car_wash: ['Interior Wash', 'Exterior Wash', 'Full Body', 'Foam Wash', 'Dry Clean'],
  car_detailing: ['PPF', 'Ceramic Coating', 'Paint Correction', 'Interior Detailing'],
  car_automobile: ['Oil Change', 'Brake Service', 'AC Service', 'Full Service', 'GPS Install'],
  bike_automobile: ['Oil Change', 'Chain Lube', 'Tyre Change', 'Full Service'],
  tire_service: ['Puncture Fix', 'Tyre Rotation', 'Tyre Replacement', 'Wheel Alignment'],
  battery_service: ['Battery Test', 'Battery Replacement', 'Jump Start', 'Charging'],
};

interface RouteParams {
  service?: IService;
}

const getAllowedServiceTypes = (businessType: string | undefined): ServiceType[] => {
  if (!businessType) {
    return ['car_wash', 'car_detailing', 'car_automobile', 'bike_automobile', 'tire_service', 'battery_service', 'general'];
  }

  switch (businessType) {
    case 'Vehicle Wash Station':
      return ['car_wash'];
    case 'Detailing Center':
      return ['car_detailing'];
    case 'Bike Dealer':
      return ['bike_automobile', 'tire_service', 'battery_service'];
    case 'Automobile Showroom':
      return ['car_automobile', 'tire_service', 'battery_service'];
    case 'Mechanic Workshop':
    case 'Riding Gear Store':
      return ['car_wash', 'car_detailing', 'car_automobile', 'bike_automobile', 'tire_service', 'battery_service', 'general'];
    default:
      return ['car_wash', 'car_detailing', 'car_automobile', 'bike_automobile', 'tire_service', 'battery_service', 'general'];
  }
};

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
  const allowedServiceTypes = getAllowedServiceTypes(businessRegistration?.type);
  
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
  const [vehicleModel, setVehicleModel] = useState(service?.vehicleModel || '');
  const [vehicleBrand, setVehicleBrand] = useState(service?.vehicleBrand || '');
  const [serviceSubCategory, setServiceSubCategory] = useState(service?.serviceSubCategory || '');
  const [servicePackage, setServicePackage] = useState<'premium' | 'basic'>(service?.servicePackage || 'basic');
  const [slotBookingEnabled, setSlotBookingEnabled] = useState(service?.slotBookingEnabled || false);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(service?.slotDurationMinutes?.toString() || '30');
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
          vehicleModel: vehicleModel.trim() || undefined,
          vehicleBrand: vehicleBrand.trim() || undefined,
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
          vehicleModel: vehicleModel.trim() || undefined,
          vehicleBrand: vehicleBrand.trim() || undefined,
          serviceSubCategory: serviceSubCategory.trim() || undefined,
          servicePackage,
          slotBookingEnabled,
          slotDurationMinutes: slotBookingEnabled ? parseInt(slotDurationMinutes) : undefined,
        };

        await createDealerService(createData);
        showSuccess(t('dealer.serviceCreated'));
      }

      setTimeout(() => {
        navigation.goBack();
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

  const cardShadow = {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: isDark ? 0.35 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

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
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      ...cardShadow,
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
      marginBottom: screenHeight * 0.022,
    },
    label: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
      marginBottom: screenHeight * 0.01,
      letterSpacing: 0.2,
    },
    required: {
      color: colors.error,
    },
    helpText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Regular,
      color: colors.error,
      marginTop: screenHeight * 0.008,
    },
    textInputContainer: {
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.012,
      minHeight: screenHeight * 0.056,
      ...cardShadow,
    },
    textInput: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: colors.text,
      paddingVertical: 0,
    },
    textInputMultiline: {
      minHeight: screenHeight * 0.14,
      textAlignVertical: 'top',
      paddingTop: 2,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.012,
      minHeight: screenHeight * 0.056,
      ...cardShadow,
    },
    switchLabel: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: colors.text,
      flex: 1,
      marginRight: screenWidth * 0.02,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.iceBlue,
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.winterBlueLight,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.014,
      ...cardShadow,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.iceBlue,
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.winterBlueLight,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.016,
      ...cardShadow,
    },
    buttonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
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
      borderColor: colors.border,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      ...cardShadow,
    },
    chipPillSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.secondary + '22',
    },
    chipPillText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
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
      borderRadius: RFValue(12),
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...cardShadow,
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
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.014,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.012,
      ...cardShadow,
    },
    locationText: {
      flex: 1,
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
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
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: -4},
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 12,
      elevation: 12,
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
      fontFamily: Fonts.SemiBold,
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
      shadowColor: colors.error,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 4,
    },
    deleteButtonHalf: {
      flex: 1,
    },
    deleteButtonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.SemiBold,
      color: '#fff',
    },
    primaryGradient: {
      paddingVertical: screenHeight * 0.018,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    primaryButtonShadow: {
      shadowColor: colors.secondary,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
      alignSelf: 'stretch',
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
          <View style={styles.section}>
            <CustomText style={styles.label}>
              {t('dealer.serviceName')} <CustomText style={styles.required}>*</CustomText>
            </CustomText>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t('dealer.enterServiceName')}
                placeholderTextColor={colors.disabled}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={[styles.section, styles.row]}>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>
                {t('dealer.price')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.textInputContainer}>
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
              <View style={styles.textInputContainer}>
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

          <View style={styles.section}>
            <View style={styles.switchContainer}>
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

          <View style={styles.section}>
            <View style={styles.switchContainer}>
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
                <View style={styles.textInputContainer}>
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

          <View style={styles.section}>
            <CustomText style={styles.label}>Service Package</CustomText>
            <View style={styles.chipGrid}>
              {(['basic', 'premium'] as const).map(pkg => (
                <TouchableOpacity
                  key={pkg}
                  style={[
                    styles.chipPill,
                    servicePackage === pkg && styles.chipPillSelected,
                  ]}
                  onPress={() => setServicePackage(pkg)}
                  activeOpacity={0.75}>
                  <CustomText
                    style={[
                      styles.chipPillText,
                      servicePackage === pkg && styles.chipPillTextSelected,
                    ]}>
                    {pkg.charAt(0).toUpperCase() + pkg.slice(1)}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.serviceType')}</CustomText>
            <View style={[styles.hintRow, !isExistingServiceTypeAllowed && {opacity: 0.65}]}>
              <Icon name="construct-outline" size={RFValue(18)} color={colors.winterBlueDark} />
              <CustomText
                style={[
                  styles.buttonText,
                  ...(!serviceType ? [{color: colors.disabled}] : []),
                ]}>
                {serviceType || t('dealer.selectServiceType')}
              </CustomText>
            </View>
            {!isExistingServiceTypeAllowed && (
              <CustomText style={styles.helpText}>
                {t('dealer.serviceTypeNotAllowed') ||
                  'This service type is not allowed for your business type. You can edit other fields but cannot change the service type.'}
              </CustomText>
            )}
            <View style={styles.chipGrid}>
              {allowedServiceTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chipPill,
                    serviceType === type && styles.chipPillSelected,
                    !isExistingServiceTypeAllowed && isEditMode && {opacity: 0.5},
                  ]}
                  onPress={() => {
                    if (!isExistingServiceTypeAllowed && isEditMode) {
                      return;
                    }
                    setServiceType(type);
                    if (type === 'car_automobile') {
                      setVehicleType('Car');
                    } else if (type === 'bike_automobile') {
                      setVehicleType('Bike');
                    } else {
                      setVehicleType(undefined);
                      setVehicleModel('');
                      setVehicleBrand('');
                    }
                  }}
                  disabled={!isExistingServiceTypeAllowed && isEditMode}
                  activeOpacity={0.75}>
                  <CustomText
                    style={[
                      styles.chipPillText,
                      serviceType === type && styles.chipPillTextSelected,
                    ]}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(serviceType === 'car_automobile' || serviceType === 'bike_automobile' || serviceType === 'car_wash') && (
            <View style={styles.section}>
              <CustomText style={styles.label}>{t('dealer.vehicleType')}</CustomText>
              <View style={styles.hintRow}>
                <Icon name="car-outline" size={RFValue(18)} color={colors.winterBlueDark} />
                <CustomText
                  style={[
                    styles.buttonText,
                    ...(!vehicleType ? [{color: colors.disabled}] : []),
                  ]}>
                  {vehicleType || t('dealer.selectVehicleType')}
                </CustomText>
              </View>
              <View style={styles.chipGrid}>
                {(['Car', 'Bike'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chipPill,
                      vehicleType === type && styles.chipPillSelected,
                    ]}
                    onPress={() => {
                      setVehicleType(type);
                      if (serviceType === 'car_automobile' && type !== 'Car') {
                        setServiceType('bike_automobile');
                      } else if (serviceType === 'bike_automobile' && type !== 'Bike') {
                        setServiceType('car_automobile');
                      }
                    }}
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

          {serviceType === 'bike_automobile' && (
            <>
              <View style={styles.section}>
                <CustomText style={styles.label}>{t('dealer.vehicleBrand')}</CustomText>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('dealer.enterVehicleBrand')}
                    placeholderTextColor={colors.disabled}
                    value={vehicleBrand}
                    onChangeText={setVehicleBrand}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={styles.label}>{t('dealer.vehicleModel')}</CustomText>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('dealer.enterVehicleModel')}
                    placeholderTextColor={colors.disabled}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                  />
                </View>
              </View>
            </>
          )}

          {serviceType && serviceType !== 'general' && SERVICE_SUB_CATEGORIES[serviceType] && (
            <View style={styles.section}>
              <CustomText style={styles.label}>{t('dealer.serviceSubCategory')}</CustomText>
              <View style={styles.chipGrid}>
                {SERVICE_SUB_CATEGORIES[serviceType].map(subCat => (
                  <TouchableOpacity
                    key={subCat}
                    style={[
                      styles.chipPill,
                      serviceSubCategory === subCat && styles.chipPillSelected,
                    ]}
                    onPress={() => setServiceSubCategory(subCat)}
                    activeOpacity={0.75}>
                    <CustomText
                      style={[
                        styles.chipPillText,
                        serviceSubCategory === subCat && styles.chipPillTextSelected,
                      ]}>
                      {subCat}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.textInputContainer, { marginTop: 12 }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Or type custom sub-category..."
                  placeholderTextColor={colors.disabled}
                  value={serviceSubCategory}
                  onChangeText={setServiceSubCategory}
                />
              </View>
            </View>
          )}

          {(!serviceType || serviceType === 'general') && (
            <View style={styles.section}>
              <CustomText style={styles.label}>{t('dealer.serviceSubCategory')}</CustomText>
              <View style={styles.textInputContainer}>
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
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t('dealer.enterCategory')}
                placeholderTextColor={colors.disabled}
                value={category}
                onChangeText={setCategory}
              />
            </View>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.description')}</CustomText>
            <View style={styles.textInputContainer}>
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
      </ScrollView>

      <View style={[styles.stickyButtonContainer, {bottom: stickyFooterBottomOffset}]}>
        {isEditMode ? (
          <View style={styles.editDeleteRow}>
            <View
              style={[
                styles.editButton,
                (isFormValid || isSubmitting) && styles.primaryButtonShadow,
              ]}>
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
          <View style={[styles.primaryButtonShadow, styles.fullWidthPrimary]}>
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
    </View>
  );
};

export default AddEditServiceScreen;

