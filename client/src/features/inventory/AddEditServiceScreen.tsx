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
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
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

const MAX_IMAGES = 2;

type ServiceType = 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'general';

interface RouteParams {
  service?: IService;
}

const getAllowedServiceTypes = (businessType: string | undefined): ServiceType[] => {
  if (!businessType) {
    return ['car_wash', 'car_detailing', 'car_automobile', 'bike_automobile', 'general'];
  }

  switch (businessType) {
    case 'Vehicle Wash Station':
      return ['car_wash'];
    case 'Detailing Center':
      return ['car_detailing'];
    case 'Bike Dealer':
      return ['bike_automobile'];
    case 'Automobile Showroom':
      return ['car_automobile'];
    case 'Mechanic Workshop':
    case 'Riding Gear Store':
      return ['car_wash', 'car_detailing', 'car_automobile', 'bike_automobile', 'general'];
    default:
      return ['car_wash', 'car_detailing', 'car_automobile', 'bike_automobile', 'general'];
  }
};

const AddEditServiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors} = useTheme();
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
  const [serviceType, setServiceType] = useState<'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'general' | undefined>(service?.serviceType);
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | undefined>(service?.vehicleType);
  const [vehicleModel, setVehicleModel] = useState(service?.vehicleModel || '');
  const [vehicleBrand, setVehicleBrand] = useState(service?.vehicleBrand || '');
  const [serviceSubCategory, setServiceSubCategory] = useState(service?.serviceSubCategory || '');
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
        quality: 0.65,
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
    switchContainer: {
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
    switchLabel: {
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
    locationContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.012,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.01,
    },
    locationText: {
      flex: 1,
      fontSize: RFValue(9),
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
      backgroundColor: colors.secondary,
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
      <CustomHeader title={isEditMode ? t('dealer.editService') : t('dealer.addService')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: screenHeight * 0.12}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.serviceName')} <CustomText style={styles.required}>*</CustomText></CustomText>
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

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.price')} <CustomText style={styles.required}>*</CustomText></CustomText>
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
          <CustomText style={styles.label}>{t('dealer.durationMinutes')} <CustomText style={styles.required}>*</CustomText></CustomText>
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

        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <CustomText style={styles.switchLabel}>{t('dealer.homeService')} <CustomText style={styles.required}>*</CustomText></CustomText>
            <Switch
              value={homeService}
              onValueChange={setHomeService}
              trackColor={{false: colors.disabled, true: colors.secondary + '80'}}
              thumbColor={homeService ? colors.secondary : colors.disabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.serviceType')}</CustomText>
          <View style={[styles.button, !isExistingServiceTypeAllowed && {opacity: 0.6}]}>
            <Icon name="construct-outline" size={RFValue(16)} color={colors.text} />
            <CustomText style={styles.buttonText}>
              {serviceType || t('dealer.selectServiceType')}
            </CustomText>
          </View>
          {!isExistingServiceTypeAllowed && (
            <CustomText style={[styles.label, {color: colors.error, fontSize: RFValue(7), marginTop: screenHeight * 0.005}]}>
              {t('dealer.serviceTypeNotAllowed') || 'This service type is not allowed for your business type. You can edit other fields but cannot change the service type.'}
            </CustomText>
          )}
          <View style={styles.imagesContainer}>
            {allowedServiceTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.button,
                  serviceType === type && {backgroundColor: colors.secondary + '20', borderColor: colors.secondary},
                  !isExistingServiceTypeAllowed && isEditMode && {opacity: 0.5},
                ]}
                onPress={() => {
                  if (!isExistingServiceTypeAllowed && isEditMode) {
                    return; // Disable changing service type if existing type is not allowed
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
                disabled={!isExistingServiceTypeAllowed && isEditMode}>
                <CustomText style={[styles.buttonText, serviceType === type && {color: colors.secondary}]}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {(serviceType === 'car_automobile' || serviceType === 'bike_automobile') && (
          <View style={styles.section}>
            <CustomText style={styles.label}>{t('dealer.vehicleType')}</CustomText>
            <View style={styles.button}>
              <Icon name="car-outline" size={RFValue(16)} color={colors.text} />
              <CustomText style={styles.buttonText}>
                {vehicleType || t('dealer.selectVehicleType')}
              </CustomText>
            </View>
            <View style={styles.imagesContainer}>
              {(['Car', 'Bike'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.button,
                    vehicleType === type && {backgroundColor: colors.secondary + '20', borderColor: colors.secondary},
                  ]}
                  onPress={() => {
                    setVehicleType(type);
                    if (serviceType === 'car_automobile' && type !== 'Car') {
                      setServiceType('bike_automobile');
                    } else if (serviceType === 'bike_automobile' && type !== 'Bike') {
                      setServiceType('car_automobile');
                    }
                  }}>
                  <CustomText style={[styles.buttonText, vehicleType === type && {color: colors.secondary}]}>
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

        {(serviceType === 'car_wash' || serviceType === 'car_detailing') && (
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

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.location')}</CustomText>
          {!location ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleLocationPicker}
              disabled={isGettingLocation}>
              {isGettingLocation ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Icon name="location-outline" size={RFValue(16)} color={colors.text} />
              )}
              <CustomText style={styles.buttonText}>
                {isGettingLocation ? t('dealer.gettingLocation') : t('dealer.addLocation')}
              </CustomText>
            </TouchableOpacity>
          ) : (
            <View style={styles.locationContainer}>
              <Icon name="location" size={RFValue(16)} color={colors.secondary} />
              <CustomText style={styles.locationText} numberOfLines={2}>
                {location.address || location.formattedAddress}
              </CustomText>
              <TouchableOpacity style={styles.removeLocationButton} onPress={removeLocation}>
                <Icon name="close-circle" size={RFValue(18)} color={colors.error} />
              </TouchableOpacity>
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
                    {t('dealer.updateService')}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonHalf]}
              onPress={handleDelete}
              disabled={isSubmitting}>
              <Icon name="trash-outline" size={RFValue(16)} color="#fff" />
              <CustomText style={styles.deleteButtonText}>{t('dealer.deleteService')}</CustomText>
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
                {t('dealer.createService')}
              </CustomText>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AddEditServiceScreen;

