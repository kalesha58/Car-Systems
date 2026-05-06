import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
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
  postId?: string;
};

const PlayScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
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
      setHasLoadedOnce(true);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts({ showSkeleton: true });
  }, [fetchPosts]);

  useFocusEffect(
    React.useCallback(() => {
      const params = (route.params || {}) as PlayRouteParams;
      if (params.refresh) {
        const shouldShowSkeleton = posts.length === 0;
        fetchPosts({ showSkeleton: shouldShowSkeleton });
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
    return (
      <ImagePostItem
        post={item}
        onUserBlocked={() => {
          void fetchPosts({ showSkeleton: false });
        }}
      />
    );
  }, [fetchPosts]);

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
  };

  const headerTextColor = colors.white;
  const headerIconColor = colors.white;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.secondary }]} edges={['top']}>
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
            onPress={() => navigate('UserSelection')}
            activeOpacity={0.7}>
            <Icon name="search" size={RFValue(20)} color={headerIconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigate('CreateNewPost')}
            activeOpacity={0.7}>
            <Icon name="add" size={RFValue(20)} color={headerIconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigate('Chat')}
            activeOpacity={0.7}>
            <Icon name="chatbubble-outline" size={RFValue(20)} color={headerIconColor} />
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
    </SafeAreaView >
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
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.8,
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
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
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
