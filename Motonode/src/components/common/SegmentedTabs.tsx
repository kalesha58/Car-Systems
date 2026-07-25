import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@hooks/useColors';

export interface SegmentedTab {
  label: string;
  key: string;
}

interface SegmentedTabsProps {
  tabs: readonly SegmentedTab[];
  activeTab: number;
  onTabChange: (index: number) => void;
  counts: Record<string, number>;
}

export function SegmentedTabs({ tabs, activeTab, onTabChange, counts }: SegmentedTabsProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab, i) => {
          const isActive = activeTab === i;
          const count = counts[tab.key] ?? 0;

          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && { backgroundColor: colors.card }]}
              onPress={() => onTabChange(i)}
            >
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    isActive
                      ? { color: colors.textPrimary, fontFamily: 'Inter_700Bold' }
                      : { color: colors.textSecondary, fontFamily: 'Inter_500Medium' },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.badge,
                    isActive
                      ? { backgroundColor: colors.background }
                      : { backgroundColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isActive
                        ? { color: colors.textPrimary }
                        : { color: colors.textSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </View>
              {isActive && (
                <View style={[styles.indicator, { backgroundColor: colors.textPrimary }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    flexGrow: 1,
  },
  tab: {
    flex: 1,
    minWidth: 88,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  indicator: {
    height: 2,
    borderRadius: 1,
    marginHorizontal: 8,
    marginBottom: 4,
  },
});
