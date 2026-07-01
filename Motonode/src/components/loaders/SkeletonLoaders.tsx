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

export function AddressListItemSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.addressCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton style={styles.addressIconPlaceholder} />
      <View style={styles.addressContentSkeleton}>
        <Skeleton style={styles.addressTitleLine} />
        <Skeleton style={styles.addressTextLine} />
        <Skeleton style={[styles.addressTextLine, { width: '80%' }]} />
      </View>
    </View>
  );
}

export function AddressListSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <AddressListItemSkeleton key={i} />
      ))}
    </View>
  );
}

export function ConversationCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.chatCardSkeleton, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <Skeleton style={styles.chatAvatarPlaceholder} />
      <View style={styles.chatContentSkeleton}>
        <View style={styles.chatHeaderRowSkeleton}>
          <Skeleton style={styles.chatNameLine} />
          <Skeleton style={styles.chatTimeLine} />
        </View>
        <Skeleton style={styles.chatMessageLine} />
      </View>
    </View>
  );
}

export function ConversationListSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ConversationCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function CommunityPostCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.communityCardSkeleton, { borderBottomColor: colors.border }]}>
      <View style={styles.communityHeaderSkeleton}>
        <Skeleton style={styles.communityAvatarPlaceholder} />
        <View style={styles.communityUserInfoSkeleton}>
          <Skeleton style={styles.communityNameLine} />
          <Skeleton style={styles.communitySubLine} />
        </View>
      </View>
      <Skeleton style={styles.communityImagePlaceholder} />
      <View style={styles.communityFooterSkeleton}>
        <View style={styles.row}>
          <Skeleton style={[styles.circleBtn, { width: 24, height: 24, marginRight: 12 }]} />
          <Skeleton style={[styles.circleBtn, { width: 24, height: 24, marginRight: 12 }]} />
          <Skeleton style={[styles.circleBtn, { width: 24, height: 24 }]} />
        </View>
        <Skeleton style={[styles.textLineShort, { width: '25%', marginTop: 12 }]} />
        <Skeleton style={[styles.textLineLong, { width: '85%', marginTop: 8 }]} />
      </View>
    </View>
  );
}

export function CommunityFeedSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      {[1, 2].map((i) => (
        <CommunityPostCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function UserSearchResultSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.userSearchRowSkeleton, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <Skeleton style={styles.userSearchAvatarPlaceholder} />
      <View style={styles.userSearchDetailsSkeleton}>
        <Skeleton style={styles.userSearchNameLine} />
        <Skeleton style={styles.userSearchSubLine} />
      </View>
      <Skeleton style={styles.userSearchIconPlaceholder} />
    </View>
  );
}

export function UserSearchListSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <UserSearchResultSkeleton key={i} />
      ))}
    </View>
  );
}

