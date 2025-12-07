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
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenHeight, screenWidth} from '@utils/Scaling';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import CustomDropdownModal, {IDropdownOption} from '@components/ui/CustomDropdownModal';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';
import {useTranslation} from 'react-i18next';
import {
  createDealerVehicle,
  updateDealerVehicle,
  deleteDealerVehicle,
  ICreateDealerVehicleRequest,
  IUpdateDealerVehicleRequest,
} from '@service/dealerService';
import {uploadImage} from '@service/postService';
import {getDropdownOptions} from '@service/dropdownService';
import {IDealerVehicle} from '../../types/vehicle/IVehicle';

const MAX_IMAGES = 10;

interface RouteParams {
  vehicle?: IDealerVehicle;
}

const AddEditVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors} = useTheme();
  const {showSuccess, showError} = useToast();
  const {t} = useTranslation();
  const params = (route.params as RouteParams) || {};

  const isEditMode = !!params.vehicle;
  const vehicle = params.vehicle;

  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike'>(vehicle?.vehicleType || 'Car');
  const [brand, setBrand] = useState(vehicle?.brand || '');
  const [vehicleModel, setVehicleModel] = useState(vehicle?.vehicleModel || '');
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
  const [imageUris, setImageUris] = useState<string[]>(vehicle?.images || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState<
    'vehicleType' | 'availability' | 'fuelType' | 'transmission' | 'condition'
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
      for (const uri of imageUris) {
        if (uri.startsWith('http')) {
          uploadedUrls.push(uri);
        } else {
          const url = await uploadImage(uri);
          uploadedUrls.push(url);
        }
      }
      return uploadedUrls;
    } catch (error) {
      throw new Error('Failed to upload images. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!brand.trim()) {
      showError(t('dealer.brandRequired'));
      return;
    }
    if (!vehicleModel.trim()) {
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
          brand: brand.trim(),
          vehicleModel: vehicleModel.trim(),
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
        };

        await updateDealerVehicle(vehicle.id, updateData);
        showSuccess(t('dealer.vehicleUpdated'));
      } else {
        const createData: ICreateDealerVehicleRequest = {
          vehicleType,
          brand: brand.trim(),
          vehicleModel: vehicleModel.trim(),
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
    type: 'vehicleType' | 'availability' | 'fuelType' | 'transmission' | 'condition',
  ) => {
    setDropdownType(type);
    setDropdownModalVisible(true);
  };

  const handleDropdownSelect = (value: string) => {
    switch (dropdownType) {
      case 'vehicleType':
        setVehicleType(value as 'Car' | 'Bike');
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

  const getSelectedLabel = () => {
    switch (dropdownType) {
      case 'vehicleType':
        return vehicleTypes.find(v => v.value === vehicleType)?.label || vehicleType || t('dealer.selectVehicleType');
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
          transmissionOptions.find(t => t.value === transmission)?.label ||
          transmission ||
          t('dealer.selectTransmission')
        );
      case 'condition':
        return conditionOptions.find(c => c.value === condition)?.label || condition || t('dealer.selectCondition');
      default:
        return '';
    }
  };

  const getCurrentDropdownOptions = () => {
    switch (dropdownType) {
      case 'vehicleType':
        return vehicleTypes;
      case 'availability':
        return availabilityOptions;
      case 'fuelType':
        return fuelTypes;
      case 'transmission':
        return transmissionOptions;
      case 'condition':
        return conditionOptions;
      default:
        return [];
    }
  };

  const getSelectedValue = () => {
    switch (dropdownType) {
      case 'vehicleType':
        return vehicleType;
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
      case 'availability':
        return t('dealer.selectAvailability');
      case 'fuelType':
        return t('dealer.selectFuelType');
      case 'transmission':
        return t('dealer.selectTransmission');
      case 'condition':
        return t('dealer.selectCondition');
      default:
        return t('dealer.selectOption');
    }
  };

  const isSubmitting = isLoading || isUploadingImages;
  const isFormValid =
    brand.trim().length > 0 &&
    vehicleModel.trim().length > 0 &&
    year &&
    parseInt(year) >= 1900 &&
    price &&
    parseFloat(price) > 0 &&
    imageUris.length > 0 &&
    !isSubmitting;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: screenWidth * 0.04,
      paddingBottom: screenHeight * 0.05,
    },
    section: {
      marginBottom: screenHeight * 0.02,
    },
    label: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Medium,
      color: colors.text,
      marginBottom: screenHeight * 0.008,
      opacity: 0.8,
    },
    textInputContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.01,
      minHeight: screenHeight * 0.05,
    },
    textInput: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.text,
    },
    textInputMultiline: {
      minHeight: screenHeight * 0.12,
      textAlignVertical: 'top',
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.012,
    },
    dropdownButtonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.text,
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
      fontSize: RFValue(9),
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
      paddingBottom: screenHeight * 0.02,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    editDeleteRow: {
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    submitButton: {
      backgroundColor: Colors.secondary,
      borderRadius: 8,
      paddingVertical: screenHeight * 0.015,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    editButton: {
      flex: 1,
    },
    submitButtonDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.SemiBold,
      color: '#fff',
    },
    deleteButton: {
      backgroundColor: colors.error,
      borderRadius: 8,
      paddingVertical: screenHeight * 0.015,
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
      fontFamily: Fonts.SemiBold,
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader title={isEditMode ? t('dealer.editVehicle') : t('dealer.addVehicle')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: screenHeight * 0.12}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.vehicleType')} *</CustomText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => openDropdown('vehicleType')}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.brand')} *</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterBrand')}
              placeholderTextColor={colors.disabled}
              value={brand}
              onChangeText={setBrand}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.model')} *</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterModel')}
              placeholderTextColor={colors.disabled}
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.year')} *</CustomText>
          <View style={styles.textInputContainer}>
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

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.price')} *</CustomText>
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

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.availability')} *</CustomText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => openDropdown('availability')}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.numberPlate')}</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterNumberPlate')}
              placeholderTextColor={colors.disabled}
              value={numberPlate}
              onChangeText={setNumberPlate}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.mileage')}</CustomText>
          <View style={styles.textInputContainer}>
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

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.color')}</CustomText>
          <View style={styles.textInputContainer}>
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
          <TouchableOpacity style={styles.dropdownButton} onPress={() => openDropdown('fuelType')}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.transmission')}</CustomText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => openDropdown('transmission')}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.condition')}</CustomText>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => openDropdown('condition')}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
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
          <CustomText style={styles.label}>{t('dealer.images')} *</CustomText>
          <TouchableOpacity style={styles.button} onPress={handleImagePicker}>
            <Icon name="image-outline" size={RFValue(16)} color={colors.text} />
            <CustomText style={styles.buttonText}>
              {t('dealer.addImages')} ({imageUris.length}/{MAX_IMAGES})
            </CustomText>
          </TouchableOpacity>
          {imageUris.length > 0 && (
            <View style={styles.imagesContainer}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{uri}} style={styles.image} />
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
        {isEditMode ? (
          <View style={styles.editDeleteRow}>
            <TouchableOpacity
              style={[styles.submitButton, styles.editButton, !isFormValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="create-outline" size={RFValue(16)} color="#fff" />
                  <CustomText style={styles.submitButtonText}>
                    {t('dealer.updateVehicle')}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonHalf]}
              onPress={handleDelete}
              disabled={isSubmitting}>
              <Icon name="trash-outline" size={RFValue(16)} color="#fff" />
              <CustomText style={styles.deleteButtonText}>{t('dealer.deleteVehicle')}</CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CustomText style={styles.submitButtonText}>
                {t('dealer.createVehicle')}
              </CustomText>
            )}
          </TouchableOpacity>
        )}
      </View>

      <CustomDropdownModal
        visible={dropdownModalVisible}
        onClose={() => setDropdownModalVisible(false)}
        options={getCurrentDropdownOptions()}
        selectedValue={getSelectedValue()}
        onSelect={handleDropdownSelect}
        title={getDropdownTitle()}
        searchable={true}
      />
    </View>
  );
};

export default AddEditVehicleScreen;

