import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenHeight, screenWidth} from '@utils/Scaling';
import { Fonts, headerTopInset, MIN_TOUCH_TARGET } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import {uploadImagesBatch, createPost, updatePost, getPostById} from '@service/postService';
import {ICreatePostRequest, IUpdatePostRequest} from '../../types/post/IPost';
import {getCurrentLocationWithAddress} from '@utils/addressUtils';
import {ILocationData} from '../../types/address/IAddress';
import {useToast} from '@hooks/useToast';
import {useAuthStore} from '@state/authStore';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const MAX_IMAGES = 10;
const MAX_TEXT_LENGTH = 5000;

const CreateNewPost: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editPostId = (route.params as {postId?: string} | undefined)?.postId;
  const {colors, isDark} = useTheme();
  const {showSuccess, showError} = useToast();
  const {user} = useAuthStore();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [location, setLocation] = useState<ILocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);
  const [isLoadingPost, setIsLoadingPost] = useState(!!editPostId);

  useEffect(() => {
    if (!editPostId) {
      setIsLoadingPost(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoadingPost(true);
      try {
        const res = await getPostById(editPostId);
        if (cancelled) {
          return;
        }
        const p = res?.Response;
        if (p && typeof p.id === 'string') {
          setText(p.text || '');
          setImageUris(p.images && p.images.length > 0 ? [...p.images] : []);
          if (p.location) {
            const addr = p.location.address || '';
            setLocation({
              latitude: p.location.latitude,
              longitude: p.location.longitude,
              address: addr,
              formattedAddress: addr,
            });
          } else {
            setLocation(null);
          }
        } else {
          showError('Could not load this post.');
          navigation.goBack();
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const ax = err as {response?: {data?: {Response?: {ReturnMessage?: string}}}}; 
          const msg =
            ax?.response?.data?.Response?.ReturnMessage ||
            (err instanceof Error ? err.message : null) ||
            'Could not load this post.';
          showError(msg);
          navigation.goBack();
        }
      } finally {
        setIsLoadingPost(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editPostId, navigation, showError]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      setIsOptionsExpanded(false);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      /** Match main surface — avoids green filling gaps when the keyboard opens */
      backgroundColor: colors.background,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      overflow: 'hidden',
    },
    header: {
      height: 56,
      paddingHorizontal: screenWidth * 0.04,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.secondary,
    },
    headerCenterTitle: {
      fontSize: RFValue(12),
      color: colors.text,
      fontFamily: Fonts.SemiBold,
    },
    postButton: {
      minWidth: 60,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    postButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      elevation: 0,
    },
    postButtonText: {
      color: colors.secondary,
      fontFamily: Fonts.Bold,
      fontSize: RFValue(10),
    },
    postButtonTextDisabled: {
      color: 'rgba(255, 255, 255, 0.5)',
    },
    content: {
      paddingHorizontal: screenWidth * 0.04,
      paddingTop: 24,
      paddingBottom: 20,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : '#ECEFF3',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: colors.text,
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
    },
    userName: {
      marginLeft: 10,
      fontSize: RFValue(10),
      color: colors.text,
      fontFamily: Fonts.SemiBold,
    },
    textInput: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: colors.text,
      textAlignVertical: 'top',
      lineHeight: RFValue(18),
      paddingVertical: 10,
      minHeight: screenHeight * 0.25,
    },
    characterCount: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Regular,
      color: colors.disabled,
      marginTop: 10,
      textAlign: 'right',
    },
    mediaPreviewContainer: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    imageWrapper: {
      position: 'relative',
      width: (screenWidth - screenWidth * 0.08 - 20) / 3,
      height: (screenWidth - screenWidth * 0.08 - 20) / 3,
      borderRadius: RFValue(12),
      overflow: 'hidden',
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
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.56)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationCard: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
    },
    locationText: {
      flex: 1,
      marginLeft: 8,
      color: colors.text,
      fontSize: RFValue(9),
      fontFamily: Fonts.Medium,
    },
    bottomTray: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: screenWidth * 0.04,
      paddingTop: 10,
      paddingBottom: Math.max(insets.bottom, 10),
    },
    dragHandle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#374151' : '#D1D5DB',
      alignSelf: 'center',
      marginBottom: 12,
    },
    trayHeader: {
      fontSize: RFValue(10),
      color: colors.text,
      fontFamily: Fonts.SemiBold,
      marginBottom: 10,
    },
    tileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tile: {
      width: '48.5%',
      borderRadius: 11,
      backgroundColor: isDark ? colors.backgroundTertiary : '#F3F4F6',
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginBottom: 8,
    },
    tileTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    tileTitle: {
      fontSize: RFValue(9),
      color: colors.text,
      fontFamily: Fonts.SemiBold,
    },
    compactTray: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 4,
    },
    compactIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    compactAction: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : '#EEF2FF',
    },
    optionIconBadge: {
      width: 20,
      height: 20,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
  }), [colors, isDark, insets.bottom]);

  const fullName = user?.name || user?.fullName || 'User';
  const avatarUrl = user?.profileImage || user?.image || user?.avatar;
  const avatarInitial = fullName.trim().charAt(0).toUpperCase() || 'U';

  const handleImagePicker = () => {
    if (imageUris.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.5,
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

  const handleSubmit = async () => {
    if (!text.trim() && imageUris.length === 0) {
      showError('Please add some text or at least one image.');
      return;
    }

    setIsLoading(true);

    try {
      let uploadedImageUrls: string[] = [];
      if (imageUris.length > 0) {
        setIsUploadingImages(true);
        uploadedImageUrls = await uploadImagesBatch(imageUris.map(uri => ({uri})));
        setIsUploadingImages(false);
      }

      const locationPayload = location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          }
        : undefined;

      if (editPostId) {
        const updateData: IUpdatePostRequest = {
          text: text.trim(),
          images: uploadedImageUrls,
          ...(locationPayload !== undefined ? {location: locationPayload} : {}),
        };
        await updatePost(editPostId, updateData);
        setIsLoading(false);
        showSuccess('Post updated');
        setTimeout(() => navigation.goBack(), 600);
        return;
      }

      const postData: ICreatePostRequest = {
        text: text.trim(),
        images: uploadedImageUrls,
        location: locationPayload,
      };

      await createPost(postData);
      setIsLoading(false);

      showSuccess('Post created successfully');

      setTimeout(() => {
        (navigation as any).navigate('MainTabs', {
          screen: 'Play',
          params: { refresh: true },
        });
      }, 1500);
    } catch (error: any) {
      setIsLoading(false);
      setIsUploadingImages(false);
      const fallback = editPostId
        ? 'Failed to update post. Please try again.'
        : 'Failed to create post. Please try again.';
      showError(error?.message || fallback);
    }
  };

  const isSubmitting = isLoading || isUploadingImages;
  const isFormValid = (text.trim().length > 0 || imageUris.length > 0) && !isSubmitting;

  const optionItems = [
    {id: 'photo', label: 'Photo/Video', icon: 'image-outline', color: '#38bdf8', onPress: handleImagePicker},
    {id: 'gif', label: 'Gif', icon: 'sparkles-outline', color: '#60a5fa', onPress: () => showError('GIF option coming soon.')},
    {id: 'poll', label: 'Poll', icon: 'list-outline', color: '#34d399', onPress: () => showError('Poll option coming soon.')},
    {id: 'adoption', label: 'Adoption', icon: 'newspaper-outline', color: '#f43f5e', onPress: () => showError('Adoption option coming soon.')},
    {id: 'location', label: 'Location', icon: 'location-outline', color: '#f59e0b', onPress: handleLocationPicker},
    {id: 'event', label: 'Event', icon: 'calendar-outline', color: '#a78bfa', onPress: () => showError('Event option coming soon.')},
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />

      <View style={{paddingTop: headerTopInset(insets.top), backgroundColor: colors.secondary}}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              minWidth: MIN_TOUCH_TARGET,
              minHeight: MIN_TOUCH_TARGET,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="close" size={RFValue(20)} color={colors.white} />
          </TouchableOpacity>
          <CustomText style={[styles.headerCenterTitle, {color: colors.white, fontSize: RFValue(14)}]}>
            {editPostId ? 'Edit post' : 'Create Post'}
          </CustomText>
          <TouchableOpacity
            style={[styles.postButton, !isFormValid && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || isLoadingPost}
            activeOpacity={0.8}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <CustomText style={[styles.postButtonText, !isFormValid && styles.postButtonTextDisabled]}>
                {editPostId ? 'Save' : 'Post'}
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {isLoadingPost ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48}}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                {avatarUrl ? (
                  <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
                ) : (
                  <CustomText style={styles.avatarText}>{avatarInitial}</CustomText>
                )}
              </View>
              <CustomText style={styles.userName}>{fullName}</CustomText>
            </View>

            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              maxLength={MAX_TEXT_LENGTH}
              multiline
              placeholder="What do you want to talk about?"
              placeholderTextColor={colors.disabled}
            />

            <CustomText style={styles.characterCount}>
              {text.length}/{MAX_TEXT_LENGTH}
            </CustomText>

            {imageUris.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                {imageUris.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.imageWrapper}>
                    <Image source={{uri}} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                      activeOpacity={0.8}>
                      <Icon name="close" size={RFValue(12)} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {!!location && (
              <View style={styles.locationCard}>
                <View style={styles.locationRow}>
                  <Icon name="location" size={RFValue(14)} color={colors.secondary} />
                  <CustomText style={styles.locationText} numberOfLines={2}>
                    {location.address || location.formattedAddress}
                  </CustomText>
                </View>
                <TouchableOpacity onPress={removeLocation} activeOpacity={0.7}>
                  <Icon name="close-circle" size={RFValue(17)} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
        </ScrollView>
        )}
      </View>

      <View style={styles.bottomTray}>
        {!isLoadingPost && !isKeyboardVisible && isOptionsExpanded && (
          <>
            <View style={styles.dragHandle} />
            <CustomText style={styles.trayHeader}>Add to your post</CustomText>
            <View style={styles.tileGrid}>
              {optionItems.map(item => (
                <TouchableOpacity key={item.id} style={styles.tile} onPress={item.onPress} activeOpacity={0.8}>
                  <View style={styles.tileTopRow}>
                    <View style={[styles.optionIconBadge, {backgroundColor: `${item.color}20`}]}>
                      {item.id === 'location' && isGettingLocation ? (
                        <ActivityIndicator size="small" color={item.color} />
                      ) : (
                        <Icon name={item.icon} size={RFValue(12)} color={item.color} />
                      )}
                    </View>
                    <Icon name="add" size={RFValue(12)} color={colors.text} />
                  </View>
                  <CustomText style={styles.tileTitle}>{item.label}</CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {!isLoadingPost && (isKeyboardVisible || !isOptionsExpanded) && (
          <View style={styles.compactTray}>
            <View style={styles.compactIcons}>
              {optionItems.map(item => (
                <TouchableOpacity key={item.id} style={styles.compactAction} onPress={item.onPress} activeOpacity={0.8}>
                  {item.id === 'location' && isGettingLocation ? (
                    <ActivityIndicator size="small" color={item.color} />
                  ) : (
                    <Icon name={item.icon} size={RFValue(11)} color={item.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setIsOptionsExpanded(prev => !prev)}
              activeOpacity={0.8}>
              <Icon
                name={isOptionsExpanded ? 'chevron-down' : 'chevron-up'}
                size={RFValue(16)}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateNewPost;
