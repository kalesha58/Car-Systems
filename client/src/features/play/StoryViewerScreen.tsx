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
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { Fonts, fontStyle } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { useTranslation } from 'react-i18next';
import { getStoryByUserId, recordStoryView, getStoryViewers } from '@service/storyService';
import { IStory, IStoryViewerEntry } from '../../types/story/IStory';
import UserInitialAvatar from './UserInitialAvatar';
import { formatRelativeTime } from '@utils/timeUtils';

const { width: W, height: H } = Dimensions.get('window');

/** Time each story slide stays on screen before auto-advancing (matches reference “timer” behavior). */
const STORY_SLIDE_MS = 30_000;

const StoryViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const paramUserId = route.params?.userId as string | undefined;
  const paramUserName = route.params?.userName as string | undefined;
  const paramUserAvatar = route.params?.userAvatar as string | undefined;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [story, setStory] = useState<IStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<IStoryViewerEntry[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewTotal, setViewTotal] = useState(0);
  const [liked, setLiked] = useState(false);
  const lastRecordedRef = useRef<string>('');
  const slideProgress = useRef(new Animated.Value(0)).current;
  const goNextRef = useRef<() => void>(() => undefined);

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

  useEffect(() => {
    if (!story?.id || !isOwner) {
      setViewTotal(0);
      return;
    }
    let cancelled = false;
    void getStoryViewers(story.id, 1, 1)
      .then((res) => {
        if (!cancelled) setViewTotal(res.Response?.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setViewTotal(0);
      });
    return () => {
      cancelled = true;
    };
  }, [story?.id, isOwner]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      navigation.goBack();
    }
  }, [index, items.length, navigation]);

  goNextRef.current = goNext;

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  }, [index]);

  const currentSlideKey = useMemo(() => {
    if (!story?.id || items.length === 0) return '';
    const idx = Math.min(index, Math.max(0, items.length - 1));
    const it = items[idx];
    return `${story.id}:${idx}:${it?.mediaUrl ?? ''}:${it?.type ?? ''}`;
  }, [story?.id, index, items]);

  useEffect(() => {
    if (loading || !currentSlideKey || viewersOpen) {
      return;
    }
    slideProgress.setValue(0);
    const anim = Animated.timing(slideProgress, {
      toValue: 1,
      duration: STORY_SLIDE_MS,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) goNextRef.current();
    });
    return () => {
      anim.stop();
    };
  }, [loading, currentSlideKey, viewersOpen, slideProgress]);

  const openViewers = useCallback(async () => {
    if (!story?.id || !isOwner) return;
    setViewersOpen(true);
    setViewersLoading(true);
    try {
      const res = await getStoryViewers(story.id, 1, 50);
      setViewers(res.Response.viewers);
      setViewTotal(res.Response.total ?? res.Response.viewers.length);
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  }, [story?.id, isOwner]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 14 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 90) {
            navigation.goBack();
            return;
          }
          if (g.dy < -55 && isOwner) {
            void openViewers();
          }
        },
      }),
    [navigation, isOwner, openViewers],
  );

  const displayName =
    paramUserName?.trim() ||
    (paramUserId && user?.id === paramUserId ? user?.name : undefined) ||
    t('play.story.user');

  const avatarUri =
    paramUserAvatar ||
    (paramUserId && user?.id === paramUserId ? user?.profileImage : undefined) ||
    undefined;

  const item = items[Math.min(index, Math.max(0, items.length - 1))];

  const sheetBg = isDark ? '#1c1c1e' : '#ffffff';
  const sheetText = isDark ? '#fff' : '#1a1a1a';
  const sheetMeta = isDark ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.48)';
  const sheetTileBg = isDark ? '#2c2c2e' : '#ececec';
  const sheetDivider = isDark ? '#38383a' : 'rgba(0,0,0,0.08)';
  const sheetShadow =
    Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.45 : 0.1,
          shadowRadius: 10,
        }
      : { elevation: 18 };

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

  const tags = item.tags?.filter(Boolean) ?? [];

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" />

      <View style={StyleSheet.absoluteFill}>
        {item.type === 'image' ? (
          <Image source={{ uri: item.mediaUrl }} style={styles.fullMedia} resizeMode="cover" />
        ) : (
          <View style={[styles.fullMedia, styles.videoFallback]}>
            <Icon name="play-circle" size={RFValue(64)} color="#fff" />
            <CustomText style={styles.videoHint}>{t('play.story.videoInPost')}</CustomText>
          </View>
        )}
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.15)', 'transparent']}
        locations={[0, 0.45, 1]}
        style={styles.topFade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.4, 1]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <View style={[styles.topChrome, { paddingTop: insets.top + 6 }]}>
        <View style={styles.progressRow}>
          {items.map((_, i) => {
            const isPast = i < index;
            const isCurrent = i === index;
            return (
              <View key={i} style={styles.progressSegTrack}>
                {isPast ? <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#fff' }]} /> : null}
                {isCurrent ? (
                  <Animated.View
                    style={[
                      styles.progressSegFill,
                      {
                        width: slideProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.headerRow}>
          <UserInitialAvatar
            name={displayName}
            userId={paramUserId}
            imageUri={avatarUri}
            size={36}
            borderWidth={0}
            fallbackBackgroundColor={colors.secondary}
            initialsColor={colors.white}
          />
          <View style={styles.headerTextCol}>
            <CustomText fontFamily={Fonts.SemiBold} style={styles.headerName} numberOfLines={1}>
              {displayName}
            </CustomText>
            <View style={styles.headerSubRow}>
              <View style={[styles.roleDot, { backgroundColor: 'rgba(255,255,255,0.55)' }]} />
              <CustomText fontSize={RFValue(9)} style={styles.headerTime} numberOfLines={1}>
                {formatRelativeTime(item.createdAt)}
              </CustomText>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setLiked((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.iconHit}>
              <Icon
                name={liked ? 'heart' : 'heart-outline'}
                size={RFValue(20)}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.iconHit}>
              <Icon name="close" size={RFValue(21)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Pressable style={styles.tapLeft} onPress={goPrev} />
      <Pressable style={styles.tapRight} onPress={goNext} />

      <View style={[styles.bottomChrome, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        {item.caption ? (
          <CustomText style={styles.captionText} numberOfLines={4}>
            {item.caption}
          </CustomText>
        ) : null}

        {tags.length > 0 ? (
          <View style={styles.tagsWrap}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <CustomText fontSize={RFValue(9)} fontFamily={Fonts.Medium} style={styles.tagPillText}>
                  #{tag}
                </CustomText>
              </View>
            ))}
          </View>
        ) : null}

        {isOwner ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => void openViewers()}
            style={styles.viewsRow}>
            <View style={styles.viewsLeft}>
              <Icon name="eye-outline" size={RFValue(13)} color="rgba(255,255,255,0.95)" />
              <CustomText fontSize={RFValue(10)} fontFamily={Fonts.Medium} style={styles.viewsCount}>
                {t('play.story.viewCount', { count: viewTotal })}
              </CustomText>
            </View>
            <View style={styles.swipeHint}>
              <Icon name="chevron-up" size={RFValue(12)} color="rgba(255,255,255,0.85)" />
              <CustomText fontSize={RFValue(9)} style={styles.swipeHintText}>
                {t('play.story.swipeUpToSee')}
              </CustomText>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={viewersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setViewersOpen(false)}>
        <Pressable style={styles.viewersBackdrop} onPress={() => setViewersOpen(false)}>
          <Pressable
            style={[styles.viewersSheet, { backgroundColor: sheetBg }, sheetShadow]}
            onPress={(e) => e.stopPropagation()}>
            <View style={[styles.viewersGrab, { backgroundColor: sheetMeta }]} />

            <View style={styles.viewersSheetHeader}>
              <View style={[styles.viewsIconTile, { backgroundColor: sheetTileBg }]}>
                <Icon name="eye-outline" size={RFValue(14)} color={sheetText} />
              </View>
              <View style={styles.viewersTitleBlock}>
                <CustomText fontSize={RFValue(13)} fontFamily={Fonts.SemiBold} style={{ color: sheetText }}>
                  {t('play.story.viewsTitle', { count: viewTotal })}
                </CustomText>
                <CustomText fontSize={RFValue(10)} style={{ color: sheetMeta, marginTop: 2 }}>
                  {t('play.story.viewsSubtitle')}
                </CustomText>
              </View>
              <TouchableOpacity
                onPress={() => setViewersOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.sheetCloseHit}>
                <Icon name="close" size={RFValue(17)} color={sheetText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.viewersDivider, { backgroundColor: sheetDivider }]} />

            {viewersLoading ? (
              <ActivityIndicator
                color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)'}
                style={{ marginVertical: 24 }}
              />
            ) : viewers.length === 0 ? (
              <View style={styles.viewersEmpty}>
                <View style={[styles.viewersEmptyIconCircle, { backgroundColor: sheetTileBg }]}>
                  <Icon name="eye-off-outline" size={RFValue(24)} color={sheetMeta} />
                </View>
                <CustomText fontSize={RFValue(13)} fontFamily={Fonts.SemiBold} style={{ color: sheetText, marginTop: 12 }}>
                  {t('play.story.noViewsTitle')}
                </CustomText>
                <CustomText
                  fontSize={RFValue(10)}
                  style={{ color: sheetMeta, marginTop: 6, textAlign: 'center', paddingHorizontal: 32, lineHeight: RFValue(15) }}>
                  {t('play.story.noViewsHint')}
                </CustomText>
              </View>
            ) : (
              <FlatList
                data={viewers}
                keyExtractor={(v) => v.viewerUserId}
                style={{ maxHeight: H * 0.48 }}
                renderItem={({ item: v }) => (
                  <View style={[styles.viewerRow, { borderBottomColor: sheetDivider }]}>
                    <UserInitialAvatar
                      name={v.userName || ''}
                      userId={v.viewerUserId}
                      imageUri={v.userAvatar}
                      size={34}
                      borderColor={colors.border}
                      borderWidth={StyleSheet.hairlineWidth}
                      fallbackBackgroundColor={colors.secondary}
                      initialsColor={colors.white}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <CustomText fontSize={RFValue(12)} fontFamily={Fonts.SemiBold} style={{ color: sheetText }}>
                        {v.userName || t('play.story.user')}
                      </CustomText>
                      <CustomText fontSize={RFValue(9)} style={{ color: sheetMeta, marginTop: 2 }}>
                        {formatRelativeTime(v.lastViewedAt)}
                      </CustomText>
                    </View>
                  </View>
                )}
              />
            )}
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
  fullMedia: {
    width: W,
    height: H,
  },
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: H * 0.28,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.42,
  },
  topChrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 4,
    paddingHorizontal: 10,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  progressSegTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressSegFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  headerName: {
    color: '#fff',
    fontSize: RFValue(12),
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerTime: {
    color: 'rgba(255,255,255,0.82)',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapLeft: {
    position: 'absolute',
    left: 0,
    top: H * 0.18,
    bottom: H * 0.22,
    width: W * 0.34,
    zIndex: 2,
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: H * 0.18,
    bottom: H * 0.22,
    width: W * 0.34,
    zIndex: 2,
  },
  bottomChrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    paddingHorizontal: 16,
  },
  captionText: {
    color: '#fff',
    fontSize: RFValue(12),
    ...fontStyle(Fonts.Regular),
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  tagPillText: {
    color: '#fff',
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewsCount: {
    color: 'rgba(255,255,255,0.95)',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swipeHintText: {
    color: 'rgba(255,255,255,0.85)',
  },
  videoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  videoHint: {
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontSize: RFValue(13),
  },
  viewersBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  viewersSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
    maxHeight: H * 0.72,
  },
  viewersGrab: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
  },
  viewersSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsIconTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewersTitleBlock: {
    flex: 1,
    marginLeft: 10,
  },
  sheetCloseHit: {
    padding: 4,
  },
  viewersDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 12,
    marginBottom: 6,
  },
  viewersEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  viewersEmptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default StoryViewerScreen;
