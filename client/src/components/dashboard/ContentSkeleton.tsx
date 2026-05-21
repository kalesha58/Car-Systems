/**
 * ContentSkeleton
 *
 * Mirrors the exact layout of Content.tsx while categories are loading:
 *   - 3 section cards (Product, Vehicle, Service) — each with 4 tile placeholders
 *   - A banner strip placeholder between Product and Vehicle cards
 *   - A trust badge row placeholder inside the Service card
 *
 * Uses the existing SkeletonLoader (animated pulse) so the look is consistent
 * with every other skeleton in the app.
 */
import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import {useTheme} from '@hooks/useTheme';

// ── Single tile skeleton: image box + two label lines ──────────────────────
const TileSkeleton: FC = () => {
  const {colors} = useTheme();
  return (
    <View style={{width: '23%', alignItems: 'center'}}>
      <SkeletonLoader
        width="100%"
        height={72}
        borderRadius={10}
        style={{marginBottom: 6, backgroundColor: colors.border}}
      />
      <SkeletonLoader width="80%" height={10} borderRadius={4} style={{marginBottom: 3}} />
      <SkeletonLoader width="60%" height={10} borderRadius={4} />
    </View>
  );
};

// ── A row of 4 tile skeletons ───────────────────────────────────────────────
const TileRowSkeleton: FC = () => (
  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14}}>
    {[0, 1, 2, 3].map(i => (
      <TileSkeleton key={i} />
    ))}
  </View>
);

// ── Section card: header accent + title + tile rows ────────────────────────
interface SectionCardSkeletonProps {
  tileRows?: number;
  /** Extra content below tiles (e.g. trust badges) */
  footer?: React.ReactNode;
}
const SectionCardSkeleton: FC<SectionCardSkeletonProps> = ({tileRows = 1, footer}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      marginHorizontal: 12,
      marginBottom: 10,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    accentBar: {
      width: 3,
      height: 18,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginRight: 8,
    },
  });

  return (
    <View style={styles.card}>
      {/* Section header: accent bar + title placeholder */}
      <View style={styles.header}>
        <View style={styles.accentBar} />
        <SkeletonLoader width={130} height={14} borderRadius={6} />
      </View>

      {/* Tile rows */}
      {Array.from({length: tileRows}).map((_, i) => (
        <TileRowSkeleton key={i} />
      ))}

      {footer}
    </View>
  );
};

// ── Banner strip placeholder ────────────────────────────────────────────────
const BannerSkeleton: FC = () => {
  const {colors} = useTheme();
  return (
    <View style={{paddingHorizontal: 12, marginBottom: 10}}>
      <SkeletonLoader
        width="100%"
        height={112}
        borderRadius={18}
        style={{backgroundColor: colors.border}}
      />
      {/* Pager dots */}
      <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 5}}>
        <SkeletonLoader width={20} height={6} borderRadius={3} />
        <SkeletonLoader width={6} height={6} borderRadius={3} />
        <SkeletonLoader width={6} height={6} borderRadius={3} />
      </View>
    </View>
  );
};

// ── Trust badge row placeholder ─────────────────────────────────────────────
const TrustBadgeSkeleton: FC = () => {
  const {colors} = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 10,
        marginTop: 6,
        marginBottom: 8,
      }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{alignItems: 'center', flex: 1}}>
          <SkeletonLoader width={38} height={38} borderRadius={19} style={{marginBottom: 7}} />
          <SkeletonLoader width="70%" height={10} borderRadius={4} style={{marginBottom: 3}} />
          <SkeletonLoader width="50%" height={10} borderRadius={4} />
        </View>
      ))}
    </View>
  );
};

// ── Full dashboard skeleton ─────────────────────────────────────────────────
const ContentSkeleton: FC = () => {
  const {colors} = useTheme();

  return (
    <View style={{backgroundColor: colors.backgroundSecondary, paddingTop: 10, paddingBottom: 6}}>
      {/* Product Categories card */}
      <SectionCardSkeleton tileRows={1} />

      {/* Promo banner strip */}
      <BannerSkeleton />

      {/* Vehicle Categories card — 2 rows (5 tiles) */}
      <SectionCardSkeleton tileRows={2} />

      {/* Service Categories card + trust badges */}
      <SectionCardSkeleton tileRows={1} footer={<TrustBadgeSkeleton />} />

      {/* Promo offer cards (2 side-by-side) + How It Works card */}
      <View style={{marginHorizontal: 12, marginBottom: 10}}>
        {/* Two offer card placeholders */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
          {[0, 1].map(i => (
            <View
              key={i}
              style={{
                width: '48.5%',
                borderRadius: 16,
                backgroundColor: colors.backgroundSecondary,
                padding: 14,
              }}>
              <SkeletonLoader width={36} height={36} borderRadius={18} style={{marginBottom: 10}} />
              <SkeletonLoader width="80%" height={12} borderRadius={4} style={{marginBottom: 6}} />
              <SkeletonLoader width="100%" height={10} borderRadius={4} style={{marginBottom: 4}} />
              <SkeletonLoader width="60%" height={10} borderRadius={4} style={{marginBottom: 12}} />
              <SkeletonLoader width={60} height={10} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* How It Works card placeholder */}
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 14,
          }}>
          {/* Header */}
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 14}}>
            <View
              style={{
                width: 3,
                height: 18,
                borderRadius: 2,
                backgroundColor: colors.border,
                marginRight: 8,
              }}
            />
            <SkeletonLoader width={120} height={14} borderRadius={6} />
          </View>
          {/* 3 step circles */}
          <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start'}}>
            {[0, 1, 2].map((_, i) => (
              <React.Fragment key={i}>
                <View style={{alignItems: 'center', flex: 1}}>
                  <SkeletonLoader width={48} height={48} borderRadius={24} style={{marginBottom: 8}} />
                  <SkeletonLoader width="70%" height={10} borderRadius={4} style={{marginBottom: 3}} />
                  <SkeletonLoader width="55%" height={10} borderRadius={4} />
                </View>
                {i < 2 && (
                  <View
                    style={{
                      width: 24,
                      height: 2,
                      backgroundColor: colors.border,
                      marginTop: 22,
                      opacity: 0.4,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>

      <View style={{height: 16}} />
    </View>
  );
};

export default ContentSkeleton;
