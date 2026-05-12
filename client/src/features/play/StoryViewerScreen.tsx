import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Pressable,
  FlatList,
  PanResponder,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { useTranslation } from 'react-i18next';
import { getStoryByUserId, recordStoryView, getStoryViewers } from '@service/storyService';
import { IStory, IStoryViewerEntry } from '../../types/story/IStory';
import UserInitialAvatar from './UserInitialAvatar';
import { formatRelativeTime } from '@utils/timeUtils';

const { width: W, height: H } = Dimensions.get('window');

const StoryViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const paramUserId = route.params?.userId as string | undefined;
  const paramUserName = route.params?.userName as string | undefined;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [story, setStory] = useState<IStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<IStoryViewerEntry[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const lastRecordedRef = useRef<string>('');

  const load = useCallback(async () => {
    if (!paramUserId) {
      navigation.goBack();
      return;
    }
    setLoading(true);
    try {
      const res = await getStoryByUserId(paramUserId);
      setStory(res.Response);
      setIndex(0);
      lastRecordedRef.current = '';
    } catch {
      Alert.alert(t('profile.error'), t('play.story.unavailable'), [
        { text: t('profile.continue'), onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [paramUserId, navigation, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = story?.items ?? [];
  const isOwner = Boolean(user?.id && story?.userId && user.id === story.userId);

  useEffect(() => {
    if (!story?.id || items.length === 0) return;
    const idx = Math.min(index, items.length - 1);
    const key = `${story.id}:${idx}`;
    if (lastRecordedRef.current === key) return;
    lastRecordedRef.current = key;
    void recordStoryView(story.id, idx).catch(() => undefined);
  }, [story?.id, index, items.length]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      navigation.goBack();
    }
  }, [index, items.length, navigation]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  }, [index]);

  const openViewers = async () => {
    if (!story?.id || !isOwner) return;
    setViewersOpen(true);
    setViewersLoading(true);
    try {
      const res = await getStoryViewers(story.id);
      setViewers(res.Response.viewers);
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 14 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 90) {
            navigation.goBack();
          }
        },
      }),
    [navigation],
  );

  const displayName =
    paramUserName?.trim() ||
    (paramUserId && user?.id === paramUserId ? user?.name : undefined) ||
    t('play.story.user');

  const item = items[Math.min(index, Math.max(0, items.length - 1))];

  if (loading) {
    return (
      <View style={[styles.centered, styles.root]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!story || !item) {
    return (
      <View style={[styles.centered, styles.root]}>
        <StatusBar barStyle="light-content" />
        <CustomText style={{ color: '#fff' }}>{t('play.story.unavailable')}</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerBtn}>
          <Icon name="close" size={RFValue(26)} color="#fff" />
        </TouchableOpacity>
        <CustomText
          fontSize={RFValue(14)}
          fontFamily={Fonts.SemiBold}
          style={{ color: '#fff', flex: 1, textAlign: 'center' }}
          numberOfLines={1}>
          {displayName}
        </CustomText>
        {isOwner ? (
          <TouchableOpacity onPress={openViewers} style={styles.headerBtn}>
            <Icon name="eye-outline" size={RFValue(22)} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View style={styles.progressRow}>
        {items.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSeg,
              { backgroundColor: i <= index ? '#fff' : 'rgba(255,255,255,0.35)' },
            ]}
          />
        ))}
      </View>

      <View style={styles.mediaWrap}>
        {item.type === 'image' ? (
          <Image source={{ uri: item.mediaUrl }} style={styles.media} resizeMode="contain" />
        ) : (
          <View style={[styles.media, styles.videoFallback]}>
            <Icon name="play-circle" size={RFValue(64)} color="#fff" />
            <CustomText style={{ color: '#fff', marginTop: 12, textAlign: 'center', paddingHorizontal: 24 }}>
              {t('play.story.videoInPost')}
            </CustomText>
          </View>
        )}

        <Pressable style={styles.tapLeft} onPress={goPrev} />
        <Pressable style={styles.tapRight} onPress={goNext} />
      </View>

      {item.caption ? (
        <View style={[styles.captionBar, { paddingBottom: insets.bottom + 12 }]}>
          <CustomText style={styles.captionText} numberOfLines={4}>
            {item.caption}
          </CustomText>
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}

      <Modal
        visible={viewersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setViewersOpen(false)}>
        <Pressable style={styles.viewersBackdrop} onPress={() => setViewersOpen(false)}>
          <Pressable
            style={[styles.viewersSheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.viewersGrab} />
            <CustomText
              fontSize={RFValue(16)}
              fontFamily={Fonts.SemiBold}
              style={{ color: colors.text, marginBottom: 12 }}>
              {t('play.story.viewers')}
            </CustomText>
            {viewersLoading ? (
              <ActivityIndicator color={colors.secondary} style={{ marginVertical: 24 }} />
            ) : viewers.length === 0 ? (
              <CustomText style={{ color: colors.disabled, marginVertical: 16 }}>
                {t('play.story.noViewersYet')}
              </CustomText>
            ) : (
              <FlatList
                data={viewers}
                keyExtractor={(v) => v.viewerUserId}
                style={{ maxHeight: H * 0.5 }}
                renderItem={({ item: v }) => (
                  <View style={styles.viewerRow}>
                    <UserInitialAvatar
                      name={v.userName || ''}
                      userId={v.viewerUserId}
                      imageUri={v.userAvatar}
                      size={44}
                      borderColor={colors.border}
                      borderWidth={StyleSheet.hairlineWidth}
                      fallbackBackgroundColor={colors.secondary}
                      initialsColor={colors.white}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <CustomText fontFamily={Fonts.SemiBold} style={{ color: colors.text }}>
                        {v.userName || t('play.story.user')}
                      </CustomText>
                      <CustomText fontSize={RFValue(10)} style={{ color: colors.disabled, marginTop: 2 }}>
                        {formatRelativeTime(v.lastViewedAt)}
                      </CustomText>
                    </View>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              onPress={() => setViewersOpen(false)}
              style={[styles.viewersCloseBtn, { backgroundColor: colors.secondary }]}>
              <CustomText style={{ color: '#fff', fontFamily: Fonts.SemiBold }}>{t('play.story.close')}</CustomText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 2,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  progressSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  mediaWrap: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  media: {
    width: W,
    height: H * 0.68,
  },
  videoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  tapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: W * 0.34,
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: W * 0.34,
  },
  captionBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  captionText: {
    color: '#fff',
    fontSize: RFValue(13),
    fontFamily: Fonts.Regular,
  },
  viewersBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  viewersSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: H * 0.72,
  },
  viewersGrab: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginBottom: 12,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  viewersCloseBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default StoryViewerScreen;
