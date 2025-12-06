import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, {FC, useState} from 'react';
import {launchImageLibrary, launchCamera, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useAuthStore} from '@state/authStore';
import {useTranslation} from 'react-i18next';
import {updateProfileImage} from '@service/profileService';

const ProfileHeader: FC = () => {
  const {user, setUser} = useAuthStore();
  const {t} = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  const getInitialLetter = (): string => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleImagePicker = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) {
      return;
    }

    const imageUri = response.assets?.[0]?.uri;
    if (!imageUri) {
      return;
    }

    uploadProfileImage(imageUri);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      t('profile.selectImage') || 'Select Image',
      t('profile.chooseOption') || 'Choose an option',
      [
        {
          text: t('profile.camera') || 'Camera',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: false,
              },
              handleImagePicker,
            );
          },
        },
        {
          text: t('profile.gallery') || 'Gallery',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: false,
              },
              handleImagePicker,
            );
          },
        },
        {
          text: t('profile.cancel') || 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setIsUploading(true);
      const updatedProfile = await updateProfileImage(imageUri);
      setUser(updatedProfile);
    } catch (error) {
      Alert.alert(
        t('profile.error') || 'Error',
        t('profile.uploadFailed') || 'Failed to upload profile image. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.profileImageContainer}
        onPress={showImagePickerOptions}
        disabled={isUploading}
        activeOpacity={0.8}>
        {user?.profileImage ? (
          <Image
            source={{uri: user.profileImage}}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <CustomText variant="h2" fontFamily={Fonts.Bold} style={styles.placeholderText}>
              {getInitialLetter()}
            </CustomText>
          </View>
        )}
        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        <View style={styles.editIconContainer}>
          <Icon name="pencil" size={RFValue(18)} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
});

export default ProfileHeader;

