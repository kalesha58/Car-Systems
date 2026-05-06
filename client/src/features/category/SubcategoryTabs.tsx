/**
 * SubcategoryTabs
 *
 * A horizontal scrollable tab bar that renders the second-level subcategories
 * for a given service section (e.g. Car Service → General Checkup | Oil Change | …).
 *
 * It is intentionally lightweight and mirrors the visual style of CategoryTabs.
 */
import React, {FC, useRef, useEffect} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import type {IServiceSubCategory} from '../../config/serviceCategoryConfig';

interface SubcategoryTabsProps {
  subcategories: IServiceSubCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const SubcategoryTabs: FC<SubcategoryTabsProps> = ({
  subcategories,
  selectedId,
  onSelect,
}) => {
  const {colors} = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const ALL_ID = '__all__';
  const tabs = [{id: ALL_ID, label: 'All'}, ...subcategories];

  // Auto-scroll selected tab into view
  const itemPositions = useRef<Record<number, number>>({});
  useEffect(() => {
    const idx = tabs.findIndex(t => t.id === (selectedId ?? ALL_ID));
    if (idx !== -1 && itemPositions.current[idx] !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({x: Math.max(0, itemPositions.current[idx] - 32), animated: true});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background, borderBottomColor: colors.border}]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {tabs.map((tab, index) => {
          const active = (selectedId ?? ALL_ID) === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.75}
              onPress={() => onSelect(tab.id === ALL_ID ? null : tab.id)}
              onLayout={e => {
                itemPositions.current[index] = e.nativeEvent.layout.x;
              }}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? Colors.secondary + '18' : colors.backgroundSecondary,
                  borderColor: active ? Colors.secondary : colors.border,
                },
              ]}>
              <CustomText
                fontSize={RFValue(10)}
                fontFamily={active ? Fonts.SemiBold : Fonts.Medium}
                numberOfLines={1}
                style={{color: active ? Colors.secondary : colors.text}}>
                {tab.label}
              </CustomText>
              {active && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
});

export default SubcategoryTabs;
