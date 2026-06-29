import React, { useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { CommunityPost } from '@data/mockData';

const FEED_WIDTH = Dimensions.get('window').width;

interface CommunityPostCardProps {
  post: CommunityPost;
}

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    lightHaptic();
    setLiked((prev) => {
      setLikes((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  };

  const handleSave = () => {
    lightHaptic();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <Image source={{ uri: post.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{post.user}</Text>
          {post.vehicle ? (
            <Text style={[styles.location, { color: colors.textSecondary }]}>{post.vehicle}</Text>
          ) : null}
        </View>
        <Pressable style={styles.moreBtn} hitSlop={8}>
          <Feather name="more-horizontal" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {post.image ? (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      ) : (
        <View style={[styles.textOnlyBody, { backgroundColor: colors.muted }]}>
          <Text style={[styles.textOnlyContent, { color: colors.textPrimary }]}>{post.content}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable style={styles.actionBtn} onPress={handleLike} hitSlop={6}>
            <Feather
              name="heart"
              size={24}
              color={liked ? '#ED4956' : colors.textPrimary}
            />
          </Pressable>
          <Pressable style={styles.actionBtn} hitSlop={6}>
            <Feather name="message-circle" size={24} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.actionBtn} hitSlop={6}>
            <Feather name="send" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <Pressable style={styles.actionBtn} onPress={handleSave} hitSlop={6}>
          <Feather name="bookmark" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={[styles.likes, { color: colors.textPrimary }]}>
        {formatCount(likes)} likes
      </Text>

      {post.image ? (
        <Text style={styles.caption} numberOfLines={3}>
          <Text style={[styles.captionUser, { color: colors.textPrimary }]}>{post.user} </Text>
          <Text style={[styles.captionText, { color: colors.textPrimary }]}>{post.content}</Text>
        </Text>
      ) : null}

      {post.comments > 0 && (
        <Pressable style={styles.commentsLink}>
          <Text style={[styles.commentsText, { color: colors.textTertiary }]}>
            View all {post.comments} comments
          </Text>
        </Pressable>
      )}

      <Text style={[styles.time, { color: colors.textTertiary }]}>{post.time}</Text>
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
