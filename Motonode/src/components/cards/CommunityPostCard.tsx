import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { likePost, unlikePost } from '@services/post.service';
import type { Post } from '../../types/post';
import { formatRelativeTime } from '@utils/formatRelativeTime';
import { lightHaptic } from '@utils/haptics';

const FEED_WIDTH = Dimensions.get('window').width;
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80';

interface CommunityPostCardProps {
  post: Post;
  onPostUpdated?: (post: Post) => void;
}

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

export function CommunityPostCard({ post, onPostUpdated }: CommunityPostCardProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [likes, setLikes] = useState(post.likes);
  const [liking, setLiking] = useState(false);

  const userName = post.userName ?? 'User';
  const avatar = post.userAvatar ?? DEFAULT_AVATAR;
  const image = post.images?.[0];
  const commentCount = post.comments?.length ?? 0;
  const subtitle = post.location?.address;
  const timeLabel = formatRelativeTime(post.createdAt);

  const handleLike = async () => {
    if (liking) return;
    lightHaptic();
    setLiking(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((count) => (wasLiked ? Math.max(0, count - 1) : count + 1));

    try {
      const response = wasLiked ? await unlikePost(post.id) : await likePost(post.id);
      if (response.Response) {
        setLiked(Boolean(response.Response.isLiked));
        setLikes(response.Response.likes);
        onPostUpdated?.(response.Response);
      }
    } catch {
      setLiked(wasLiked);
      setLikes(post.likes);
    } finally {
      setLiking(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName}</Text>
          {subtitle ? (
            <Text style={[styles.location, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        <Pressable style={styles.moreBtn} hitSlop={8}>
          <Feather name="more-horizontal" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {image ? (
        <Image source={{ uri: image }} style={styles.postImage} resizeMode="cover" />
      ) : post.text ? (
        <View style={[styles.textOnlyBody, { backgroundColor: colors.muted }]}>
          <Text style={[styles.textOnlyContent, { color: colors.textPrimary }]}>{post.text}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable style={styles.actionBtn} onPress={handleLike} hitSlop={6} disabled={liking}>
            {liking ? (
              <ActivityIndicator size="small" color={colors.link} />
            ) : (
              <Feather
                name="heart"
                size={24}
                color={liked ? colors.destructive : colors.textPrimary}
              />
            )}
          </Pressable>
          <Pressable style={styles.actionBtn} hitSlop={6}>
            <Feather name="message-circle" size={24} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.actionBtn} hitSlop={6}>
            <Feather name="send" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <Pressable style={styles.actionBtn} hitSlop={6}>
          <Feather name="bookmark" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={[styles.likes, { color: colors.textPrimary }]}>
        {formatCount(likes)} likes
      </Text>

      {image && post.text ? (
        <Text style={styles.caption} numberOfLines={3}>
          <Text style={[styles.captionUser, { color: colors.textPrimary }]}>{userName} </Text>
          <Text style={[styles.captionText, { color: colors.textPrimary }]}>{post.text}</Text>
        </Text>
      ) : null}

      {commentCount > 0 && (
        <Pressable style={styles.commentsLink}>
          <Text style={[styles.commentsText, { color: colors.textTertiary }]}>
            View all {commentCount} comments
          </Text>
        </Pressable>
      )}

      {timeLabel ? (
        <Text style={[styles.time, { color: colors.textTertiary }]}>{timeLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  location: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  moreBtn: { padding: 4 },
  postImage: {
    width: FEED_WIDTH,
    height: FEED_WIDTH,
  },
  textOnlyBody: {
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  textOnlyContent: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    padding: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  likes: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  caption: {
    paddingHorizontal: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  captionUser: { fontFamily: 'Inter_600SemiBold' },
  captionText: { fontFamily: 'Inter_400Regular' },
  commentsLink: { paddingHorizontal: 12, paddingTop: 4 },
  commentsText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  time: {
    paddingHorizontal: 12,
    paddingTop: 4,
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
