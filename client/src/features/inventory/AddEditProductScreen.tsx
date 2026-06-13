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
import {useTranslation} from 'react-i18next';
import {
  createDealerProduct,
  updateDealerProduct,
  deleteDealerProduct,
  ICreateDealerProductRequest,
  IUpdateDealerProductRequest,
} from '@service/dealerService';
import {uploadImagesBatch} from '@service/postService';
import {getDropdownOptions} from '@service/dropdownService';
import {IProduct} from '../../types/product/IProduct';

const MAX_IMAGES = 8;
const BATTERY_CATEGORY_NAME = 'Batteries & Chargers';

interface RouteParams {
  product?: IProduct;
}

const AddEditProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {showSuccess, showError} = useToast();
  const {t} = useTranslation();
  const params = (route.params as RouteParams) || {};

  const isEditMode = !!params.product;
  const product = params.product;

  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | ''>(
    product?.vehicleType === 'Car' || product?.vehicleType === 'Bike' ? product.vehicleType : '',
  );
  const [description, setDescription] = useState(product?.description || '');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [deliveryTimeMinutes, setDeliveryTimeMinutes] = useState(product?.deliveryTimeMinutes?.toString() || '');
  const [isSparePart, setIsSparePart] = useState(product?.isSparePart || false);
  const [imageUris, setImageUris] = useState<string[]>(product?.images || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState<
    'category' | 'vehicleType' | 'batteryType' | 'compatibleBrand' | 'compatibleModel'
  >('category');
  const [categories, setCategories] = useState<IDropdownOption[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<IDropdownOption[]>([]);
  const [batteryTypes, setBatteryTypes] = useState<IDropdownOption[]>([]);
  const [batteryTypeId, setBatteryTypeId] = useState(product?.batteryTypeId || '');
  const [voltageV, setVoltageV] = useState(product?.voltageV?.toString() || '');
  const [vehicleBrandId, setVehicleBrandId] = useState(product?.vehicleBrandId || '');
  const [vehicleModelId, setVehicleModelId] = useState(product?.vehicleModelId || '');
  const [compatibleBrands, setCompatibleBrands] = useState<IDropdownOption[]>([]);
  const [compatibleModels, setCompatibleModels] = useState<IDropdownOption[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    const loadCompatibleBrands = async () => {
      if (!isSparePart || !vehicleType) {
        setCompatibleBrands([]);
        return;
      }
      try {
        const options = await getDropdownOptions(vehicleType);
        setCompatibleBrands(options.brands || []);
      } catch {
        setCompatibleBrands([]);
      }
    };
    loadCompatibleBrands();
  }, [isSparePart, vehicleType]);

  useEffect(() => {
    const loadCompatibleModels = async () => {
      if (!isSparePart || !vehicleType || !vehicleBrandId) {
        setCompatibleModels([]);
        return;
      }
      try {
        const options = await getDropdownOptions(vehicleType, vehicleBrandId);
        setCompatibleModels(options.models || []);
      } catch {
        setCompatibleModels([]);
      }
    };
    loadCompatibleModels();
  }, [isSparePart, vehicleType, vehicleBrandId]);

  // Map category name to category ID when categories are loaded in edit mode
  useEffect(() => {
    if (isEditMode && product?.category && categories.length > 0) {
      // Find category option by label (name) matching product.category
      const matchedCategory = categories.find(cat => cat.label === product.category);
      if (matchedCategory && category !== matchedCategory.value) {
        setCategory(matchedCategory.value);
      }
    }
  }, [categories, isEditMode, product?.category]);

  const fetchDropdownOptions = async () => {
    try {
      setDropdownsLoading(true);
      const options = await getDropdownOptions();
      
      setCategories(options.categories || []);
      setVehicleTypes(options.vehicleTypes || []);
      setBatteryTypes(options.batteryTypes || []);
      
      // Warn if no data received
      const totalOptions = (options.categories?.length || 0) + (options.vehicleTypes?.length || 0);
      if (totalOptions === 0) {
        console.warn('AddEditProductScreen: No dropdown options received from API');
        showError(t('dealer.dropdownOptionsNotAvailable') || 'Dropdown options are not available. Please try again later.');
      }
    } catch (error: any) {
      console.error('Error fetching dropdown options:', error);
      // Set empty arrays on error to prevent undefined issues
      setCategories([]);
      setVehicleTypes([]);
      
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
      console.error('Error in uploadImages:', err);
      throw err;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError(t('dealer.productNameRequired'));
      return;
    }
    if (!brand.trim()) {
      showError(t('dealer.brandRequired'));
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showError(t('dealer.priceRequired'));
      return;
    }
    if (!stock || parseInt(stock) < 0) {
      showError(t('dealer.stockRequired'));
      return;
    }
    if (!category) {
      showError(t('dealer.categoryRequired'));
      return;
    }
    if (imageUris.length === 0) {
      showError(t('dealer.imagesRequired'));
      return;
    }
    if (isBatteryCategorySelected) {
      if (!batteryTypeId) {
        showError(t('dealer.batteryTypeRequired'));
        return;
      }
      const parsedVoltage = parseFloat(voltageV);
      if (!voltageV || Number.isNaN(parsedVoltage) || parsedVoltage <= 0) {
        showError(t('dealer.voltageRequired'));
        return;
      }
    }

    if (isSparePart && vehicleType) {
      if (!vehicleBrandId) {
        showError(t('dealer.compatibleBrandRequired'));
        return;
      }
    }

    setIsLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();
      
      let computedDiscount: number | undefined = undefined;
      const parsedPrice = parseFloat(price);
      const parsedOriginal = originalPrice ? parseFloat(originalPrice) : undefined;
      if (parsedOriginal && parsedOriginal > parsedPrice) {
        computedDiscount = Math.round(((parsedOriginal - parsedPrice) / parsedOriginal) * 100);
      }

      if (isEditMode && product) {
        const updateData: IUpdateDealerProductRequest = {
          name: name.trim(),
          brand: brand.trim(),
          price: parsedPrice,
          originalPrice: parsedOriginal,
          discountPercentage: computedDiscount,
          stock: parseInt(stock),
          images: uploadedImageUrls,
          category,
          vehicleType: vehicleType || undefined,
          description: description.trim() || undefined,
          returnPolicy: returnPolicy.trim() || undefined,
          deliveryTimeMinutes: deliveryTimeMinutes ? parseInt(deliveryTimeMinutes) : undefined,
          isSparePart,
          batteryTypeId: isBatteryCategorySelected ? batteryTypeId : undefined,
          voltageV: isBatteryCategorySelected ? parseFloat(voltageV) : undefined,
          vehicleBrandId: isSparePart && vehicleType ? vehicleBrandId : undefined,
          vehicleModelId: isSparePart && vehicleType && vehicleModelId ? vehicleModelId : undefined,
        };

        await updateDealerProduct(product.id, updateData);
        showSuccess(t('dealer.productUpdated'));
      } else {
        const createData: ICreateDealerProductRequest = {
          name: name.trim(),
          brand: brand.trim(),
          price: parsedPrice,
          originalPrice: parsedOriginal,
          discountPercentage: computedDiscount,
          stock: parseInt(stock),
          images: uploadedImageUrls,
          category,
          vehicleType: vehicleType || undefined,
          description: description.trim() || undefined,
          returnPolicy: returnPolicy.trim() || undefined,
          deliveryTimeMinutes: deliveryTimeMinutes ? parseInt(deliveryTimeMinutes) : undefined,
          isSparePart,
          batteryTypeId: isBatteryCategorySelected ? batteryTypeId : undefined,
          voltageV: isBatteryCategorySelected ? parseFloat(voltageV) : undefined,
          vehicleBrandId: isSparePart && vehicleType ? vehicleBrandId : undefined,
          vehicleModelId: isSparePart && vehicleType && vehicleModelId ? vehicleModelId : undefined,
        };

        await createDealerProduct(createData);
        showSuccess(t('dealer.productCreated'));
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
    if (!product) return;

    Alert.alert(t('dealer.deleteProduct'), t('dealer.deleteProductConfirm'), [
      {text: t('dealer.cancel'), style: 'cancel'},
      {
        text: t('dealer.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteDealerProduct(product.id);
            showSuccess(t('dealer.productDeleted'));
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

  const isBatteryCategorySelected =
    categories.find(c => c.value === category)?.label === BATTERY_CATEGORY_NAME;

  const openDropdown = (
    type: 'category' | 'vehicleType' | 'batteryType' | 'compatibleBrand' | 'compatibleModel',
  ) => {
    setDropdownType(type);
    setDropdownModalVisible(true);
  };

  const handleDropdownSelect = (value: string) => {
    if (dropdownType === 'category') {
      setCategory(value);
      const label = categories.find(c => c.value === value)?.label;
      if (label !== BATTERY_CATEGORY_NAME) {
        setBatteryTypeId('');
        setVoltageV('');
      }
    } else if (dropdownType === 'vehicleType') {
      setVehicleType(value as 'Car' | 'Bike');
      setVehicleBrandId('');
      setVehicleModelId('');
    } else if (dropdownType === 'batteryType') {
      setBatteryTypeId(value);
    } else if (dropdownType === 'compatibleBrand') {
      setVehicleBrandId(value);
      setVehicleModelId('');
    } else if (dropdownType === 'compatibleModel') {
      setVehicleModelId(value);
    }
  };

  const getCategoryDisplayLabel = () => {
    const foundByValue = categories.find(c => c.value === category);
    if (foundByValue) {
      return foundByValue.label;
    }
    const foundByLabel = categories.find(c => c.label === category);
    if (foundByLabel) {
      return foundByLabel.label;
    }
    return category || t('dealer.selectCategory');
  };

  const getVehicleTypeDisplayLabel = () => {
    return (
      vehicleTypes.find(v => v.value === vehicleType)?.label ||
      vehicleType ||
      t('dealer.selectVehicleType')
    );
  };

  const getCurrentDropdownOptions = () => {
    if (dropdownType === 'category') {
      return categories;
    }
    if (dropdownType === 'batteryType') {
      return batteryTypes;
    }
    if (dropdownType === 'compatibleBrand') {
      return compatibleBrands;
    }
    if (dropdownType === 'compatibleModel') {
      return compatibleModels;
    }
    return vehicleTypes;
  };

  const getSelectedValue = () => {
    if (dropdownType === 'category') {
      return category;
    }
    if (dropdownType === 'batteryType') {
      return batteryTypeId;
    }
    if (dropdownType === 'compatibleBrand') {
      return vehicleBrandId;
    }
    if (dropdownType === 'compatibleModel') {
      return vehicleModelId;
    }
    return vehicleType;
  };

  const getBatteryTypeDisplayLabel = () => {
    return (
      batteryTypes.find(b => b.value === batteryTypeId)?.label ||
      t('dealer.selectBatteryType')
    );
  };

  const isSubmitting = isLoading || isUploadingImages;
  const isFormValid =
    name.trim().length > 0 &&
    brand.trim().length > 0 &&
    price &&
    parseFloat(price) > 0 &&
    stock &&
    parseInt(stock) >= 0 &&
    category &&
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

  const categoryDisplay = getCategoryDisplayLabel();
  const vehicleDisplay = getVehicleTypeDisplayLabel();
  const categoryIsPlaceholder = !category;
  const vehicleIsPlaceholder = !vehicleType;

  const gradientPrimary: [string, string] = [
    colors.secondary,
    isDark ? '#0b5c16' : '#095a14',
  ];

  return (
    <View style={styles.container}>
      <CustomHeader
        title={isEditMode ? t('dealer.editProduct') : t('dealer.addProduct')}
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
                {t('dealer.productName')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterProductName')}
                  placeholderTextColor={colors.disabled}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('dealer.brand')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.field}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterBrand')}
                  placeholderTextColor={colors.disabled}
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionPricing')}</CustomText>
            <View style={[styles.section, styles.row]}>
              <View style={styles.halfField}>
                <CustomText style={styles.label}>Original Price (₹)</CustomText>
                <View style={styles.field}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1500"
                    placeholderTextColor={colors.disabled}
                    value={originalPrice}
                    onChangeText={setOriginalPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.halfField}>
                <CustomText style={styles.label}>
                  Sale Price (₹) <CustomText style={styles.required}>*</CustomText>
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
            <View style={[styles.section, styles.row]}>
              <View style={styles.halfField}>
                <CustomText style={styles.label}>
                  {t('dealer.stock')} <CustomText style={styles.required}>*</CustomText>
                </CustomText>
                <View style={styles.field}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('dealer.enterStock')}
                    placeholderTextColor={colors.disabled}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.halfField}>
                <CustomText style={styles.label}>Delivery Time (Mins)</CustomText>
                <View style={styles.field}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 60"
                    placeholderTextColor={colors.disabled}
                    value={deliveryTimeMinutes}
                    onChangeText={setDeliveryTimeMinutes}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.sectionGroup}>
            <CustomText style={styles.sectionHeader}>{t('dealer.sectionClassification')}</CustomText>
            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('dealer.category')} <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[styles.field, styles.dropdownField]}
                onPress={() => openDropdown('category')}
                activeOpacity={0.75}>
                <CustomText
                  style={[
                    styles.dropdownButtonText,
                    ...(categoryIsPlaceholder ? [styles.dropdownPlaceholder] : []),
                  ]}>
                  {categoryDisplay}
                </CustomText>
                <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {isBatteryCategorySelected && (
              <>
                <View style={styles.section}>
                  <CustomText style={styles.label}>
                    {t('dealer.batteryType')} <CustomText style={styles.required}>*</CustomText>
                  </CustomText>
                  <TouchableOpacity
                    style={[styles.field, styles.dropdownField]}
                    onPress={() => openDropdown('batteryType')}
                    activeOpacity={0.75}>
                    <CustomText style={styles.dropdownButtonText}>{getBatteryTypeDisplayLabel()}</CustomText>
                    <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.section}>
                  <CustomText style={styles.label}>
                    {t('dealer.voltageV')} <CustomText style={styles.required}>*</CustomText>
                  </CustomText>
                  <View style={styles.field}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={t('dealer.enterVoltage')}
                      placeholderTextColor={colors.disabled}
                      value={voltageV}
                      onChangeText={setVoltageV}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.section}>
              <CustomText style={styles.label}>{t('dealer.vehicleType')}</CustomText>
              <TouchableOpacity
                style={[styles.field, styles.dropdownField]}
                onPress={() => openDropdown('vehicleType')}
                activeOpacity={0.75}>
                <CustomText
                  style={[
                    styles.dropdownButtonText,
                    ...(vehicleIsPlaceholder ? [styles.dropdownPlaceholder] : []),
                  ]}>
                  {vehicleDisplay}
                </CustomText>
                <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.switchRow}>
                <CustomText style={styles.switchLabel}>Is this a Spare Part?</CustomText>
                <Switch
                  value={isSparePart}
                  onValueChange={(value) => {
                    setIsSparePart(value);
                    if (!value) {
                      setVehicleBrandId('');
                      setVehicleModelId('');
                    }
                  }}
                  trackColor={{false: colors.disabled, true: colors.secondary + '80'}}
                  thumbColor={isSparePart ? colors.secondary : colors.disabled}
                />
              </View>
            </View>

            {isSparePart && vehicleType ? (
              <>
                <View style={styles.section}>
                  <CustomText style={styles.label}>
                    {t('dealer.compatibleBrand')} <CustomText style={styles.required}>*</CustomText>
                  </CustomText>
                  <TouchableOpacity
                    style={[styles.field, styles.dropdownField]}
                    onPress={() => openDropdown('compatibleBrand')}
                    activeOpacity={0.75}>
                    <CustomText style={styles.dropdownButtonText}>
                      {compatibleBrands.find(b => b.value === vehicleBrandId)?.label ||
                        t('dealer.selectCompatibleBrand')}
                    </CustomText>
                    <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
                  </TouchableOpacity>
                  {compatibleBrands.length === 0 && (
                    <CustomText style={{marginTop: 6, fontSize: RFValue(10), opacity: 0.6}}>
                      {t('dealer.noBrandsConfigured')}
                    </CustomText>
                  )}
                </View>
                <View style={styles.section}>
                  <CustomText style={styles.label}>{t('dealer.compatibleModel')}</CustomText>
                  <TouchableOpacity
                    style={[styles.field, styles.dropdownField]}
                    onPress={() => openDropdown('compatibleModel')}
                    activeOpacity={0.75}
                    disabled={!vehicleBrandId}>
                    <CustomText style={styles.dropdownButtonText}>
                      {compatibleModels.find(m => m.value === vehicleModelId)?.label ||
                        t('dealer.selectCompatibleModel')}
                    </CustomText>
                    <Icon name="chevron-down" size={RFValue(18)} color={colors.secondary} />
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
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
                    <CustomText style={styles.submitButtonText}>{t('dealer.updateProduct')}</CustomText>
                  </LinearGradient>
                ) : (
                  <View style={[styles.primaryGradient, styles.submitButtonDisabled]}>
                    <Icon name="create-outline" size={RFValue(18)} color="rgba(255,255,255,0.85)" />
                    <CustomText style={styles.submitButtonText}>{t('dealer.updateProduct')}</CustomText>
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
              <CustomText style={styles.deleteButtonText}>{t('dealer.deleteProduct')}</CustomText>
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
                  <CustomText style={styles.submitButtonText}>{t('dealer.createProduct')}</CustomText>
                </LinearGradient>
              ) : (
                <View style={[styles.primaryGradient, styles.submitButtonDisabled]}>
                  <CustomText style={styles.submitButtonText}>{t('dealer.createProduct')}</CustomText>
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
        selectedValue={getSelectedValue()}
        onSelect={handleDropdownSelect}
        title={
          dropdownType === 'category'
            ? t('dealer.selectCategory')
            : dropdownType === 'batteryType'
            ? t('dealer.selectBatteryType')
            : dropdownType === 'compatibleBrand'
            ? t('dealer.selectCompatibleBrand')
            : dropdownType === 'compatibleModel'
            ? t('dealer.selectCompatibleModel')
            : t('dealer.selectVehicleType')
        }
        searchable={true}
      />
    </View>
  );
};

export default AddEditProductScreen;

