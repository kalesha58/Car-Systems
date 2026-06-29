import React, { useState } from 'react';
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
import { COMMUNITY_POSTS } from '@data/mockData';
import { useColors } from '@hooks/useColors';

const FILTERS = ['For You', 'Following', 'Trending', 'Rides', 'Reviews'];

export function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Community</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <Feather name="search" size={22} color="#fff" />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Feather name="edit" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
        <FlatList
          data={FILTERS}
          keyExtractor={(i) => i}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.filterChip, activeFilter === index && { backgroundColor: colors.primary }]}
              onPress={() => setActiveFilter(index)}
            >
              <Text style={[styles.filterText, { color: activeFilter === index ? '#fff' : 'rgba(255,255,255,0.7)' }]}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={COMMUNITY_POSTS}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 34 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Pressable style={[styles.createPost, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Feather name="user" size={18} color="#fff" />
            </View>
            <View style={[styles.createInput, { backgroundColor: colors.muted }]}>
              <Text style={[styles.createText, { color: colors.textTertiary }]}>Share your ride story...</Text>
            </View>
            <Pressable style={[styles.photoBtn, { backgroundColor: colors.muted }]}>
              <Feather name="image" size={18} color={colors.textSecondary} />
            </Pressable>
          </Pressable>
        }
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
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  filtersRow: { gap: 8, paddingBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 16 },
  createPost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  createInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  createText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  photoBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
