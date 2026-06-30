import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@hooks/useColors';

export function Skeleton({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[{ opacity }, style]} />;
}

export function ProductCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton style={styles.imagePlaceholder} />
      <View style={styles.info}>
        <Skeleton style={styles.textLineShort} />
        <Skeleton style={styles.textLineLong} />
        <Skeleton style={[styles.textLineShort, { marginTop: 10 }]} />
      </View>
    </View>
  );
}

export function VehicleCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton style={styles.vehicleImagePlaceholder} />
      <View style={styles.vehicleInfo}>
        <Skeleton style={styles.textLineShort} />
        <Skeleton style={styles.textLineLong} />
        <View style={styles.row}>
          <Skeleton style={[styles.tagPlaceholder, { marginRight: 6 }]} />
          <Skeleton style={styles.tagPlaceholder} />
        </View>
        <Skeleton style={[styles.textLineShort, { marginTop: 12 }]} />
      </View>
    </View>
  );
}

export function ServiceCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton style={styles.vehicleImagePlaceholder} />
      <View style={styles.vehicleInfo}>
        <Skeleton style={styles.textLineShort} />
        <Skeleton style={styles.textLineLong} />
        <Skeleton style={[styles.textLineLong, { marginTop: 10 }]} />
      </View>
    </View>
  );
}

export function ProductsGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.gridItem}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export function VehiclesListSkeleton() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </ScrollView>
  );
}

export function ServicesListSkeleton() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </ScrollView>
  );
}

export function ProductDetailSkeleton() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header bar placeholder */}
      <View style={styles.detailHeader}>
        <Skeleton style={styles.circleBtn} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton style={styles.circleBtn} />
          <Skeleton style={styles.circleBtn} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Large image placeholder */}
        <Skeleton style={styles.detailImage} />

        {/* Brand & Title */}
        <Skeleton style={styles.textLineShort} />
        <Skeleton style={styles.textLineLong} />

        {/* Rating row */}
        <Skeleton style={[styles.textLineShort, { width: '35%' }]} />

        {/* Price block */}
        <Skeleton style={[styles.textLineShort, { width: '25%', height: 24 }]} />

        {/* Description blocks */}
        <Skeleton style={styles.textLineLong} />
        <Skeleton style={styles.textLineLong} />
        <Skeleton style={styles.textLineShort} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.detailBottomBar, { borderTopColor: colors.border }]}>
        <Skeleton style={styles.bottomBarBtn} />
      </View>
    </View>
  );
}

export function ServiceDetailSkeleton() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header bar placeholder */}
      <View style={styles.detailHeader}>
        <Skeleton style={styles.circleBtn} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Skeleton style={styles.detailImage} />
        <Skeleton style={styles.textLineLong} />
        <Skeleton style={[styles.textLineShort, { width: '40%' }]} />
        <Skeleton style={[styles.textLineShort, { width: '25%', height: 24 }]} />
        
        {/* Separator / Specs placeholder */}
        <View style={{ gap: 8, marginTop: 10 }}>
          <Skeleton style={styles.textLineLong} />
          <Skeleton style={styles.textLineLong} />
          <Skeleton style={styles.textLineShort} />
        </View>
      </ScrollView>

      <View style={[styles.detailBottomBar, { borderTopColor: colors.border }]}>
        <Skeleton style={styles.bottomBarBtn} />
      </View>
    </View>
  );
}

export function VehicleDetailSkeleton() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.detailHeader}>
        <Skeleton style={styles.circleBtn} />
        <Skeleton style={styles.circleBtn} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Skeleton style={styles.detailImage} />
        <Skeleton style={styles.textLineShort} />
        <Skeleton style={styles.textLineLong} />
        <Skeleton style={[styles.textLineShort, { width: '30%', height: 24 }]} />

        {/* Specs Grid placeholder */}
        <View style={styles.specsGridPlaceholder}>
          <Skeleton style={styles.gridSpecBox} />
          <Skeleton style={styles.gridSpecBox} />
          <Skeleton style={styles.gridSpecBox} />
          <Skeleton style={styles.gridSpecBox} />
        </View>
      </ScrollView>

      <View style={[styles.detailBottomBar, { borderTopColor: colors.border }]}>
        <Skeleton style={styles.bottomBarBtn} />
      </View>
    </View>
  );
}

export function DealerStoreSkeleton() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header bar placeholder */}
      <View style={styles.detailHeader}>
        <Skeleton style={styles.circleBtn} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton style={styles.circleBtn} />
          <Skeleton style={styles.circleBtn} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16 }}>
        {/* Large shopfront banner placeholder */}
        <Skeleton style={{ width: '100%', height: 200 }} />

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          {/* Circular Stats Row Placeholder */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6, width: '22%' }}>
                <Skeleton style={styles.circleBtn} />
                <Skeleton style={styles.textLineShort} />
              </View>
            ))}
          </View>

          {/* Tabs row placeholder */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, gap: 20, marginTop: 10 }}>
            <Skeleton style={{ width: 60, height: 16, borderRadius: 8 }} />
            <Skeleton style={{ width: 60, height: 16, borderRadius: 8 }} />
            <Skeleton style={{ width: 60, height: 16, borderRadius: 8 }} />
          </View>

          {/* Grid of products */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            {[1, 2].map((i) => (
              <View key={i} style={{ width: '48%' }}>
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function HorizontalProductsSkeleton() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ width: 150 }}>
          <ProductCardSkeleton />
        </View>
      ))}
    </ScrollView>
  );
}

export function HorizontalVehiclesSkeleton() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
      {[1, 2].map((i) => (
        <View key={i} style={{ width: 200 }}>
          <VehicleCardSkeleton />
        </View>
      ))}
    </ScrollView>
  );
}

export function HorizontalServicesSkeleton() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
      {[1, 2].map((i) => (
        <View key={i} style={{ width: 200 }}>
          <ServiceCardSkeleton />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
  },
  imagePlaceholder: {
    height: 155,
    backgroundColor: '#E2E8F0',
  },
  info: {
    padding: 12,
    gap: 6,
  },
  textLineShort: {
    height: 12,
    width: '50%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  textLineLong: {
    height: 12,
    width: '85%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  tagPlaceholder: {
    height: 18,
    width: 50,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
  },
  vehicleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
  },
  vehicleImagePlaceholder: {
    height: 130,
    backgroundColor: '#E2E8F0',
  },
  vehicleInfo: {
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  gridItem: {
    width: '48%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    height: 90,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  detailImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  detailBottomBar: {
    height: 80,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  bottomBarBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  specsGridPlaceholder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  gridSpecBox: {
    width: '47%',
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
});
