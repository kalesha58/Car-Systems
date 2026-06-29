import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { CommunityPost } from '@data/mockData';

interface CommunityPostCardProps {
  post: CommunityPost;
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    lightHaptic();
    setLiked(prev => !prev);
    setLikes(prev => (liked ? prev - 1 : prev + 1));
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Image source={{ uri: post.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{post.user}</Text>
          {post.vehicle && (
            <Text style={[styles.vehicle, { color: colors.primary }]}>{post.vehicle}</Text>
          )}
          <Text style={[styles.time, { color: colors.textTertiary }]}>{post.time}</Text>
        </View>
        <Pressable style={styles.moreBtn}>
          <Feather name="more-horizontal" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
      <Text style={[styles.content, { color: colors.textPrimary }]}>{post.content}</Text>
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      )}
      <View style={[styles.actions, { borderTopColor: colors.divider }]}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Feather
            name="heart"
            size={18}
            color={liked ? colors.destructive : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
              { color: liked ? colors.destructive : colors.textSecondary },
            ]}
          >
            {likes}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Feather name="message-circle" size={18} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.comments}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Feather name="share-2" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    paddingBottom: 10,
    gap: 10,
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  vehicle: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 1 },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  moreBtn: { padding: 4 },
  content: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  postImage: { width: '100%', height: 220 },
  actions: { flexDirection: 'row', padding: 12, paddingTop: 10, borderTopWidth: 1, gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
