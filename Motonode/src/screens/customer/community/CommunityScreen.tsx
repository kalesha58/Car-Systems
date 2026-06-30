import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { CommunityPostCard } from '@components/cards/CommunityPostCard';
import { CommunityStoriesRow } from '@components/community/CommunityStoriesRow';
import { ChromeHeader } from '@components/common';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { useTabBarBottomPadding } from '@hooks/useTabBarBottomPadding';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import type { CustomerTabParamList } from '@navigation/CustomerTabsNavigator';
import { getPosts } from '@services/post.service';
import { getStoryFeed } from '@services/story.service';
import type { Post } from '../../../types/post';
import type { StoryFeedEntry } from '../../../types/story';
import { extractAuthErrorMessage } from '@utils/authErrors';
import { lightHaptic } from '@utils/haptics';

type CommunityNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, typeof CustomerTabRoutes.Community>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

export function CommunityScreen() {
  const colors = useColors();
  const navigation = useNavigation<CommunityNavigationProp>();
  const { user } = useAuth();
  const tabBarPadding = useTabBarBottomPadding();

  const [posts, setPosts] = useState<Post[]>([]);
  const [storyFeed, setStoryFeed] = useState<StoryFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCommunity = useCallback(async (opts?: { showLoader?: boolean }) => {
    const showLoader = opts?.showLoader ?? false;

    if (user?.isGuest) {
      setPosts([]);
      setStoryFeed([]);
      setError('Sign in to view the community feed.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const [postsResponse, storiesResponse] = await Promise.all([
        getPosts(),
        getStoryFeed(),
      ]);

      if (postsResponse.success !== false && Array.isArray(postsResponse.Response)) {
        setPosts(postsResponse.Response);
      } else {
        setPosts([]);
      }

      if (storiesResponse.success !== false && Array.isArray(storiesResponse.Response)) {
        setStoryFeed(storiesResponse.Response);
      } else {
        setStoryFeed([]);
      }
    } catch (err) {
      setError(extractAuthErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.isGuest]);

  useFocusEffect(
    useCallback(() => {
      void loadCommunity({ showLoader: posts.length === 0 });
    }, [loadCommunity, posts.length]),
  );

  const handleRefresh = () => {
    lightHaptic();
    setRefreshing(true);
    void loadCommunity();
  };

  const handlePostUpdated = (updated: Post) => {
    setPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)));
  };

  const handleCreate = () => {
    lightHaptic();
    if (user?.isGuest) {
      Alert.alert('Sign in required', 'Please sign in to create a community post.');
      return;
    }
    navigation.navigate(CustomerStackRoutes.CreateCommunityPost);
  };

  const listHeader = (
    <CommunityStoriesRow
      stories={storyFeed}
      loading={loading && storyFeed.length === 0}
      ownAvatar={user?.avatar}
      ownLabel="Your story"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Community</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
              <Feather name="heart" size={22} color={colors.headerForeground} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
              <Feather name="send" size={20} color={colors.headerForeground} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                lightHaptic();
                navigation.navigate(CustomerStackRoutes.ChatList);
              }}
              hitSlop={6}
            >
              <Feather name="message-square" size={22} color={colors.headerForeground} />
            </Pressable>
          </View>
        </View>
      </ChromeHeader>

      {loading && posts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.link} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarPadding + 80, flexGrow: 1 }}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.link}
              colors={[colors.link]}
            />
          }
          renderItem={({ item }) => (
            <CommunityPostCard post={item} onPostUpdated={handlePostUpdated} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {error ?? 'No posts yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) for Create Post */}
      <Pressable
        style={[
          styles.fabBtn,
          {
            backgroundColor: colors.primary,
            bottom: tabBarPadding + 16,
          },
        ]}
        onPress={handleCreate}
      >
        <Feather name="plus" size={24} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBtn: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
