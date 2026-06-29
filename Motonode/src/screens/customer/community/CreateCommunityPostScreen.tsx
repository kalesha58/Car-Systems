import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';

import { ChromeHeader } from '@components/common';
import { PhotoPermissionModal, PhotoPickerSheet, type PhotoPickerOption } from '@components/modals';
import { CustomerStackRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { createPost } from '@services/post.service';
import { uploadImagesBatch } from '@services/upload.service';
import { getString, setString } from '@storage/index';
import { StorageKeys } from '@storage/keys';
import type { CreatePostRequest } from '../../../types/post';
import { extractAuthErrorMessage } from '@utils/authErrors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import {
  hasPhotoPermission,
  requestPhotoPermission,
  type PhotoSource,
} from '@utils/photoPermissions';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.CreateCommunityPost
>;

const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGES = 10;
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80';

type PostType = 'text' | 'photo' | 'quote' | 'poll';
type Privacy = 'public' | 'community';

const POST_TYPES: { id: PostType; label: string; icon: string }[] = [
  { id: 'text', label: 'Text', icon: 'file-text' },
  { id: 'photo', label: 'Photo', icon: 'image' },
  { id: 'quote', label: 'Quote', icon: 'message-square' },
  { id: 'poll', label: 'Poll', icon: 'bar-chart-2' },
];

const ATTACHMENTS: { id: string; label: string; icon: string; color: string }[] = [
  { id: 'media', label: 'Photo', icon: 'image', color: '#E60012' },
  { id: 'feeling', label: 'Feeling', icon: 'smile', color: '#F59E0B' },
  { id: 'location', label: 'Location', icon: 'map-pin', color: '#10B981' },
  { id: 'hashtag', label: 'Hashtag', icon: 'hash', color: '#3B82F6' },
  { id: 'tag', label: 'Tag People', icon: 'user-plus', color: '#8B5CF6' },
];

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'life', label: 'My Life', icon: 'heart' },
  { id: 'inspiration', label: 'Inspiration', icon: 'star' },
  { id: 'tips', label: 'Tips & Tricks', icon: 'zap' },
  { id: 'cars', label: 'Cars & Bikes', icon: 'truck' },
  { id: 'more', label: 'More...', icon: 'more-horizontal' },
];

