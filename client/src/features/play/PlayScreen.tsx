import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { screenHeight, screenWidth } from '@utils/Scaling';
import { Fonts, headerTopInset } from '@utils/Constants';
import { playFeedText } from '@utils/playTypography';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { getPosts } from '@service/postService';
import { getStoryFeed } from '@service/storyService';
import { IPost } from '../../types/post/IPost';
import { IStoryFeedEntry } from '../../types/story/IStory';
import ImagePostItem from './ImagePostItem';
import PlayPostSkeleton from './PlayPostSkeleton';
import PlayStoryRail from './PlayStoryRail';
import { navigate } from '@utils/NavigationUtils';
import { useTheme } from '@hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { withAuth } from '@utils/AuthGuard';
import { useTranslation } from 'react-i18next';

type PlayRouteParams = {
  refresh?: boolean;
  postId?: string;
};

const PlayScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [storyFeed, setStoryFeed] = useState<IStoryFeedEntry[]>([]);
  const [storyLoading, setStoryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchPosts = React.useCallback(async (opts?: { showSkeleton?: boolean }) => {
    const showSkeleton = opts?.showSkeleton ?? false;

    try {
      if (showSkeleton) setLoading(true);
      const response = await getPosts();
      if (response.success && response.Response) {
        setPosts(response.Response);
      }
      setHasLoadedOnce(true);
    } catch (error) {
      setHasLoadedOnce(true);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, []);

  const fetchStoryFeed = React.useCallback(async () => {
    setStoryLoading(true);
    try {
      const res = await getStoryFeed();
      if (res.success !== false && Array.isArray(res.Response)) {
        setStoryFeed(res.Response);
      } else {
        setStoryFeed([]);
      }
    } catch {
      setStoryFeed([]);
    } finally {
      setStoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts({ showSkeleton: true });
    void fetchStoryFeed();
  }, [fetchPosts, fetchStoryFeed]);

  useFocusEffect(
    React.useCallback(() => {
      const params = (route.params || {}) as PlayRouteParams;
      if (params.refresh) {
        const shouldShowSkeleton = posts.length === 0;
        fetchPosts({ showSkeleton: shouldShowSkeleton });
        void fetchStoryFeed();
        (navigation as any).setParams?.({ refresh: false });
      }
    }, [route.params, fetchPosts, fetchStoryFeed, posts.length]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPosts({ showSkeleton: false }), fetchStoryFeed()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts, fetchStoryFeed]);

  const handleStorySelect = React.useCallback(
    (entry: IStoryFeedEntry) => {
      withAuth(
        () => {
          if (entry.isOwn && entry.itemCount === 0) {
            navigate('CreateNewPost');
            return;
          }
          navigate('StoryViewer', { userId: entry.userId, userName: entry.userName });
        },
        t('play.story.loginToView'),
      );
    },
    [t],
  );

  const listHeader = React.useMemo(
    () => (
      <PlayStoryRail
        entries={storyFeed}
        loading={storyLoading && storyFeed.length === 0}
        onSelectEntry={handleStorySelect}
      />
    ),
    [storyFeed, storyLoading, handleStorySelect],
  );

  const renderPostItem = React.useCallback(({ item }: { item: IPost }) => {
    return (
      <ImagePostItem
        post={item}
        onUserBlocked={() => {
          void fetchPosts({ showSkeleton: false });
        }}
        onStoryMutated={() => {
          void fetchStoryFeed();
        }}
      />
    );
  }, [fetchPosts, fetchStoryFeed]);

  const renderSkeletonList = () => {
    const skeletonData = Array.from({length: 5}, (_, i) => ({id: `skeleton-${i}`}));
    return (
      <FlatList
        data={skeletonData}
        renderItem={() => <PlayPostSkeleton />}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
      />
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="images-outline" size={RFValue(40)} color={colors.disabled} />
        <CustomText
          fontSize={RFValue(13)}
          fontFamily={Fonts.SemiBold}
          style={[playFeedText.username, { color: colors.text, marginTop: 12, marginBottom: 6 }]}>
          No Posts Yet
        </CustomText>
        <CustomText
          fontSize={RFValue(10)}
          fontFamily={Fonts.Regular}
          style={[
            playFeedText.body,
            { color: colors.disabled, textAlign: 'center', paddingHorizontal: 28 },
          ]}>
          Start following users to see their posts here
        </CustomText>
      </View>
    );
  };

  const headerIconColor = colors.white;

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary, paddingTop: headerTopInset(insets.top) }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <View style={styles.logoContainer}>
          <CustomText fontSize={RFValue(20)} fontFamily={Fonts.Bold} style={styles.motoText}>
            Moto
            <CustomText fontSize={RFValue(20)} fontFamily={Fonts.Bold} style={styles.nodeText}>
              node
            </CustomText>
          </CustomText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => withAuth(() => navigate('UserSelection'))}
            activeOpacity={0.7}>
            <Icon name="search" size={RFValue(18)} color={headerIconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => withAuth(() => navigate('CreateNewPost'), 'Please login to share your car posts.')}
            activeOpacity={0.7}>
            <Icon name="add" size={RFValue(18)} color={headerIconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => withAuth(() => navigate('Chat'))}
            activeOpacity={0.7}>
            <Icon name="chatbubble-outline" size={RFValue(18)} color={headerIconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Container with Curved Top */}
      <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        {(loading && posts.length === 0) || (!hasLoadedOnce && posts.length === 0) ? (
          renderSkeletonList()
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPostItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              posts.length === 0 && styles.emptyListContent
            ]}
            ListEmptyComponent={!loading ? renderEmptyState : null}
            ListHeaderComponent={listHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.secondary}
                colors={[colors.secondary]}
              />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.045,
    paddingBottom: 8,
    paddingTop: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.95,
  },
  motoText: {
    color: '#000000',
  },
  nodeText: {
    color: '#E31E24',
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: screenWidth * 0.04,
  },
  iconButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: screenHeight * 0.05,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.2,
  },
});

export default PlayScreen;
