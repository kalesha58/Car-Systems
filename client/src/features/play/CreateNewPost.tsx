import React, {useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenHeight, screenWidth} from '@utils/Scaling';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import {useTheme} from '@hooks/useTheme';
import {uploadImage, createPost} from '@service/postService';
import {ICreatePostRequest} from '../../types/post/IPost';
import {getCurrentLocationWithAddress} from '@utils/addressUtils';
import {ILocationData} from '../../types/address/IAddress';
import {useToast} from '@hooks/useToast';

const MAX_IMAGES = 10;
const MAX_TEXT_LENGTH = 5000;

const CreateNewPost: React.FC = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {showSuccess, showError} = useToast();
  const [text, setText] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [location, setLocation] = useState<ILocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
      minHeight: screenHeight * 0.12,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    textInput: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.text,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: RFValue(7),
      fontFamily: Fonts.Regular,
      color: colors.disabled,
      marginTop: screenHeight * 0.005,
      textAlign: 'right',
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
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
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
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
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
    submitButton: {
      backgroundColor: Colors.secondary,
      borderRadius: 8,
      paddingVertical: screenHeight * 0.015,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: screenHeight * 0.02,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
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
  });

  const handleImagePicker = () => {
    if (imageUris.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can add up to ${MAX_IMAGES} images.`);
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

  const handleLocationPicker = async () => {
    setIsGettingLocation(true);
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        setLocation(locationData);
      } else {
        showError('Failed to get location. Please try again.');
      }
    } catch (error) {
      showError('Failed to get location. Please try again.');
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
    const uploadedUrls: string[] = [];

    try {
      for (const uri of imageUris) {
        const url = await uploadImage(uri);
        uploadedUrls.push(url);
      }
      return uploadedUrls;
    } catch (error) {
      throw new Error('Failed to upload images. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      showError('Please enter some text for your post.');
      return;
    }

    if (text.trim().length > MAX_TEXT_LENGTH) {
      showError(`Text must be less than ${MAX_TEXT_LENGTH} characters.`);
      return;
    }

    if (imageUris.length === 0) {
      showError('Please add at least one image to create a post.');
      return;
    }

    setIsLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();

      if (uploadedImageUrls.length === 0) {
        showError('Failed to upload images. Please try again.');
        setIsLoading(false);
        return;
      }

      const postData: ICreatePostRequest = {
        text: text.trim(),
        images: uploadedImageUrls,
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address,
            }
          : undefined,
      };

      await createPost(postData);

      setIsLoading(false);
      
      // Small delay to ensure state updates complete before showing toast
      setTimeout(() => {
        showSuccess('Post created successfully', 3000);
      }, 100);
      
      setTimeout(() => {
        (navigation as any).navigate('MainTabs', {
          screen: 'Play',
        });
      }, 2500);
    } catch (error) {
      setIsLoading(false);
      showError('Failed to create post. Please try again.');
    }
  };

  const isSubmitting = isLoading || isUploadingImages;
  const isFormValid = text.trim().length > 0 && !isSubmitting;

  return (
    <View style={styles.container}>
      <CustomHeader title="Create New Post" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.label}>Post Text *</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.disabled}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={MAX_TEXT_LENGTH}
            />
          </View>
          <CustomText style={styles.characterCount}>
            {text.length}/{MAX_TEXT_LENGTH}
          </CustomText>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>Images *</CustomText>
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
          <CustomText style={styles.label}>Location (Optional)</CustomText>
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
                {isGettingLocation ? 'Getting location...' : 'Add Location'}
              </CustomText>
            </TouchableOpacity>
          ) : (
            <View style={styles.locationContainer}>
              <Icon name="location" size={RFValue(16)} color={Colors.secondary} />
              <CustomText style={styles.locationText} numberOfLines={2}>
                {location.address || location.formattedAddress}
              </CustomText>
              <TouchableOpacity
                style={styles.removeLocationButton}
                onPress={removeLocation}>
                <Icon name="close-circle" size={RFValue(18)} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <CustomText style={styles.submitButtonText}>Create Post</CustomText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateNewPost;

