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
import { Fonts, fontStyle } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import CustomDropdownBottomSheet, {IDropdownOption} from '@components/ui/CustomDropdownBottomSheet';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';
import {useBusinessRegistration} from '@hooks/useBusinessRegistration';
import {useTranslation} from 'react-i18next';
import {
  createDealerVehicle,
  updateDealerVehicle,
  deleteDealerVehicle,
  ICreateDealerVehicleRequest,
  IUpdateDealerVehicleRequest,
} from '@service/dealerService';
import {uploadImagesBatch} from '@service/postService';
import {getDropdownOptions} from '@service/dropdownService';
import {IDealerVehicle} from '../../types/vehicle/IVehicle';

const MAX_IMAGES = 8;

const COMMON_FEATURES = {
  Car: [
    'ABS', 'Airbags', 'Sunroof', 'Reverse Camera', 'Cruise Control', 
    'Keyless Entry', 'Alloy Wheels', 'Leather Seats', 'Android Auto/CarPlay', 'GPS Tracker'
  ],
  Bike: [
    'ABS', 'Disc Brakes', 'Alloy Wheels', 'Digital Console', 'Slipper Clutch',
    'Tubeless Tyres', 'LED Headlights', 'GPS Tracker'
  ]
};

interface RouteParams {
  vehicle?: IDealerVehicle;
}

const AddEditVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {showSuccess, showError} = useToast();
  const {businessRegistration} = useBusinessRegistration();
  const {t} = useTranslation();
  const params = (route.params as RouteParams) || {};

  const showTestDriveOption =
    businessRegistration?.type === 'Automobile Showroom' ||
    businessRegistration?.type === 'Bike Dealer';

  const isEditMode = !!params.vehicle;
  const vehicle = params.vehicle;

  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike'>(vehicle?.vehicleType || 'Car');
  const [vehicleBrandId, setVehicleBrandId] = useState(vehicle?.vehicleBrandId || '');
  const [vehicleModelId, setVehicleModelId] = useState(vehicle?.vehicleModelId || '');
  const [catalogBrands, setCatalogBrands] = useState<IDropdownOption[]>([]);
  const [catalogModels, setCatalogModels] = useState<IDropdownOption[]>([]);
  const [year, setYear] = useState(vehicle?.year?.toString() || '');
  const [price, setPrice] = useState(vehicle?.price?.toString() || '');
  const [availability, setAvailability] = useState<'available' | 'sold' | 'reserved'>(
    vehicle?.availability || 'available',
  );
  const [numberPlate, setNumberPlate] = useState(vehicle?.numberPlate || '');
  const [mileage, setMileage] = useState(vehicle?.mileage?.toString() || '');
  const [color, setColor] = useState(vehicle?.color || '');
  const [fuelType, setFuelType] = useState<'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | ''>(
    vehicle?.fuelType || '',
  );
  const [transmission, setTransmission] = useState<'Manual' | 'Automatic' | ''>(
    vehicle?.transmission || '',
  );
  const [description, setDescription] = useState(vehicle?.description || '');
  const [condition, setCondition] = useState<'New' | 'Used' | 'Certified Pre-owned' | ''>(
    vehicle?.condition || '',
  );
  const [allowTestDrive, setAllowTestDrive] = useState(vehicle?.allowTestDrive || false);
  const [features, setFeatures] = useState<string[]>(vehicle?.features || []);
  const [imageUris, setImageUris] = useState<string[]>(vehicle?.images || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState<
    'vehicleType' | 'brand' | 'model' | 'availability' | 'fuelType' | 'transmission' | 'condition' | 'features'
  >('vehicleType');
  const [vehicleTypes, setVehicleTypes] = useState<IDropdownOption[]>([]);
  const [availabilityOptions, setAvailabilityOptions] = useState<IDropdownOption[]>([]);
  const [fuelTypes, setFuelTypes] = useState<IDropdownOption[]>([]);
  const [transmissionOptions, setTransmissionOptions] = useState<IDropdownOption[]>([]);
  const [conditionOptions, setConditionOptions] = useState<IDropdownOption[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const options = await getDropdownOptions(vehicleType);
        setCatalogBrands(options.brands || []);
      } catch {
        setCatalogBrands([]);
      }
    };
    loadBrands();
  }, [vehicleType]);

  useEffect(() => {
    const loadModels = async () => {
      if (!vehicleBrandId) {
        setCatalogModels([]);
        return;
      }
      try {
        const options = await getDropdownOptions(vehicleType, vehicleBrandId);
        setCatalogModels(options.models || []);
      } catch {
        setCatalogModels([]);
      }
    };
    loadModels();
  }, [vehicleType, vehicleBrandId]);

  const fetchDropdownOptions = async () => {
    try {
      setDropdownsLoading(true);
      const options = await getDropdownOptions();
      
      setVehicleTypes(options.vehicleTypes || []);
      setAvailabilityOptions(options.availability || []);
      setFuelTypes(options.fuelTypes || []);
      setTransmissionOptions(options.transmission || []);
      setConditionOptions(options.condition || []);
      
      // Warn if no data received
      const totalOptions = 
        (options.vehicleTypes?.length || 0) +
        (options.availability?.length || 0) +
        (options.fuelTypes?.length || 0) +
        (options.transmission?.length || 0) +
        (options.condition?.length || 0);
      
      if (totalOptions === 0) {
        console.warn('AddEditVehicleScreen: No dropdown options received from API');
        showError(t('dealer.dropdownOptionsNotAvailable') || 'Dropdown options are not available. Please try again later.');
      }
    } catch (error: any) {
      console.error('Error fetching dropdown options:', error);
      // Set empty arrays on error to prevent undefined issues
      setVehicleTypes([]);
      setAvailabilityOptions([]);
      setFuelTypes([]);
      setTransmissionOptions([]);
      setConditionOptions([]);
      
      // Show error to user
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          t('dealer.failedToLoadDropdowns') || 
                          'Failed to load dropdown options. Please try again.';
      showError(errorMessage);
    } finally {
      setDropdownsLoading(false);
    }
  };

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
    if (!vehicleBrandId) {
      showError(t('dealer.brandRequired'));
      return;
    }
    if (!vehicleModelId) {
      showError(t('dealer.modelRequired'));
      return;
    }
    if (!year || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1) {
      showError(t('dealer.validYearRequired'));
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showError(t('dealer.priceRequired'));
      return;
    }
    if (imageUris.length === 0) {
      showError(t('dealer.imagesRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();

      if (isEditMode && vehicle) {
        const updateData: IUpdateDealerVehicleRequest = {
          vehicleType,
          vehicleBrandId,
          vehicleModelId,
          year: parseInt(year),
          price: parseFloat(price),
          availability,
          images: uploadedImageUrls,
          numberPlate: numberPlate.trim() || undefined,
          mileage: mileage ? parseFloat(mileage) : undefined,
          color: color.trim() || undefined,
          fuelType: fuelType || undefined,
          transmission: transmission || undefined,
          description: description.trim() || undefined,
          condition: condition || undefined,
          allowTestDrive: allowTestDrive,
          features: features.length > 0 ? features : undefined,
        };

        await updateDealerVehicle(vehicle.id, updateData);
        showSuccess(t('dealer.vehicleUpdated'));
      } else {
        const createData: ICreateDealerVehicleRequest = {
          vehicleType,
          vehicleBrandId,
          vehicleModelId,
          year: parseInt(year),
          price: parseFloat(price),
          availability,
          images: uploadedImageUrls,
          numberPlate: numberPlate.trim() || undefined,
          mileage: mileage ? parseFloat(mileage) : undefined,
          color: color.trim() || undefined,
          fuelType: fuelType || undefined,
          transmission: transmission || undefined,
          description: description.trim() || undefined,
          condition: condition || undefined,
          allowTestDrive: allowTestDrive,
          features: features.length > 0 ? features : undefined,
        };

        await createDealerVehicle(createData);
        showSuccess(t('dealer.vehicleCreated'));
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
    if (!vehicle) return;

    Alert.alert(t('dealer.deleteVehicle'), t('dealer.deleteVehicleConfirm'), [
      {text: t('dealer.cancel'), style: 'cancel'},
      {
        text: t('dealer.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteDealerVehicle(vehicle.id);
            showSuccess(t('dealer.vehicleDeleted'));
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

  const openDropdown = (
    type: 'vehicleType' | 'brand' | 'model' | 'availability' | 'fuelType' | 'transmission' | 'condition' | 'features',
  ) => {
    setDropdownType(type);
    setDropdownModalVisible(true);
  };

  const handleDropdownSelect = (value: string) => {
    switch (dropdownType) {
      case 'vehicleType': {
        const nextType = value as 'Car' | 'Bike';
        setVehicleType(nextType);
        setVehicleBrandId('');
        setVehicleModelId('');
        setFeatures(prev => prev.filter(f => COMMON_FEATURES[nextType].includes(f)));
        break;
      }
      case 'brand':
        setVehicleBrandId(value);
        setVehicleModelId('');
        break;
      case 'model':
        setVehicleModelId(value);
        break;
      case 'availability':
        setAvailability(value as 'available' | 'sold' | 'reserved');
        break;
      case 'fuelType':
        setFuelType(value as 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid');
        break;
      case 'transmission':
        setTransmission(value as 'Manual' | 'Automatic');
        break;
      case 'condition':
        setCondition(value as 'New' | 'Used' | 'Certified Pre-owned');
        break;
    }
  };

  const getSelectedLabel = (
    type?: 'vehicleType' | 'brand' | 'model' | 'availability' | 'fuelType' | 'transmission' | 'condition',
  ) => {
    const currentType = type || dropdownType;
    switch (currentType) {
      case 'vehicleType':
        return vehicleTypes.find(v => v.value === vehicleType)?.label || vehicleType || t('dealer.selectVehicleType');
      case 'brand':
        return catalogBrands.find(b => b.value === vehicleBrandId)?.label || t('dealer.selectCompatibleBrand');
      case 'model':
        return catalogModels.find(m => m.value === vehicleModelId)?.label || t('dealer.selectCompatibleModel');
      case 'availability':
        return (
          availabilityOptions.find(a => a.value === availability)?.label ||
          availability ||
          t('dealer.selectAvailability')
        );
      case 'fuelType':
        return fuelTypes.find(f => f.value === fuelType)?.label || fuelType || t('dealer.selectFuelType');
      case 'transmission':
        return (
          transmissionOptions.find(opt => opt.value === transmission)?.label ||
          transmission ||
          t('dealer.selectTransmission')
        );
      case 'condition':
        return conditionOptions.find(c => c.value === condition)?.label || condition || t('dealer.selectCondition');
      default:
        return '';
    }
  };

  const getFeaturesDisplayLabel = () => {
    if (features.length === 0) {
      return t('dealer.selectFeatures');
    }
    if (features.length <= 2) {
      return features.join(', ');
    }
    return t('dealer.featuresSelected', {count: features.length});
  };

  const getCurrentDropdownOptions = () => {
    switch (dropdownType) {
      case 'vehicleType':
        return vehicleTypes;
      case 'brand':
        return catalogBrands;
      case 'model':
        return catalogModels;
      case 'availability':
        return availabilityOptions;
      case 'fuelType':
        return fuelTypes;
      case 'transmission':
        return transmissionOptions;
      case 'condition':
        return conditionOptions;
      case 'features':
        return COMMON_FEATURES[vehicleType].map(feature => ({label: feature, value: feature}));
      default:
        return [];
    }
  };

  const getSelectedValue = () => {
    switch (dropdownType) {
      case 'vehicleType':
        return vehicleType;
      case 'brand':
        return vehicleBrandId;
      case 'model':
        return vehicleModelId;
      case 'availability':
        return availability;
      case 'fuelType':
        return fuelType;
      case 'transmission':
        return transmission;
      case 'condition':
        return condition;
      default:
        return '';
    }
  };

  const getDropdownTitle = () => {
    switch (dropdownType) {
      case 'vehicleType':
        return t('dealer.selectVehicleType');
      case 'brand':
        return t('dealer.selectCompatibleBrand');
      case 'model':
        return t('dealer.selectCompatibleModel');
      case 'availability':
        return t('dealer.selectAvailability');
      case 'fuelType':
        return t('dealer.selectFuelType');
      case 'transmission':
        return t('dealer.selectTransmission');
      case 'condition':
        return t('dealer.selectCondition');
      case 'features':
        return t('dealer.selectFeatures');
      default:
        return t('dealer.selectOption');
    }
  };

  const isSubmitting = isLoading || isUploadingImages;
  const isFormValid =
    vehicleBrandId.length > 0 &&
    vehicleModelId.length > 0 &&
    year &&
    parseInt(year) >= 1900 &&
    price &&
    parseFloat(price) > 0 &&
    imageUris.length > 0 &&
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
    dropdownButtonText: {
      fontSize: RFValue(11),
      ...fontStyle(Fonts.Regular),
      color: colors.text,
      flex: 1,
      marginRight: screenWidth * 0.02,
    },
    dropdownPlaceholder: {
      color: colors.disabled,
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
    helperText: {
      fontSize: RFValue(10),
      ...fontStyle(Fonts.Regular),
      marginTop: 4,
      lineHeight: RFValue(14),
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

  return (
    <View style={styles.container}>
      <CustomHeader
        title={isEditMode ? t('dealer.editVehicle') : t('dealer.addVehicle')}
        backgroundColor="#0d8320"
        titleColor="#fff"
        iconColor="#fff"
        showNotificationIcon={false}
        rightComponent={<View style={{width: RFValue(28)}} />}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: screenHeight * 0.12}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionBasicInfo')}</CustomText>
            <View style={styles.section}>
            <CustomText style={styles.label}>
              {t('dealer.vehicleType')} <CustomText style={styles.required}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[styles.field, styles.dropdownField]}
              onPress={() => openDropdown('vehicleType')}
              activeOpacity={0.75}>
              <CustomText style={styles.dropdownButtonText}>{getSelectedLabel('vehicleType')}</CustomText>
              <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, styles.row]}>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>
                {t('dealer.brand')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[styles.field, styles.dropdownField]}
                onPress={() => openDropdown('brand')}
                activeOpacity={0.75}>
                <CustomText style={styles.dropdownButtonText}>{getSelectedLabel('brand')}</CustomText>
                <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>
                {t('dealer.model')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[styles.field, styles.dropdownField]}
                onPress={() => openDropdown('model')}
                activeOpacity={0.75}
                disabled={!vehicleBrandId}>
                <CustomText style={styles.dropdownButtonText}>{getSelectedLabel('model')}</CustomText>
                <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          {catalogBrands.length === 0 && (
            <CustomText style={{fontSize: RFValue(10), opacity: 0.6, marginBottom: 8}}>
              {t('dealer.noBrandsConfigured')}
            </CustomText>
          )}
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionPricing')}</CustomText>
          <View style={[styles.section, styles.row]}>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>
                {t('dealer.year')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterYear')}
                  placeholderTextColor={colors.disabled}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />
              </View>
            </View>
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
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>
              {t('dealer.availability')} <CustomText style={styles.required}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[styles.field, styles.dropdownField]}
              onPress={() => openDropdown('availability')}
              activeOpacity={0.75}>
              <CustomText style={styles.dropdownButtonText}>{getSelectedLabel('availability')}</CustomText>
              <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionClassification')}</CustomText>
          <View style={[styles.section, styles.row]}>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>{t('dealer.numberPlate')}</CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterNumberPlate')}
                  placeholderTextColor={colors.disabled}
                  value={numberPlate}
                  onChangeText={setNumberPlate}
                />
              </View>
            </View>
            <View style={styles.halfField}>
              <CustomText style={styles.label}>{t('dealer.mileage')}</CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterMileage')}
                  placeholderTextColor={colors.disabled}
                  value={mileage}
                  onChangeText={setMileage}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.color')}</CustomText>
            <View style={styles.field}>
              <TextInput
                style={styles.textInput}
                placeholder={t('dealer.enterColor')}
                placeholderTextColor={colors.disabled}
                value={color}
                onChangeText={setColor}
              />
            </View>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.fuelType')}</CustomText>
            <TouchableOpacity
              style={[styles.field, styles.dropdownField]}
              onPress={() => openDropdown('fuelType')}
              activeOpacity={0.75}>
              <CustomText
                style={[
                  styles.dropdownButtonText,
                  ...(!fuelType ? [styles.dropdownPlaceholder] : []),
                ]}>
                {getSelectedLabel('fuelType')}
              </CustomText>
              <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.transmission')}</CustomText>
            <TouchableOpacity
              style={[styles.field, styles.dropdownField]}
              onPress={() => openDropdown('transmission')}
              activeOpacity={0.75}>
              <CustomText
                style={[
                  styles.dropdownButtonText,
                  ...(!transmission ? [styles.dropdownPlaceholder] : []),
                ]}>
                {getSelectedLabel('transmission')}
              </CustomText>
              <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.condition')}</CustomText>
            <TouchableOpacity
              style={[styles.field, styles.dropdownField]}
              onPress={() => openDropdown('condition')}
              activeOpacity={0.75}>
              <CustomText
                style={[
                  styles.dropdownButtonText,
                  ...(!condition ? [styles.dropdownPlaceholder] : []),
                ]}>
                {getSelectedLabel('condition')}
              </CustomText>
              <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            {showTestDriveOption && (
              <>
                <View style={styles.switchRow}>
                  <CustomText style={styles.switchLabel}>{t('dealer.allowTestDrive')}</CustomText>
                  <Switch
                    value={allowTestDrive}
                    onValueChange={setAllowTestDrive}
                    trackColor={{false: colors.disabled, true: colors.secondary + '80'}}
                    thumbColor={allowTestDrive ? colors.secondary : colors.disabled}
                  />
                </View>
                <CustomText style={[styles.helperText, {color: colors.textSecondary}]}>
                  Customers can request a test drive for this vehicle only when enabled.
                </CustomText>
              </>
            )}
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.features')}</CustomText>
            <TouchableOpacity
              style={[styles.field, styles.dropdownField]}
              onPress={() => openDropdown('features')}
              activeOpacity={0.75}>
              <CustomText
                style={[
                  styles.dropdownButtonText,
                  ...(features.length === 0 ? [styles.dropdownPlaceholder] : []),
                ]}>
                {getFeaturesDisplayLabel()}
              </CustomText>
              <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
            </TouchableOpacity>
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

          <View style={[styles.section, {marginBottom: 0}]}>
            <CustomText style={styles.label}>
              {t('dealer.images')} <CustomText style={styles.required}>*</CustomText>
            </CustomText>
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
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyButtonContainer, {paddingBottom: Math.max(insets.bottom, screenHeight * 0.028)}]}>
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
                    <CustomText style={styles.submitButtonText}>{t('dealer.updateVehicle')}</CustomText>
                  </LinearGradient>
                ) : (
                  <View style={[styles.primaryGradient, styles.submitButtonDisabled]}>
                    <Icon name="create-outline" size={RFValue(18)} color="rgba(255,255,255,0.85)" />
                    <CustomText style={styles.submitButtonText}>{t('dealer.updateVehicle')}</CustomText>
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
              <CustomText style={styles.deleteButtonText}>{t('dealer.deleteVehicle')}</CustomText>
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
                  <CustomText style={styles.submitButtonText}>{t('dealer.createVehicle')}</CustomText>
                </LinearGradient>
              ) : (
                <View style={[styles.primaryGradient, styles.submitButtonDisabled]}>
                  <CustomText style={styles.submitButtonText}>{t('dealer.createVehicle')}</CustomText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <CustomDropdownBottomSheet
        visible={dropdownModalVisible}
        onClose={() => setDropdownModalVisible(false)}
        options={getCurrentDropdownOptions()}
        title={getDropdownTitle()}
        searchable={true}
        multiSelect={dropdownType === 'features'}
        selectedValue={dropdownType !== 'features' ? getSelectedValue() : undefined}
        onSelect={dropdownType !== 'features' ? handleDropdownSelect : undefined}
        selectedValues={dropdownType === 'features' ? features : undefined}
        onSelectMultiple={dropdownType === 'features' ? setFeatures : undefined}
      />
    </View>
  );
};

export default AddEditVehicleScreen;

