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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { screenHeight, screenWidth } from '@utils/Scaling';
import { Fonts, Colors } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { useTranslation } from 'react-i18next';
// Removed ICreateVehicleRequest import as it might not be exported
import { createUserVehicle } from '@service/vehicleService';
import { uploadImage } from '@service/postService';
import { resetAndNavigate } from '@utils/NavigationUtils';
import CustomDropdownModal, { IDropdownOption } from '@components/ui/CustomDropdownModal';
import { getDropdownOptions } from '@service/dropdownService';

const MAX_IMAGES = 3;
const MIN_IMAGES = 1;

interface RouteParams {
  fromLogin?: boolean;
}

const AddUserVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const params = (route.params as RouteParams) || {};
  const fromLogin = params.fromLogin || false;

  const [vehicleType, setVehicleType] = useState<'Bike' | 'Car'>('Bike');
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState(''); // Store ID for fetching models
  const [model, setModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Dropdown states
  const [brandOptions, setBrandOptions] = useState<IDropdownOption[]>([]);
  const [modelOptions, setModelOptions] = useState<IDropdownOption[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Fetch Brands when vehicle type changes
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      try {
        const response = await getDropdownOptions(vehicleType);
        setBrandOptions(response.brands || []);
        // Reset selections
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

  // Fetch Models when brand changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!brandId) {
        setModelOptions([]);
        return;
      }

      setIsLoadingModels(true);
      try {
        // Find the brand object to get its ID if we only have name, 
        // but here we are storing brandId directly from selection
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

  const handleImagePicker = () => {
    if (imageUris.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
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
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          uploadedUrls.push(uri);
        } else {
          try {
            const url = await uploadImage(uri);
            uploadedUrls.push(url);
          } catch (uploadError: any) {
            console.error(`Failed to upload image ${i + 1}:`, uploadError);
            const errorMessage = uploadError?.message || 'Failed to upload image';
            throw new Error(`${errorMessage}. Please check the image and try again.`);
          }
        }
      }
      return uploadedUrls;
    } catch (error: any) {
      console.error('Error in uploadImages:', error);
      throw error instanceof Error ? error : new Error(error?.message || 'Failed to upload images. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSkip = () => {
    resetAndNavigate('MainTabs');
  };

  const handleSubmit = async () => {
    // Validation
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

      const createData: any = { // Changed to any to avoid type import issues
        brand: brand.trim(),
        model: model.trim(),
        numberPlate: numberPlate.trim().toUpperCase(),
        images: uploadedImageUrls,
        year: year ? parseInt(year) : undefined,
        color: color.trim() || undefined,
      };

      await createUserVehicle(createData);
      showSuccess('Vehicle added successfully');

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: screenWidth * 0.04,
      paddingBottom: screenHeight * 0.2,
    },
    section: {
      marginBottom: screenHeight * 0.02,
    },
    label: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
      color: colors.text,
      marginBottom: screenHeight * 0.008,
      opacity: 0.8,
    },
    labelRequired: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
      color: colors.text,
      marginBottom: screenHeight * 0.008,
    },
    required: {
      color: colors.error,
    },
    textInputContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.01,
      minHeight: screenHeight * 0.05,
      justifyContent: 'center',
    },
    textInput: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: colors.text,
      padding: 0,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.012,
    },
    buttonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
      color: colors.text,
      marginLeft: screenWidth * 0.02,
    },
    imagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: screenWidth * 0.02,
      marginTop: screenHeight * 0.01,
    },
    imageWrapper: {
      position: 'relative',
      width: screenWidth * 0.25,
      height: screenWidth * 0.25,
      borderRadius: 8,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    removeImageButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stickyButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      paddingHorizontal: screenWidth * 0.04,
      paddingVertical: screenHeight * 0.015,
      paddingBottom: screenHeight * 0.03,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    skipButton: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      paddingVertical: screenHeight * 0.015,
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
      flex: 1,
      backgroundColor: Colors.secondary,
      borderRadius: 8,
      paddingVertical: screenHeight * 0.015,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    submitButtonDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: '#fff',
    },
    descriptionText: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Regular,
      color: colors.disabled,
      marginTop: screenHeight * 0.005,
      fontStyle: 'italic',
    },
    dropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    typeContainer: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 4,
      marginBottom: screenHeight * 0.02,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
    },
    typeButtonActive: {
      backgroundColor: Colors.secondary,
    },
    typeText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Medium,
      color: colors.text,
    },
    typeTextActive: {
      color: '#fff',
      fontFamily: Fonts.SemiBold,
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader title="Add Your Vehicle" showBackButton={!fromLogin} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Vehicle Type Selection */}
        <View style={styles.section}>
          <CustomText style={styles.labelRequired}>
            Vehicle Type <CustomText style={styles.required}>*</CustomText>
          </CustomText>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, vehicleType === 'Bike' && styles.typeButtonActive]}
              onPress={() => setVehicleType('Bike')}
              activeOpacity={0.7}
            >
              <CustomText style={[styles.typeText, vehicleType === 'Bike' ? styles.typeTextActive : {}]}>
                Bike
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, vehicleType === 'Car' && styles.typeButtonActive]}
              onPress={() => setVehicleType('Car')}
              activeOpacity={0.7}
            >
              <CustomText style={[styles.typeText, vehicleType === 'Car' ? styles.typeTextActive : {}]}>
                Car
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brand Dropdown */}
        <View style={styles.section}>
          <CustomText style={styles.labelRequired}>
            Brand <CustomText style={styles.required}>*</CustomText>
          </CustomText>
          <TouchableOpacity
            style={styles.textInputContainer}
            onPress={() => setShowBrandDropdown(true)}
          >
            <View style={styles.dropdownButton}>
              <CustomText style={{
                ...styles.textInput,
                color: brand ? colors.text : colors.disabled
              }}>
                {brand || 'Select Brand'}
              </CustomText>
              <Icon name="chevron-down" size={RFValue(14)} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Model Dropdown */}
        <View style={styles.section}>
          <CustomText style={styles.labelRequired}>
            Model <CustomText style={styles.required}>*</CustomText>
          </CustomText>
          <TouchableOpacity
            style={[
              styles.textInputContainer,
              (!brand || modelOptions.length === 0) && { opacity: 0.6 }
            ]}
            onPress={() => {
              if (brand && modelOptions.length > 0) {
                setShowModelDropdown(true);
              } else if (!brand) {
                showError('Please select a brand first');
              } else {
                showError('No models available for this brand');
              }
            }}
            disabled={!brand}
          >
            <View style={styles.dropdownButton}>
              <CustomText style={{
                ...styles.textInput,
                color: model ? colors.text : colors.disabled
              }}>
                {model || 'Select Model'}
              </CustomText>
              <Icon name="chevron-down" size={RFValue(14)} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.labelRequired}>
            Number Plate <CustomText style={styles.required}>*</CustomText>
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

        <View style={styles.section}>
          <CustomText style={styles.label}>Year</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter manufacturing year (optional)"
              placeholderTextColor={colors.disabled}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>Color</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter vehicle color (optional)"
              placeholderTextColor={colors.disabled}
              value={color}
              onChangeText={setColor}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.labelRequired}>
            Images <CustomText style={styles.required}>*</CustomText>
          </CustomText>
          <CustomText style={styles.descriptionText}>
            Add {MIN_IMAGES}-{MAX_IMAGES} images of your vehicle
          </CustomText>
          <TouchableOpacity style={styles.button} onPress={handleImagePicker}>
            <Icon name="image-outline" size={RFValue(16)} color={colors.text} />
            <CustomText style={styles.buttonText}>
              Add Images ({imageUris.length}/{MAX_IMAGES})
            </CustomText>
          </TouchableOpacity>
          {imageUris.length > 0 && (
            <View style={styles.imagesContainer}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}>
                    <Icon name="close" size={RFValue(12)} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Button Container */}
      <View style={styles.stickyButtonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isSubmitting}>
            <CustomText style={styles.skipButtonText}>Skip</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="add-circle-outline" size={RFValue(16)} color="#fff" />
                <CustomText style={styles.submitButtonText}>Add Vehicle</CustomText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Modals */}
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
          // Model value is the name itself in the dropdown options usually, or check API response.
          // Assuming model dropdown returns value as name or ID. 
          // If the backend returns model name as value, we are good.
          // In dropdownRoutes, it usually maps _id to value and name to label.
          // Let's assume value is not the name but the ID.
          // But for vehicle creation we pass the name string (model: string).
          // So we should find label.
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
