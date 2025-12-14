import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, {FC, useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary, launchCamera, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
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
    if (response.didCancel || response.errorCode) {
      return;
    }

    const imageUri = response.assets?.[0]?.uri;
    if (!imageUri) {
      return;
    }

    setProfileImageUri(imageUri);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      t('profile.selectImage'),
      t('profile.chooseOption'),
      [
        {
          text: t('profile.camera'),
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
          text: t('profile.gallery'),
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
          text: t('profile.cancel'),
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
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
      padding: 16,
      paddingBottom: 100,
    },
    profileImageContainer: {
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 20,
    },
    imageWrapper: {
      width: 100,
      height: 100,
      borderRadius: 50,
      position: 'relative',
      overflow: 'hidden',
      marginBottom: 12,
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
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    placeholderText: {
      color: '#fff',
      fontSize: RFValue(32),
    },
    editImageButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    editImageButtonText: {
      color: colors.white,
      fontFamily: Fonts.Medium,
      fontSize: RFValue(9),
    },
    formContainer: {
      gap: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      marginBottom: 6,
      fontFamily: Fonts.Medium,
      color: colors.text,
      fontSize: RFValue(8),
      opacity: 0.8,
    },
    input: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputReadOnly: {
      backgroundColor: colors.backgroundSecondary,
      color: colors.textSecondary,
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
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
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
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileImageContainer}>
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
          </View>
          <TouchableOpacity
            style={styles.editImageButton}
            onPress={showImagePickerOptions}
            disabled={isUploading}
            activeOpacity={0.8}>
            <Icon name="camera" size={RFValue(14)} color={colors.white} />
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
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('profile.enterName')}
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>
              {t('profile.email')}
            </CustomText>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={email}
              editable={false}
              placeholderTextColor={colors.textSecondary}
            />
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