export function CreateCommunityPostScreen({ navigation }: Props) {
  const colors = useColors();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [category, setCategory] = useState('life');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [permissionVisible, setPermissionVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [pendingSource, setPendingSource] = useState<PhotoSource | null>(null);

  const avatar = user?.avatar ?? DEFAULT_AVATAR;
  const displayName = user?.name ?? 'You';
  const canSubmit = (text.trim().length > 0 || imageUris.length > 0) && !submitting && !uploading;

  const previewText = useMemo(() => {
    if (text.trim()) return text.trim();
    return 'This is how your post will appear in the community feed.';
  }, [text]);

  const showComingSoon = (feature: string) => {
    Alert.alert('Coming soon', `${feature} will be available in a future update.`);
  };

  const applyPickedImages = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) {
      if (response.errorCode === 'permission') {
        setPendingSource(null);
        setPermissionDenied(true);
        setPermissionVisible(true);
      }
      return;
    }

    const picked = (response.assets ?? [])
      .map((asset) => asset.uri)
      .filter((uri): uri is string => Boolean(uri));

    if (picked.length > 0) {
      setImageUris((current) => [...current, ...picked].slice(0, MAX_IMAGES));
      setPostType('photo');
    }
  };

  const openNativePicker = (source: PhotoSource) => {
    const remaining = MAX_IMAGES - imageUris.length;
    const options = {
      mediaType: 'photo' as const,
      selectionLimit: source === 'gallery' ? remaining : 1,
      quality: 0.8 as const,
      maxWidth: 1600,
      maxHeight: 1600,
      includeBase64: false,
    };

    if (source === 'camera') {
      launchCamera(options, applyPickedImages);
    } else {
      launchImageLibrary(options, applyPickedImages);
    }
  };

  const beginPhotoPick = async (source: PhotoSource) => {
    setPendingSource(source);

    const rationaleAccepted = await getString(StorageKeys.PHOTO_PERMISSION_RATIONALE);
    const systemGranted = await hasPhotoPermission(source);

    if (rationaleAccepted === 'true' && systemGranted) {
      openNativePicker(source);
      setPendingSource(null);
      return;
    }

    setPermissionDenied(false);
    setPermissionVisible(true);
  };

  const handlePhotoPickerSelect = (option: PhotoPickerOption) => {
    lightHaptic();
    void beginPhotoPick(option);
  };

  const handlePermissionAllow = async () => {
    if (!pendingSource) return;

    setPermissionLoading(true);
    try {
      await setString(StorageKeys.PHOTO_PERMISSION_RATIONALE, 'true');
      const granted = await requestPhotoPermission(pendingSource);

      if (granted) {
        setPermissionVisible(false);
        const source = pendingSource;
        setPendingSource(null);
        setPermissionDenied(false);
        openNativePicker(source);
        return;
      }

      setPermissionDenied(true);
    } finally {
      setPermissionLoading(false);
    }
  };

  const handlePermissionDeny = () => {
    setPermissionVisible(false);
    setPermissionDenied(false);
    setPendingSource(null);
  };

  const openPhotoPicker = () => {
    lightHaptic();
    if (imageUris.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    setPickerVisible(true);
  };

  const handleAttachment = (id: string) => {
    lightHaptic();
    if (id === 'media') {
      openPhotoPicker();
      return;
    }
    const labels: Record<string, string> = {
      feeling: 'Feelings',
      location: 'Location',
      hashtag: 'Hashtags',
      tag: 'Tag people',
    };
    showComingSoon(labels[id] ?? 'This feature');
  };

  const removeImage = (index: number) => {
    setImageUris((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (user?.isGuest) {
      Alert.alert('Sign in required', 'Please sign in to create a community post.');
      return;
    }

    lightHaptic();
    setSubmitting(true);
    setError(null);

    try {
      let uploadedUrls: string[] = [];
      if (imageUris.length > 0) {
        setUploading(true);
        uploadedUrls = await uploadImagesBatch(imageUris.map((uri) => ({ uri })));
        setUploading(false);
      }

      const postData: CreatePostRequest = {
        text: text.trim(),
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      };

      await createPost(postData);
      successHaptic();
      navigation.goBack();
    } catch (err) {
      setError(extractAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PhotoPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handlePhotoPickerSelect}
      />

      <PhotoPermissionModal
        visible={permissionVisible && pendingSource !== null}
        source={pendingSource ?? 'gallery'}
        variant={permissionDenied ? 'denied' : 'request'}
        loading={permissionLoading}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />

      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>
            Create Community Post
          </Text>
          <Pressable
            style={[styles.postHeaderBtn, !canSubmit && styles.postHeaderBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            hitSlop={8}
          >
            {submitting || uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.postHeaderText,
                  { color: canSubmit ? colors.primary : colors.textTertiary },
                ]}
              >
                Post
              </Text>
            )}
          </Pressable>
        </View>
      </ChromeHeader>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Composer */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.composerTop}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TextInput
                style={[styles.composerInput, { color: colors.textPrimary }]}
                placeholder="What's on your mind? Share your thoughts, moments or inspiration..."
                placeholderTextColor={colors.placeholder}
                multiline
                value={text}
                onChangeText={setText}
                maxLength={MAX_TEXT_LENGTH}
                textAlignVertical="top"
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {text.length}/{MAX_TEXT_LENGTH}
            </Text>

            {imageUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
                {imageUris.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.mediaThumbWrap}>
                    <Image source={{ uri }} style={styles.mediaThumb} />
                    <Pressable style={styles.removeMedia} onPress={() => removeImage(index)}>
                      <Feather name="x" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Post type */}
          <SectionLabel
            title="Post Type"
            hint="Choose one"
            colors={colors}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {POST_TYPES.map((type) => {
              const selected = postType === type.id;
              return (
                <Pressable
                  key={type.id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    if (type.id === 'photo') {
                      openPhotoPicker();
                    } else if (type.id === 'poll' || type.id === 'quote') {
                      showComingSoon(type.label);
                    } else {
                      setPostType(type.id);
                    }
                  }}
                >
                  <Feather
                    name={type.icon}
                    size={18}
                    color={selected ? colors.primary : colors.icon}
                  />
                  <Text
                    style={[
                      styles.typeChipLabel,
                      { color: selected ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Attachments */}
          <SectionLabel title="Add to your post (optional)" colors={colors} />
          <View style={styles.attachRow}>
            {ATTACHMENTS.map((item) => (
              <Pressable key={item.id} style={styles.attachItem} onPress={() => handleAttachment(item.id)}>
                <View style={[styles.attachIcon, { backgroundColor: `${item.color}18` }]}>
                  <Feather name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.attachLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Categories */}
          <SectionLabel title="Categories (optional)" hint="Select a category" colors={colors} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {CATEGORIES.map((cat) => {
              const selected = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    if (cat.id === 'more') {
                      showComingSoon('More categories');
                    } else {
                      setCategory(cat.id);
                    }
                  }}
                >
                  <Feather
                    name={cat.icon}
                    size={14}
                    color={selected ? colors.primary : colors.icon}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: selected ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Privacy */}
          <SectionLabel title="Privacy" colors={colors} />
          <Text style={[styles.privacySub, { color: colors.textTertiary }]}>
            Who can see this post?
          </Text>
          <View style={styles.privacyRow}>
            <PrivacyCard
              title="Public"
              description="Anyone in the community can see this"
              icon="globe"
              selected={privacy === 'public'}
              onPress={() => {
                lightHaptic();
                setPrivacy('public');
              }}
              colors={colors}
            />
            <PrivacyCard
              title="Community Only"
              description="Only community members can see this"
              icon="users"
              selected={privacy === 'community'}
              onPress={() => {
                lightHaptic();
                setPrivacy('community');
              }}
              colors={colors}
            />
          </View>

          {/* Preview */}
          <SectionLabel title="Preview" hint="See how your post will look" colors={colors} />
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.previewHeader}>
              <Image source={{ uri: avatar }} style={styles.previewAvatar} />
              <View style={styles.previewMeta}>
                <Text style={[styles.previewName, { color: colors.textPrimary }]}>{displayName}</Text>
                <View style={styles.previewSubRow}>
                  <Text style={[styles.previewTime, { color: colors.textTertiary }]}>Just now</Text>
                  <Feather name="globe" size={10} color={colors.textTertiary} />
                  <Text style={[styles.previewTime, { color: colors.textTertiary }]}>
                    {privacy === 'public' ? 'Public' : 'Community'}
                  </Text>
                </View>
              </View>
              <Feather name="more-vertical" size={16} color={colors.textTertiary} />
            </View>
            <Text style={[styles.previewBody, { color: colors.textPrimary }]}>{previewText}</Text>
            {(imageUris[0] ?? null) && (
              <Image source={{ uri: imageUris[0] }} style={styles.previewImage} resizeMode="cover" />
            )}
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom action bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.bottomTools}>
            <Pressable style={styles.toolBtn} onPress={() => showComingSoon('Background')}>
              <Feather name="droplet" size={18} color={colors.icon} />
              <Text style={[styles.toolLabel, { color: colors.textSecondary }]}>Background</Text>
            </Pressable>
            <Pressable style={styles.toolBtn} onPress={() => showComingSoon('Text style')}>
              <Feather name="type" size={18} color={colors.icon} />
              <Text style={[styles.toolLabel, { color: colors.textSecondary }]}>Text Style</Text>
            </Pressable>
            <Pressable style={styles.toolBtn} onPress={() => showComingSoon('Stickers')}>
              <Feather name="smile" size={18} color={colors.icon} />
              <Text style={[styles.toolLabel, { color: colors.textSecondary }]}>Sticker</Text>
            </Pressable>
          </View>
          <Pressable
            style={[
              styles.submitBtn,
              { backgroundColor: canSubmit ? colors.primary : colors.disabled },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting || uploading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                Post to Community
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionLabel({
  title,
  hint,
  colors,
}: {
  title: string;
  hint?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {hint ? (
        <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

function PrivacyCard({
  title,
  description,
  icon,
  selected,
  onPress,
  colors,
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      style={[
        styles.privacyCard,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.privacyCardTop}>
        <View style={[styles.privacyIconWrap, { backgroundColor: colors.muted }]}>
          <Feather name={icon} size={16} color={selected ? colors.primary : colors.icon} />
        </View>
        <View
          style={[
            styles.radioOuter,
            { borderColor: selected ? colors.primary : colors.border },
          ]}
        >
          {selected ? <View style={[styles.radioInner, { backgroundColor: colors.primary }]} /> : null}
        </View>
      </View>
      <Text style={[styles.privacyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.privacyDesc, { color: colors.textTertiary }]}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  postHeaderBtn: {
    minWidth: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postHeaderBtnDisabled: { opacity: 0.5 },
  postHeaderText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  composerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  composerInput: {
    flex: 1,
    minHeight: 100,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    paddingTop: 4,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  mediaRow: { marginTop: 12 },
  mediaThumbWrap: { marginRight: 8, position: 'relative' },
  mediaThumb: { width: 72, height: 72, borderRadius: 10 },
  removeMedia: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sectionHint: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  hRow: { gap: 10, paddingVertical: 2 },
  typeChip: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typeChipLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  attachRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attachItem: { alignItems: 'center', width: 64, gap: 6 },
  attachIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  privacySub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: -8,
  },
  privacyRow: { flexDirection: 'row', gap: 10 },
  privacyCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  privacyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  privacyTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  privacyDesc: { fontSize: 10, fontFamily: 'Inter_400Regular', lineHeight: 14 },
  previewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewAvatar: { width: 36, height: 36, borderRadius: 18 },
  previewMeta: { flex: 1, gap: 2 },
  previewName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  previewSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewTime: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  previewBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  bottomSpacer: { height: 100 },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    gap: 12,
  },
  bottomTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  toolBtn: { alignItems: 'center', gap: 4 },
  toolLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
