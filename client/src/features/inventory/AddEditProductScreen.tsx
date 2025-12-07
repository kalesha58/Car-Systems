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
  createDealerProduct,
  updateDealerProduct,
  deleteDealerProduct,
  ICreateDealerProductRequest,
  IUpdateDealerProductRequest,
} from '@service/dealerService';
import {uploadImage} from '@service/postService';
import {getDropdownOptions} from '@service/dropdownService';
import {IProduct} from '../../types/product/IProduct';

const MAX_IMAGES = 10;

interface RouteParams {
  product?: IProduct;
}

const AddEditProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors} = useTheme();
  const {showSuccess, showError} = useToast();
  const {t} = useTranslation();
  const params = (route.params as RouteParams) || {};

  const isEditMode = !!params.product;
  const product = params.product;

  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | ''>(product?.vehicleType || '');
  const [description, setDescription] = useState(product?.description || '');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [imageUris, setImageUris] = useState<string[]>(product?.images || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState<'category' | 'vehicleType'>('category');
  const [categories, setCategories] = useState<IDropdownOption[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<IDropdownOption[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      setDropdownsLoading(true);
      const options = await getDropdownOptions();
      
      setCategories(options.categories || []);
      setVehicleTypes(options.vehicleTypes || []);
      
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

    setIsLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();

      if (isEditMode && product) {
        const updateData: IUpdateDealerProductRequest = {
          name: name.trim(),
          brand: brand.trim(),
          price: parseFloat(price),
          stock: parseInt(stock),
          images: uploadedImageUrls,
          category,
          vehicleType: vehicleType || undefined,
          description: description.trim() || undefined,
          returnPolicy: returnPolicy.trim() || undefined,
        };

        await updateDealerProduct(product.id, updateData);
        showSuccess(t('dealer.productUpdated'));
      } else {
        const createData: ICreateDealerProductRequest = {
          name: name.trim(),
          brand: brand.trim(),
          price: parseFloat(price),
          stock: parseInt(stock),
          images: uploadedImageUrls,
          category,
          vehicleType: vehicleType || undefined,
          description: description.trim() || undefined,
          returnPolicy: returnPolicy.trim() || undefined,
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

  const openDropdown = (type: 'category' | 'vehicleType') => {
    setDropdownType(type);
    setDropdownModalVisible(true);
  };

  const handleDropdownSelect = (value: string) => {
    if (dropdownType === 'category') {
      setCategory(value);
    } else if (dropdownType === 'vehicleType') {
      setVehicleType(value as 'Car' | 'Bike');
    }
  };

  const getSelectedLabel = () => {
    if (dropdownType === 'category') {
      return categories.find(c => c.value === category)?.label || category || t('dealer.selectCategory');
    } else {
      return vehicleTypes.find(v => v.value === vehicleType)?.label || vehicleType || t('dealer.selectVehicleType');
    }
  };

  const getCurrentDropdownOptions = () => {
    if (dropdownType === 'category') {
      return categories;
    } else {
      return vehicleTypes;
    }
  };

  const getSelectedValue = () => {
    if (dropdownType === 'category') {
      return category;
    } else {
      return vehicleType;
    }
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
      <CustomHeader title={isEditMode ? t('dealer.editProduct') : t('dealer.addProduct')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: screenHeight * 0.12}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.productName')} *</CustomText>
          <View style={styles.textInputContainer}>
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
          <CustomText style={styles.label}>{t('dealer.stock')} *</CustomText>
          <View style={styles.textInputContainer}>
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

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.category')} *</CustomText>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => openDropdown('category')}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.vehicleType')}</CustomText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => openDropdown('vehicleType')}>
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
                    {t('dealer.updateProduct')}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonHalf]}
              onPress={handleDelete}
              disabled={isSubmitting}>
              <Icon name="trash-outline" size={RFValue(16)} color="#fff" />
              <CustomText style={styles.deleteButtonText}>{t('dealer.deleteProduct')}</CustomText>
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
                {t('dealer.createProduct')}
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
        title={dropdownType === 'category' ? t('dealer.selectCategory') : t('dealer.selectVehicleType')}
        searchable={true}
      />
    </View>
  );
};

export default AddEditProductScreen;

