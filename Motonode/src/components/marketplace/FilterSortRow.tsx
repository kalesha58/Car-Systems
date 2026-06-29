import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { MarketplaceFilterTab } from '@components/marketplace/MarketplaceFilterSheet';
import { useColors } from '@hooks/useColors';

const SORT_OPTIONS: Record<MarketplaceFilterTab, readonly { label: string; showChevron: boolean }[]> = {
  products: [
    { label: 'Price: Low to High', showChevron: true },
    { label: 'Most Popular', showChevron: true },
    { label: 'Newest', showChevron: false },
  ],
  vehicles: [
    { label: 'Price: Low to High', showChevron: true },
    { label: 'Price: High to Low', showChevron: true },
    { label: 'Newest', showChevron: false },
  ],
  services: [
    { label: 'Nearest First', showChevron: true },
    { label: 'Top Rated', showChevron: true },
    { label: 'Price: Low to High', showChevron: false },
  ],
};

interface FilterSortRowProps {
  tab: MarketplaceFilterTab;
  filterActive: boolean;
  activeFilterCount?: number;
  onFilterPress: () => void;
}

export function FilterSortRow({
  tab,
  filterActive,
  activeFilterCount = 0,
  onFilterPress,
}: FilterSortRowProps) {
  const colors = useColors();
  const sortOptions = SORT_OPTIONS[tab];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Pressable
        style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onFilterPress}
      >
        <Feather name="sliders" size={16} color={colors.textSecondary} />
        <Text style={[styles.pillText, { color: colors.textSecondary }]}>Filter</Text>
        {filterActive && (
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.countText}>{activeFilterCount}</Text>
          </View>
        )}
      </Pressable>
      {sortOptions.map((sort) => (
        <Pressable
          key={sort.label}
          style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.pillText, { color: colors.textSecondary }]}>{sort.label}</Text>
          {sort.showChevron && (
            <Feather name="chevron-down" size={14} color={colors.textSecondary} />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
});
