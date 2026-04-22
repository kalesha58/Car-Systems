import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, {FC, useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary, launchCamera, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import AttachmentModal from '@components/common/AttachmentModal';
import {useAuthStore} from '@state/authStore';
import {useTranslation} from 'react-i18next';
import {updateProfile, updateProfileImage} from '@service/profileService';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';

const EditProfile: FC = () => {
  const {user, setUser} = useAuthStore();
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {showSuccess, showError} = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(
    user?.profileImage || null,
  );

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfileImageUri(user.profileImage || null);
    }
  }, [user]);

  const getInitialLetter = (): string => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleImagePicker = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      showError(response.errorMessage || t('profile.updateFailed'));
      return;
    }

    const imageUri = response.assets?.[0]?.uri;
    if (!imageUri) {
      return;
    }

    setProfileImageUri(imageUri);
  };

  const showImagePickerOptions = () => {
    setImagePickerVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError(t('profile.nameRequired'));
      return;
    }

    try {
      setIsLoading(true);

      // Update profile image if changed
      if (profileImageUri && profileImageUri !== user?.profileImage) {
        setIsUploading(true);
        const updatedProfile = await updateProfileImage(profileImageUri);
        setUser(updatedProfile);
        setIsUploading(false);
      }

      // Update name if changed
      if (name.trim() !== user?.name) {
        const updatedProfile = await updateProfile({name: name.trim()});
        setUser(updatedProfile);
      }

      showSuccess(t('profile.profileUpdated'));
      navigation.goBack();
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          error?.message ||
          t('profile.updateFailed'),
      );
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollViewContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 120,
    },
    profileImageContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarOuterRing: {
      width: 132,
      height: 132,
      borderRadius: 66,
      backgroundColor: `${colors.secondary}18`,
      borderWidth: 2,
      borderColor: `${colors.secondary}35`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    imageWrapper: {
      width: 116,
      height: 116,
      borderRadius: 58,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileImage: {
      width: '100%',
      height: '100%',
      borderRadius: 58,
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 58,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    placeholderText: {
      color: '#fff',
      fontSize: RFValue(34),
    },
    cameraBadgeButton: {
      position: 'absolute',
      right: 4,
      bottom: 6,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    editImageButton: {
      backgroundColor: `${colors.secondary}15`,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: `${colors.secondary}35`,
    },
    editImageButtonText: {
      color: colors.secondary,
      fontFamily: Fonts.Medium,
      fontSize: RFValue(9),
    },
    formContainer: {
      gap: 14,
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    inputGroup: {
      marginBottom: 0,
    },
    label: {
      marginBottom: 6,
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
      fontSize: RFValue(8.5),
      opacity: 0.95,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 48,
    },
    input: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.text,
    },
    inputReadOnly: {
      backgroundColor: colors.backgroundSecondary,
      opacity: 0.9,
    },
    readOnlyNote: {
      marginTop: 4,
      color: colors.textSecondary,
      fontSize: RFValue(7),
      fontStyle: 'italic',
    },
    saveButton: {
      backgroundColor: colors.secondary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 22,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(10),
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

  return (
    <View style={styles.container}>
      <CustomHeader title={t('profile.editProfile')} />
      <AttachmentModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        options={[
          {
            id: 'camera',
            label: t('profile.camera'),
            icon: 'camera-outline',
            color: colors.secondary,
            onPress: () => {
              launchCamera(
                {
                  mediaType: 'photo',
                  quality: 0.5,
                  maxWidth: 1600,
                  maxHeight: 1600,
                  assetRepresentationMode: 'compatible',
                  includeBase64: false,
                },
                handleImagePicker,
              );
            },
          },
          {
            id: 'gallery',
            label: t('profile.gallery'),
            icon: 'images-outline',
            color: colors.primary || colors.secondary,
            onPress: () => {
              launchImageLibrary(
                {
                  mediaType: 'photo',
                  quality: 0.5,
                  maxWidth: 1600,
                  maxHeight: 1600,
                  assetRepresentationMode: 'compatible',
                  includeBase64: false,
                  selectionLimit: 1,
                },
                handleImagePicker,
              );
            },
          },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileImageContainer}>
          <View style={styles.avatarOuterRing}>
            <View style={styles.imageWrapper}>
              {profileImageUri ? (
                <Image
                  source={{uri: profileImageUri}}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <CustomText variant="h1" fontFamily={Fonts.Bold} style={styles.placeholderText}>
                    {getInitialLetter()}
                  </CustomText>
                </View>
              )}
              {isUploading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraBadgeButton}
                onPress={showImagePickerOptions}
                disabled={isUploading}
                activeOpacity={0.85}>
                <Icon name="camera" size={RFValue(12)} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editImageButton}
            onPress={showImagePickerOptions}
            disabled={isUploading}
            activeOpacity={0.8}>
            <Icon name="camera-outline" size={RFValue(14)} color={colors.secondary} />
            <CustomText style={styles.editImageButtonText}>
              {t('profile.changePhoto')}
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>
              {t('profile.name')}
            </CustomText>
            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={RFValue(14)} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.enterName')}
                placeholderTextColor={colors.textSecondary}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>
              {t('profile.email')}
            </CustomText>
            <View style={[styles.inputContainer, styles.inputReadOnly]}>
              <Icon name="email-outline" size={RFValue(14)} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={email}
                editable={false}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <CustomText style={styles.readOnlyNote}>
              {t('profile.emailReadOnly')}
            </CustomText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (isLoading || isUploading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading || isUploading}
          activeOpacity={0.8}>
          {isLoading || isUploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <CustomText style={styles.saveButtonText}>
              {t('profile.save')}
            </CustomText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default EditProfile;

