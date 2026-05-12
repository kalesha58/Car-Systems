import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import { screenHeight, screenWidth } from '@utils/Scaling';
import { Fonts, Colors } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { useTranslation } from 'react-i18next';
import { createUserVehicle } from '@service/vehicleService';
import { uploadImage, uploadImagesBatch } from '@service/postService';
import { resetAndNavigate } from '@utils/NavigationUtils';
import CustomDropdownModal, { IDropdownOption } from '@components/ui/CustomDropdownModal';
import { getDropdownOptions } from '@service/dropdownService';
import { storage } from '@state/storage';

const MAX_IMAGES = 2;
const MIN_IMAGES = 1;
const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface RouteParams {
  fromLogin?: boolean;
}

const AddUserVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const params = (route.params as RouteParams) || {};
  const fromLogin = params.fromLogin || false;

  const [vehicleType, setVehicleType] = useState<'Bike' | 'Car'>('Bike');
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState('');
  const [model, setModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [rcDocumentUri, setRcDocumentUri] = useState<string | null>(null);
  const [bikeLicenceUri, setBikeLicenceUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [brandOptions, setBrandOptions] = useState<IDropdownOption[]>([]);
  const [modelOptions, setModelOptions] = useState<IDropdownOption[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      try {
        const response = await getDropdownOptions(vehicleType);
        setBrandOptions(response.brands || []);
        setBrand('');
        setBrandId('');
        setModel('');
        setModelOptions([]);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, [vehicleType]);

  useEffect(() => {
    const fetchModels = async () => {
      if (!brandId) {
        setModelOptions([]);
        return;
      }

      setIsLoadingModels(true);
      try {
        const response = await getDropdownOptions(vehicleType, brandId);
        setModelOptions(response.models || []);
        setModel('');
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [brandId, vehicleType]);

  const getAssetsWithinSizeLimit = (
    assets: Asset[],
    fileLabel: string,
    allowMultiple: boolean = false,
  ): Asset[] => {
    const oversizedAssets = assets.filter(
      (asset) => typeof asset.fileSize === 'number' && asset.fileSize > MAX_UPLOAD_FILE_SIZE_BYTES,
    );

    if (oversizedAssets.length > 0) {
      const message = allowMultiple
        ? `Some selected ${fileLabel} are too large. Please keep each file under 5MB.`
        : `${fileLabel} is too large. Please select a file under 5MB.`;
      showError(message);
    }

    return assets.filter(
      (asset) => !asset.fileSize || asset.fileSize <= MAX_UPLOAD_FILE_SIZE_BYTES,
    );
  };

  const handleImagePicker = () => {
    if (imageUris.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 1280,
        includeBase64: false,
        selectionLimit: Math.min(5, MAX_IMAGES - imageUris.length),
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const selectedImages = response.assets || [];
        const validImages = getAssetsWithinSizeLimit(selectedImages, 'images', true);

        if (validImages.length > 0) {
          const newUris = validImages.map(asset => asset.uri || '').filter(Boolean);
          setImageUris(prev => [...prev, ...newUris]);
        }
      },
    );
  };

  const handleRcDocumentPicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 1280,
        includeBase64: false,
        selectionLimit: 1,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const selectedImages = response.assets || [];
        const validImages = getAssetsWithinSizeLimit(selectedImages, 'RC document');

        if (validImages.length > 0 && validImages[0].uri) {
          setRcDocumentUri(validImages[0].uri);
        }
      },
    );
  };

  const handleBikeLicencePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 1280,
        includeBase64: false,
        selectionLimit: 1,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const selectedImages = response.assets || [];
        const validImages = getAssetsWithinSizeLimit(selectedImages, 'licence document');

        if (validImages.length > 0 && validImages[0].uri) {
          setBikeLicenceUri(validImages[0].uri);
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to upload images. Please try again.');
      throw err;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const uploadDocument = async (uri: string | null): Promise<string | undefined> => {
    if (!uri) {
      return undefined;
    }

    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    try {
      const url = await uploadImage(uri);
      return url;
    } catch (uploadError: any) {
      console.error('Failed to upload document:', uploadError);
      const message =
        uploadError instanceof Error && uploadError.message
          ? uploadError.message
          : 'Failed to upload document';
      throw new Error(message);
    }
  };

  const handleSkip = () => {
    storage.set('hasSkippedVehicle', 'true');
    resetAndNavigate('MainTabs');
  };

  const handleSubmit = async () => {
    if (!brand.trim()) {
      showError('Brand is required');
      return;
    }
    if (!model.trim()) {
      showError('Model is required');
      return;
    }
    if (!numberPlate.trim()) {
      showError('Number plate is required');
      return;
    }

    const plateRegex = /^[A-Z0-9]{6,15}$/i;
    if (!plateRegex.test(numberPlate.trim())) {
      showError('Number plate must be 6-15 alphanumeric characters');
      return;
    }

    if (year && (parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1)) {
      showError('Please enter a valid year');
      return;
    }

    if (imageUris.length < MIN_IMAGES || imageUris.length > MAX_IMAGES) {
      showError(`Vehicle must have between ${MIN_IMAGES} and ${MAX_IMAGES} images`);
      return;
    }

    setIsLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();

      if (uploadedImageUrls.length < MIN_IMAGES) {
        showError(`At least ${MIN_IMAGES} image is required`);
        setIsLoading(false);
        return;
      }

      const rcDocumentUrl = await uploadDocument(rcDocumentUri);
      const bikeLicenceUrl = await uploadDocument(bikeLicenceUri);

      const createData: any = {
        brand: brand.trim(),
        model: model.trim(),
        numberPlate: numberPlate.trim().toUpperCase(),
        images: uploadedImageUrls,
        year: year ? parseInt(year) : undefined,
        color: color.trim() || undefined,
        documents: {
          rc: rcDocumentUrl || undefined,
          dl: bikeLicenceUrl || undefined,
        },
      };

      await createUserVehicle(createData);
      showSuccess('Vehicle added successfully');

      storage.delete('hasSkippedVehicle');

      setTimeout(() => {
        resetAndNavigate('MainTabs');
      }, 1500);
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add vehicle. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || isUploadingImages;
  const isFormValid =
    brand.trim().length > 0 &&
    model.trim().length > 0 &&
    numberPlate.trim().length > 0 &&
    imageUris.length >= MIN_IMAGES &&
    imageUris.length <= MAX_IMAGES &&
    !isSubmitting;

  const cardShadow = {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.35 : 0.08,
    shadowRadius: 10,
    elevation: 4,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      overflow: 'hidden',
    },
    scrollContent: {
      paddingHorizontal: screenWidth * 0.04,
      paddingTop: screenHeight * 0.02,
      paddingBottom: screenHeight * 0.15,
    },
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: RFValue(16),
      padding: screenWidth * 0.045,
      ...cardShadow,
    },
    section: {
      marginBottom: screenHeight * 0.02,
    },
    label: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
      marginBottom: screenHeight * 0.008,
      letterSpacing: 0.3,
    },
    required: {
      color: colors.error,
    },
    textInputContainer: {
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.012,
      minHeight: screenHeight * 0.055,
      ...cardShadow,
    },
    textInput: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: colors.text,
      padding: 0,
    },
    dropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.014,
      minHeight: screenHeight * 0.055,
      ...cardShadow,
    },
    typeContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(12),
      padding: 4,
      marginBottom: screenHeight * 0.02,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RFValue(8),
    },
    typeButtonActive: {
      backgroundColor: colors.secondary,
    },
    typeText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Medium,
      color: colors.text,
    },
    typeTextActive: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.035,
      paddingVertical: screenHeight * 0.016,
      ...cardShadow,
    },
    buttonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
      color: colors.secondary,
      marginLeft: screenWidth * 0.025,
    },
    imagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: screenWidth * 0.03,
      marginTop: screenHeight * 0.012,
    },
    imageWrapper: {
      position: 'relative',
      width: screenWidth * 0.26,
      height: screenWidth * 0.26,
      borderRadius: RFValue(12),
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
      paddingVertical: screenHeight * 0.015,
      paddingBottom: Math.max(insets.bottom, 20),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: screenWidth * 0.03,
    },
    skipButton: {
      flex: 0.8,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(14),
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    skipButtonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
    },
    submitButton: {
      flex: 1.2,
      borderRadius: RFValue(14),
      overflow: 'hidden',
    },
    submitButtonGradient: {
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: colors.white,
    },
    descriptionText: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Regular,
      color: colors.disabled,
      marginTop: screenHeight * 0.005,
      fontStyle: 'italic',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: screenHeight * 0.008,
    },
    sectionHint: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
      marginTop: screenHeight * 0.006,
    },
    statusChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: RFValue(16),
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusChipText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.SemiBold,
      color: colors.textSecondary,
    },
    docPlaceholderButton: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RFValue(12),
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      height: screenWidth * 0.26,
      gap: 4,
    },
    docPlaceholderText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
    },
  });

  const gradientColors: [string, string] = [
    colors.secondary,
    isDark ? '#0b5c16' : '#095a14',
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      <CustomHeader
        title="Add Your Vehicle"
        showBackButton={!fromLogin}
        showNotificationIcon={false}
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
      />
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          <View style={styles.formCard}>
            {/* Vehicle Type Selection */}
            <View style={styles.section}>
              <CustomText style={styles.label}>
                VEHICLE TYPE <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, vehicleType === 'Bike' && styles.typeButtonActive]}
                  onPress={() => setVehicleType('Bike')}
                  activeOpacity={0.75}
                >
                  <CustomText style={[styles.typeText, vehicleType === 'Bike' ? styles.typeTextActive : {}]}>
                    Bike
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, vehicleType === 'Car' && styles.typeButtonActive]}
                  onPress={() => setVehicleType('Car')}
                  activeOpacity={0.75}
                >
                  <CustomText style={[styles.typeText, vehicleType === 'Car' ? styles.typeTextActive : {}]}>
                    Car
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Brand Dropdown */}
            <View style={styles.section}>
              <CustomText style={styles.label}>
                BRAND <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  (isLoadingBrands || brandOptions.length === 0) && { opacity: 0.6 }
                ]}
                onPress={() => {
                  if (isLoadingBrands) {
                    showError('Loading brands, please wait...');
                    return;
                  }
                  if (brandOptions.length === 0) {
                    showError('No brands available. Please try again.');
                    return;
                  }
                  setShowBrandDropdown(true);
                }}
                disabled={isLoadingBrands || brandOptions.length === 0}
                activeOpacity={0.75}
              >
                <CustomText style={{
                  ...styles.textInput,
                  color: brand ? colors.text : colors.disabled
                }}>
                  {isLoadingBrands ? 'Loading brands...' : (brand || 'Select Brand')}
                </CustomText>
                <Icon name="chevron-down" size={RFValue(16)} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* Model Dropdown */}
            <View style={styles.section}>
              <CustomText style={styles.label}>
                MODEL <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  (!brand || modelOptions.length === 0) && { opacity: 0.6 }
                ]}
                onPress={() => {
                  if (isLoadingModels) {
                    showError('Loading models, please wait...');
                    return;
                  }
                  if (!brand) {
                    showError('Please select a brand first');
                    return;
                  }
                  if (modelOptions.length === 0) {
                    showError('No models available for this brand');
                    return;
                  }
                  setShowModelDropdown(true);
                }}
                disabled={!brand || isLoadingModels || modelOptions.length === 0}
                activeOpacity={0.75}
              >
                <CustomText style={{
                  ...styles.textInput,
                  color: model ? colors.text : colors.disabled
                }}>
                  {model || 'Select Model'}
                </CustomText>
                <Icon name="chevron-down" size={RFValue(16)} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* Number Plate */}
            <View style={styles.section}>
              <CustomText style={styles.label}>
                NUMBER PLATE <CustomText style={styles.required}>*</CustomText>
              </CustomText>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter number plate"
                  placeholderTextColor={colors.disabled}
                  value={numberPlate}
                  onChangeText={(text) => setNumberPlate(text.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
              <CustomText style={styles.descriptionText}>
                6-15 alphanumeric characters (e.g., AB12CD3456)
              </CustomText>
            </View>

            {/* Year & Color Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.section, { flex: 1 }]}>
                <CustomText style={styles.label}>YEAR</CustomText>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2023"
                    placeholderTextColor={colors.disabled}
                    value={year}
                    onChangeText={setYear}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
              <View style={[styles.section, { flex: 1 }]}>
                <CustomText style={styles.label}>COLOR</CustomText>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="White"
                    placeholderTextColor={colors.disabled}
                    value={color}
                    onChangeText={setColor}
                  />
                </View>
              </View>
            </View>

            {/* Images */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <CustomText style={styles.label}>
                  IMAGES <CustomText style={styles.required}>*</CustomText>
                </CustomText>
                <View style={styles.statusChip}>
                  <CustomText style={styles.statusChipText}>
                    {imageUris.length}/{MAX_IMAGES} selected
                  </CustomText>
                </View>
              </View>
              <TouchableOpacity style={styles.button} onPress={handleImagePicker} activeOpacity={0.75}>
                <Icon name="image-outline" size={RFValue(18)} color={colors.secondary} />
                <CustomText style={styles.buttonText}>
                  Add Images ({imageUris.length}/{MAX_IMAGES})
                </CustomText>
              </TouchableOpacity>
              <CustomText style={styles.sectionHint}>
                Upload clear vehicle photos. Max file size: 5MB each.
              </CustomText>
              {imageUris.length > 0 && (
                <View style={styles.imagesContainer}>
                  {imageUris.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}>
                        <Icon name="close" size={RFValue(14)} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Documents */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.section, { flex: 1 }]}>
                <CustomText style={styles.label}>RC DOCUMENT</CustomText>
                {rcDocumentUri ? (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: rcDocumentUri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setRcDocumentUri(null)}>
                      <Icon name="close" size={RFValue(14)} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.docPlaceholderButton} onPress={handleRcDocumentPicker} activeOpacity={0.75}>
                    <Icon name="document-text-outline" size={RFValue(18)} color={colors.secondary} />
                    <CustomText style={styles.docPlaceholderText}>Tap to upload</CustomText>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.section, { flex: 1 }]}>
                <CustomText style={styles.label}>LICENCE</CustomText>
                {bikeLicenceUri ? (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: bikeLicenceUri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setBikeLicenceUri(null)}>
                      <Icon name="close" size={RFValue(14)} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.docPlaceholderButton} onPress={handleBikeLicencePicker} activeOpacity={0.75}>
                    <Icon name="card-outline" size={RFValue(18)} color={colors.secondary} />
                    <CustomText style={styles.docPlaceholderText}>Tap to upload</CustomText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <CustomText style={styles.sectionHint}>
              Optional documents help speed up verification.
            </CustomText>
          </View>
        </ScrollView>

        {/* Sticky Button Container */}
        <View style={styles.stickyButtonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isSubmitting}
              activeOpacity={0.75}>
              <CustomText style={styles.skipButtonText}>Skip</CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid}
              activeOpacity={0.85}>
              <LinearGradient
                colors={gradientColors}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Icon name="checkmark-circle-outline" size={RFValue(16)} color={colors.white} />
                    <CustomText style={styles.submitButtonText}>Submit Vehicle</CustomText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CustomDropdownModal
        visible={showBrandDropdown}
        onClose={() => setShowBrandDropdown(false)}
        title="Select Brand"
        options={brandOptions}
        selectedValue={brandId}
        onSelect={(value) => {
          const selectedOption = brandOptions.find(opt => opt.value === value);
          if (selectedOption) {
            setBrand(selectedOption.label);
            setBrandId(selectedOption.value);
          }
        }}
        searchable
        placeholder="Search brand..."
      />

      <CustomDropdownModal
        visible={showModelDropdown}
        onClose={() => setShowModelDropdown(false)}
        title="Select Model"
        options={modelOptions}
        selectedValue={model}
        onSelect={(value) => {
          const selectedOption = modelOptions.find(opt => opt.value === value);
          if (selectedOption) {
            setModel(selectedOption.label);
          }
        }}
        searchable
        placeholder="Search model..."
      />
    </View>
  );
};

export default AddUserVehicleScreen;