export function OrderTrackingSkeleton() {
  const colors = useColors();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.orderTrackingScroll}
    >
      <View style={styles.orderIdRowSkeleton}>
        <View style={styles.orderIdTextSkeleton}>
          <Skeleton style={styles.orderLabelLine} />
          <Skeleton style={styles.orderIdLine} />
          <Skeleton style={styles.orderDateLine} />
        </View>
        <Skeleton style={styles.copyBtnSkeleton} />
      </View>

      <View style={[styles.statusCardSkeleton, { borderColor: colors.border }]}>
        <View style={styles.statusInfoSkeleton}>
          <Skeleton style={styles.statusTitleLine} />
          <Skeleton style={styles.statusSubtitleLine} />
        </View>
        <Skeleton style={styles.statusIconSkeleton} />
      </View>

      <Skeleton style={styles.mapSkeleton} />

      <View style={[styles.timelineCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.timelineRowSkeleton}>
          {[1, 2, 3, 4, 5].map((i) => (
            <React.Fragment key={i}>
              <View style={styles.timelineStepSkeleton}>
                <Skeleton style={styles.timelineCircleSkeleton} />
                <Skeleton style={styles.timelineLabelSkeleton} />
              </View>
              {i < 5 && <Skeleton style={styles.timelineLineSkeleton} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={[styles.accordionCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.accordionTitleSkeleton} />
        <View style={styles.accordionBodySkeleton}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.orderItemRowSkeleton}>
              <Skeleton style={styles.orderItemThumbSkeleton} />
              <View style={styles.orderItemMetaSkeleton}>
                <Skeleton style={styles.orderItemNameSkeleton} />
                <Skeleton style={styles.orderItemQtySkeleton} />
              </View>
              <Skeleton style={styles.orderItemPriceSkeleton} />
            </View>
          ))}
          <Skeleton style={styles.orderTotalLineSkeleton} />
        </View>
      </View>
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
  addressCardSkeleton: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    width: '100%',
  },
  addressIconPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  addressContentSkeleton: {
    flex: 1,
    gap: 8,
    paddingTop: 4,
  },
  addressTitleLine: {
    height: 14,
    width: '35%',
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
  },
  addressTextLine: {
    height: 12,
    width: '90%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  chatCardSkeleton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    width: '100%',
  },
  chatAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
  },
  chatContentSkeleton: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  chatHeaderRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatNameLine: {
    height: 14,
    width: '40%',
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
  },
  chatTimeLine: {
    height: 10,
    width: '15%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  chatMessageLine: {
    height: 12,
    width: '75%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  communityCardSkeleton: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 16,
    width: '100%',
  },
  communityHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  communityAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  communityUserInfoSkeleton: {
    flex: 1,
    gap: 4,
  },
  communityNameLine: {
    height: 12,
    width: '30%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  communitySubLine: {
    height: 10,
    width: '20%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  communityImagePlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: '#E2E8F0',
  },
  communityFooterSkeleton: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  userSearchRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  userSearchAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  userSearchDetailsSkeleton: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  userSearchNameLine: {
    height: 12,
    width: '45%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  userSearchSubLine: {
    height: 10,
    width: '60%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  userSearchIconPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  orderTrackingScroll: {
    padding: 16,
    gap: 16,
    paddingTop: 70,
    paddingBottom: 24,
  },
  orderIdRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderIdTextSkeleton: {
    flex: 1,
    gap: 6,
  },
  orderLabelLine: {
    height: 10,
    width: 56,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  orderIdLine: {
    height: 16,
    width: '55%',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  orderDateLine: {
    height: 10,
    width: '40%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  copyBtnSkeleton: {
    width: 52,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  statusCardSkeleton: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statusInfoSkeleton: {
    flex: 1,
    gap: 8,
  },
  statusTitleLine: {
    height: 18,
    width: '45%',
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
  },
  statusSubtitleLine: {
    height: 12,
    width: '60%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  statusIconSkeleton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
  },
  mapSkeleton: {
    height: 220,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  timelineCardSkeleton: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  timelineRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineStepSkeleton: {
    alignItems: 'center',
    width: 60,
    gap: 6,
  },
  timelineCircleSkeleton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
  },
  timelineLabelSkeleton: {
    height: 8,
    width: 44,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  timelineLineSkeleton: {
    flex: 1,
    height: 2,
    marginTop: 10,
    borderRadius: 1,
    backgroundColor: '#E2E8F0',
  },
  accordionCardSkeleton: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  accordionTitleSkeleton: {
    height: 14,
    width: '40%',
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
  },
  accordionBodySkeleton: {
    gap: 12,
  },
  orderItemRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderItemThumbSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  orderItemMetaSkeleton: {
    flex: 1,
    gap: 6,
  },
  orderItemNameSkeleton: {
    height: 12,
    width: '70%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  orderItemQtySkeleton: {
    height: 10,
    width: '30%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  orderItemPriceSkeleton: {
    height: 12,
    width: 48,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  orderTotalLineSkeleton: {
    height: 14,
    width: '100%',
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
});
