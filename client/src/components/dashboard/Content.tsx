import { View, StyleSheet } from 'react-native';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CompactCategoryContainer from './CompactCategoryContainer';
import PromoBannerStrip from './PromoBannerStrip';
import TrustBadgeRow from './TrustBadgeRow';
import ContentSkeleton from './ContentSkeleton';
import PromoOfferCards from './PromoOfferCards';
import { useTheme } from '@hooks/useTheme';
import { getDropdownOptions, type IDropdownCategoryOption } from '@service/dropdownService';
import { STATIC_CATEGORY_IMAGES } from '@config/storeCategoryImages';
import type { StoreCategoryTile } from '../../types/category/ICategoryItem';

const tileGroupOrder = (a: IDropdownCategoryOption, b: IDropdownCategoryOption) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label);

const mapToTiles = (rows: IDropdownCategoryOption[]): StoreCategoryTile[] =>
  rows.map((c) => ({
    id: c.value,
    name: c.label,
    // Prefer backend CDN URL; fall back to bundled static image
    image:
      c.imageUrl && c.imageUrl.trim() !== ''
        ? { uri: c.imageUrl }
        : (STATIC_CATEGORY_IMAGES[c.label] ?? null),
  }));

const isSparePartsLabel = (label: string) => /^spare\s*parts$/i.test(label.trim());

/**
 * Build Store home rows. Prefer `tileGroup` from API (seeded DB). If no category has
 * `tileGroup` (legacy Mongo data), partition all categories so tiles are not empty.
 * Orphan categories (no tileGroup) fill empty rows after tileGroup matches.
 */
function buildStoreTileRows(all: IDropdownCategoryOption[]): {
  products: StoreCategoryTile[];
  vehicles: StoreCategoryTile[];
  services: StoreCategoryTile[];
} {
  const sorted = [...all].sort(tileGroupOrder);
  const anyTileGroup = sorted.some((c) => !!c.tileGroup);

  const take = (rows: IDropdownCategoryOption[]) => mapToTiles(rows);

  if (!anyTileGroup) {
    const legacy = sorted.filter((c) => !isSparePartsLabel(c.label));
    return {
      products: take(legacy.slice(0, 4)),
      vehicles: take(legacy.slice(4, 9)),
      services: take(legacy.slice(9, 13)),
    };
  }

  let products = sorted.filter((c) => c.tileGroup === 'products');
  let vehicles = sorted.filter((c) => c.tileGroup === 'vehicles');
  let services = sorted.filter((c) => c.tileGroup === 'services');

  const used = new Set<string>([...products, ...vehicles, ...services].map((c) => c.value));
  const orphans = sorted.filter((c) => !c.tileGroup && !isSparePartsLabel(c.label) && !used.has(c.value));

  const fillIfEmpty = (
    row: IDropdownCategoryOption[],
    count: number,
    pool: IDropdownCategoryOption[],
  ): { row: IDropdownCategoryOption[]; pool: IDropdownCategoryOption[] } => {
    if (row.length > 0) {
      return { row, pool };
    }
    const next = pool.slice(0, count);
    const rest = pool.slice(count);
    next.forEach((c) => used.add(c.value));
    return { row: next, pool: rest };
  };

  let pool = orphans;
  ({ row: products, pool } = fillIfEmpty(products, 4, pool));
  ({ row: vehicles, pool } = fillIfEmpty(vehicles, 5, pool));
  ({ row: services, pool } = fillIfEmpty(services, 4, pool));

  return {
    products: take(products),
    vehicles: take(vehicles),
    services: take(services),
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
        const data = await getDropdownOptions();
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
    // ── Page canvas ───────────────────────────────────────────────────
    canvas: {
      backgroundColor: colors.backgroundSecondary, // #f5f6fb light / #1E1E1E dark
      paddingTop: 10,
      paddingBottom: 6,
    },
    // ── Floating section card ─────────────────────────────────────────
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
    // ── Section header with coloured accent bar ───────────────────────
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
    // ── Promo strip — sits on canvas between cards ────────────────────
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

      {/* ── Product Categories card ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Product Categories
          </CustomText>
        </View>
        <CompactCategoryContainer data={productsCategories} categoryType="products" />
      </View>

      {/* ── Promo Banner Strip (on canvas, no card wrapper) ── */}
      <View style={styles.promoPadding}>
        <PromoBannerStrip />
      </View>

      {/* ── Vehicle Categories card ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Vehicle Categories
          </CustomText>
        </View>
        <CompactCategoryContainer data={vehiclesCategories} categoryType="vehicles" />
      </View>

      {/* ── Service Categories card ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Service Categories
          </CustomText>
        </View>
        <CompactCategoryContainer data={servicesCategories} categoryType="services" />
        <TrustBadgeRow />
      </View>
      {/* ── Promotional Offers + How It Works ── */}
      <PromoOfferCards />

      {/* bottom breathing room */}
      <View style={{height: 16}} />

    </View>
  );
};
export default Content;

