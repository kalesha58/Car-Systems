import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
import { useTranslation } from 'react-i18next';
import { appendStoryFromPost } from '@service/storyService';
import { useToast } from '@hooks/useToast';

const { width: W, height: H } = Dimensions.get('window');

const PRESET_STATUS_TAGS = [
  'Creative',
  'Work',
  'Life',
  'Update',
  'Promotion',
  'Available',
  'Hiring',
] as const;

export type StatusComposeParams = {
  postId: string;
  previewUri: string;
  authorName?: string;
  mediaType?: 'image' | 'video';
};

const StatusComposeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  const { postId, previewUri, authorName, mediaType } = (route.params || {}) as StatusComposeParams;
  const isVideo = mediaType === 'video' || (!!previewUri && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(previewUri));

  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((x) => x !== tag);
      if (prev.length >= 8) return prev;
      return [...prev, tag];
    });
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(async () => {
    if (!postId) {
      showError(t('play.story.failedAdd'));
      return;
    }
    setSubmitting(true);
    try {
      const cap = caption.trim();
      await appendStoryFromPost(postId, {
        caption: cap.length > 0 ? cap : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      showSuccess(t('play.story.statusAdded'));
      (navigation as any).navigate('MainTabs', {
        screen: 'Play',
        params: { refresh: true },
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.Response?.ReturnMessage ||
        e?.response?.data?.message ||
        e?.message ||
        t('play.story.failedAdd');
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [postId, caption, selectedTags, navigation, showSuccess, showError, t]);

  const inputBg = 'rgba(28,28,30,0.92)';
  const inputBorder = 'rgba(255,255,255,0.22)';

  if (!postId || !previewUri) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <TouchableOpacity onPress={handleClose} style={styles.closeCircle}>
          <Icon name="close" size={RFValue(22)} color="#fff" />
        </TouchableOpacity>
        <CustomText style={{ color: '#fff', marginTop: 24 }}>{t('play.story.unavailable')}</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {!isVideo ? (
        <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.videoBg]}>
          <Image source={{ uri: previewUri }} style={styles.videoThumb} resizeMode="cover" />
          <View style={styles.videoDim}>
            <Icon name="videocam" size={RFValue(48)} color="#fff" />
          </View>
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeCircle} activeOpacity={0.85}>
            <Icon name="close" size={RFValue(22)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handleShare()}
            disabled={submitting}
            style={styles.sharePill}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <CustomText style={styles.sharePillText}>{t('play.story.shareStatus')}</CustomText>
                <Icon name="paper-plane" size={RFValue(16)} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.flex} />

        <View style={[styles.bottomBlock, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.captionBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder={t('play.story.addCaptionPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.captionInput, { color: '#fff' }]}
              multiline
              maxLength={500}
            />
          </View>

          <CustomText style={styles.sectionLabel}>{t('play.story.statusTags')}</CustomText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsRow}>
            {PRESET_STATUS_TAGS.map((tag) => {
              const on = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                  style={[
                    styles.tagChip,
                    {
                      borderColor: on ? '#5AC8FA' : 'rgba(255,255,255,0.55)',
                      backgroundColor: on ? 'rgba(90,200,250,0.25)' : 'rgba(0,0,0,0.35)',
                    },
                  ]}>
                  <CustomText
                    fontSize={RFValue(12)}
                    fontFamily={Fonts.Medium}
                    style={{ color: on ? '#7fdbff' : '#fff' }}>
                    {tag}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {authorName ? (
            <CustomText fontSize={RFValue(10)} style={styles.byline}>
              {t('play.story.viaPostBy', { name: authorName })}
            </CustomText>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 4,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 110,
    justifyContent: 'center',
  },
  sharePillText: {
    color: '#fff',
    ...fontStyle(Fonts.SemiBold),
    fontSize: RFValue(14),
  },
  bottomBlock: {
    paddingHorizontal: 16,
    zIndex: 4,
  },
  captionBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    marginBottom: 16,
  },
  captionInput: {
    ...fontStyle(Fonts.Regular),
    fontSize: RFValue(14),
    textAlignVertical: 'top',
    minHeight: 80,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: RFValue(10),
    ...fontStyle(Fonts.SemiBold),
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
    maxWidth: W,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
    marginBottom: 8,
  },
  byline: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  videoBg: {
    backgroundColor: '#000',
  },
  videoThumb: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  videoDim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});

export default StatusComposeScreen;
