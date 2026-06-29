import React from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CommunityPostCard } from '@components/cards/CommunityPostCard';
import { CommunityStoriesRow } from '@components/community/CommunityStoriesRow';
import { COMMUNITY_POSTS } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { useTabBarBottomPadding } from '@hooks/useTabBarBottomPadding';
import { lightHaptic } from '@utils/haptics';

export function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarPadding = useTabBarBottomPadding();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Community</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
            <Feather name="heart" size={24} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
            <Feather name="send" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={COMMUNITY_POSTS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
        ListHeaderComponent={<CommunityStoriesRow />}
        renderItem={({ item }) => <CommunityPostCard post={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
