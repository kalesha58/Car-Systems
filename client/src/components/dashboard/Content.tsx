import { View, StyleSheet } from 'react-native';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CompactCategoryContainer from './CompactCategoryContainer';
import PromoBannerStrip from './PromoBannerStrip';
import TrustBadgeRow from './TrustBadgeRow';
import ContentSkeleton from './ContentSkeleton';
import PromoOfferCards from './PromoOfferCards';
import StoreCategorySectionEmpty from './StoreCategorySectionEmpty';
import { useTheme } from '@hooks/useTheme';
import { getDropdownOptions, type IDropdownCategoryOption } from '@service/dropdownService';
import type { StoreCategoryTile } from '../../types/category/ICategoryItem';

const tileGroupOrder = (a: IDropdownCategoryOption, b: IDropdownCategoryOption) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label);

const mapToTiles = (rows: IDropdownCategoryOption[]): StoreCategoryTile[] =>
  rows.map((c) => ({
    id: c.value,
    name: c.label,
    image: c.imageUrl && c.imageUrl.trim() !== '' ? { uri: c.imageUrl.trim() } : null,
  }));

/**
 * Build Store home rows from dropdown categories that have active inventory.
 * Only categories with activeProductCount > 0 and a tileGroup are shown.
 */
function buildStoreTileRows(all: IDropdownCategoryOption[]): {
  products: StoreCategoryTile[];
  vehicles: StoreCategoryTile[];
  services: StoreCategoryTile[];
} {
  const withInventory = all.filter((c) => (c.activeProductCount ?? 0) > 0);
  const sorted = [...withInventory].sort(tileGroupOrder);

  return {
    products: mapToTiles(sorted.filter((c) => c.tileGroup === 'products')),
    vehicles: mapToTiles(sorted.filter((c) => c.tileGroup === 'vehicles')),
    services: mapToTiles(sorted.filter((c) => c.tileGroup === 'services')),
  };
}

const Content: FC = () => {
  const { colors } = useTheme();
  const [dropdownCategories, setDropdownCategories] = useState<IDropdownCategoryOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getDropdownOptions(undefined, undefined, true);
        if (!cancelled) {
          setDropdownCategories(Array.isArray(data.categories) ? data.categories : []);
        }
      } catch {
        if (!cancelled) {
          setDropdownCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const styles = StyleSheet.create({
    canvas: {
      backgroundColor: colors.backgroundSecondary,
      paddingTop: 10,
      paddingBottom: 6,
    },
    card: {
      backgroundColor: colors.background,
      marginHorizontal: 12,
      marginBottom: 10,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    accentBar: {
      width: 3,
      height: 18,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginRight: 8,
    },
    promoPadding: {
      paddingHorizontal: 12,
      marginBottom: 10,
    },
  });

  const { products: productsCategories, vehicles: vehiclesCategories, services: servicesCategories } =
    useMemo(() => buildStoreTileRows(dropdownCategories), [dropdownCategories]);

  if (loading) {
    return <ContentSkeleton />;
  }

  return (
    <View style={styles.canvas}>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Product Categories
          </CustomText>
        </View>
        {productsCategories.length > 0 ? (
          <CompactCategoryContainer data={productsCategories} categoryType="products" />
        ) : (
          <StoreCategorySectionEmpty section="products" />
        )}
      </View>

      <View style={styles.promoPadding}>
        <PromoBannerStrip />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Vehicle Categories
          </CustomText>
        </View>
        {vehiclesCategories.length > 0 ? (
          <CompactCategoryContainer data={vehiclesCategories} categoryType="vehicles" />
        ) : (
          <StoreCategorySectionEmpty section="vehicles" />
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Service Categories
          </CustomText>
        </View>
        {servicesCategories.length > 0 ? (
          <CompactCategoryContainer data={servicesCategories} categoryType="services" />
        ) : (
          <StoreCategorySectionEmpty section="services" />
        )}
        <TrustBadgeRow />
      </View>

      <PromoOfferCards />

      <View style={{ height: 16 }} />

    </View>
  );
};
export default Content;
