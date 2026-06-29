import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { StoryFeedEntry } from '../../types/story';
import { lightHaptic } from '@utils/haptics';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80';

interface CommunityStoriesRowProps {
  stories: StoryFeedEntry[];
  loading?: boolean;
  ownAvatar?: string;
  ownLabel?: string;
}

export function CommunityStoriesRow({
  stories,
  loading = false,
  ownAvatar,
  ownLabel = 'Your story',
}: CommunityStoriesRowProps) {
  const colors = useColors();

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingWrap, { borderBottomColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.link} />
      </View>
    );
  }

  const ownEntry = stories.find((entry) => entry.isOwn);
  const otherStories = stories.filter((entry) => !entry.isOwn);

  const displayStories: StoryFeedEntry[] = [
    ...(ownEntry
      ? [ownEntry]
      : [
          {
            userId: 'own',
            userName: ownLabel,
            userAvatar: ownAvatar,
            itemCount: 0,
            hasUnseen: false,
            isOwn: true,
          } satisfies StoryFeedEntry,
        ]),
    ...otherStories,
  ];

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <FlatList
        data={displayStories}
        keyExtractor={(item) => item.userId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => {
          const avatar = item.userAvatar ?? item.previewMediaUrl ?? DEFAULT_AVATAR;
          const label = item.isOwn ? ownLabel : (item.userName ?? 'User');

          return (
            <Pressable style={styles.storyItem} onPress={() => lightHaptic()}>
              {item.isOwn ? (
                <View style={[styles.ownRing, { borderColor: colors.border }]}>
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                  <View
                    style={[
                      styles.addBadge,
                      { backgroundColor: colors.primary, borderColor: colors.card },
                    ]}
                  >
                    <Feather name="plus" size={10} color={colors.primaryForeground} />
                  </View>
                </View>
              ) : (
                <LinearGradient
                  colors={
                    item.hasUnseen
                      ? [colors.link, '#DD2A7B', '#8134AF']
                      : [colors.border, colors.border]
                  }
                  style={styles.storyRing}
                >
                  <View style={[styles.storyInner, { backgroundColor: colors.card }]}>
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  </View>
                </LinearGradient>
              )}
              <Text style={[styles.storyLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  row: {
    paddingHorizontal: 12,
    gap: 14,
  },
  storyItem: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  addBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    width: 72,
  },
});
