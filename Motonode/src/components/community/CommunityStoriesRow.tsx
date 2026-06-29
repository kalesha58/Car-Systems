import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface Story {
  id: string;
  user: string;
  avatar: string;
  isOwn?: boolean;
}

const STORIES: Story[] = [
  {
    id: 'you',
    user: 'Your story',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    isOwn: true,
  },
  {
    id: 's1',
    user: 'Arjun',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  },
  {
    id: 's2',
    user: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612e3eb?w=100&q=80',
  },
  {
    id: 's3',
    user: 'Rahul',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
  },
  {
    id: 's4',
    user: 'Sneha',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
  },
  {
    id: 's5',
    user: 'Vikram',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
  },
];

export function CommunityStoriesRow() {
  const colors = useColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <FlatList
        data={STORIES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={styles.storyItem} onPress={() => lightHaptic()}>
            {item.isOwn ? (
              <View style={[styles.ownRing, { borderColor: colors.border }]}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={[styles.addBadge, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                  <Feather name="plus" size={10} color="#fff" />
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                style={styles.storyRing}
              >
                <View style={[styles.storyInner, { backgroundColor: colors.card }]}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                </View>
              </LinearGradient>
            )}
            <Text style={[styles.storyLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.user}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
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
