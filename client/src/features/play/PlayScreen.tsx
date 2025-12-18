import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { screenHeight, screenWidth } from '@utils/Scaling';
import { Colors, Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { getPosts } from '@service/postService';
import { IPost } from '../../types/post/IPost';
import ImagePostItem from './ImagePostItem';
import PlayPostSkeleton from './PlayPostSkeleton';
import { navigate } from '@utils/NavigationUtils';
import { useTheme } from '@hooks/useTheme';
import { useNavigation } from '@react-navigation/native';

type PlayRouteParams = {
  refresh?: boolean;
};

const PlayScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [posts, setPosts] = useState<IPost[]>([]);
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
      // Handle error silently
      setHasLoadedOnce(true);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, []);

  // Initial load (skeleton)
  useEffect(() => {
    fetchPosts({ showSkeleton: true });
  }, [fetchPosts]);

  // Only refetch when explicitly requested (e.g. after creating a post)
  useFocusEffect(
    React.useCallback(() => {
      const params = (route.params || {}) as PlayRouteParams;
      if (params.refresh) {
        // fetch without forcing skeleton if we already have posts
        const shouldShowSkeleton = posts.length === 0;
        fetchPosts({ showSkeleton: shouldShowSkeleton });
        // clear flag so it doesn't refetch on every focus
        (navigation as any).setParams?.({ refresh: false });
      }
    }, [route.params, fetchPosts, posts.length]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPosts({ showSkeleton: false });
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts]);

  const renderPostItem = React.useCallback(({ item }: { item: IPost }) => {
    return <ImagePostItem post={item} />;
  }, []);

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
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        }
      />
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
      <Icon name="images-outline" size={RFValue(40)} color={colors.disabled} />
      <CustomText
        fontSize={RFValue(15)}
        fontFamily={Fonts.SemiBold}
        style={{ color: colors.text, marginTop: 12, marginBottom: 6 }}>
        No Posts Yet
      </CustomText>
      <CustomText
        fontSize={RFValue(12)}
        fontFamily={Fonts.Regular}
        style={{ color: colors.disabled, textAlign: 'center', paddingHorizontal: 28 }}>
        Start following users to see their posts here
      </CustomText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSecondary }]}>
        <View style={styles.headerRow}>
          <CustomText fontSize={RFValue(16)} fontFamily={Fonts.Bold} style={{ color: colors.text }}>
            Play
          </CustomText>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.cardBackground, borderColor: colors.backgroundSecondary }]}
              onPress={() => navigate('CreateNewPost')}
              activeOpacity={0.8}>
              <Icon name="add" size={RFValue(16)} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: Colors.secondary, borderColor: Colors.secondary }]}
              onPress={() => navigate('Chat')}
              activeOpacity={0.8}>
              <Icon name="chatbubble" size={RFValue(16)} color={colors.white} />
              <View style={styles.chatBadge}>
                <CustomText
                  fontSize={RFValue(7)}
                  fontFamily={Fonts.Bold}
                  style={{ color: Colors.secondary }}>
                  !
                </CustomText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.secondary}
              colors={[Colors.secondary]}
            />
          }
        />
      )}
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.012,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
  },
  chatBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.secondary,
  },
  listContent: {
    paddingBottom: screenHeight * 0.15,
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

