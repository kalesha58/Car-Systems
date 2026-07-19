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

export function DealerDashboardSkeleton() {
  const colors = useColors();

  return (
    <View style={styles.dealerDashboardSkeleton}>
      <Skeleton style={styles.dealerBannerSkeleton} />

      <View style={[styles.dealerHeroSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.dealerHeroTopSkeleton}>
          <View style={styles.dealerHeroLeftSkeleton}>
            <Skeleton style={styles.dealerEyebrowSkeleton} />
            <Skeleton style={styles.dealerRevenueSkeleton} />
            <Skeleton style={styles.dealerTrendSkeleton} />
          </View>
          <Skeleton style={styles.dealerIllustrationSkeleton} />
        </View>
        <View style={[styles.dealerHeroStatsSkeleton, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.dealerHeroStatItemSkeleton}>
              <Skeleton style={styles.dealerHeroStatValueSkeleton} />
              <Skeleton style={styles.dealerHeroStatLabelSkeleton} />
            </View>
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealerChipRowSkeleton}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.dealerChipSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton style={styles.dealerChipIconSkeleton} />
            <View style={styles.dealerChipTextSkeleton}>
              <Skeleton style={styles.dealerChipValueSkeleton} />
              <Skeleton style={styles.dealerChipLabelSkeleton} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.dealerPanelSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.dealerSectionTitleSkeleton} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealerActionsSkeleton}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.dealerActionCellSkeleton}>
              <Skeleton style={styles.dealerActionIconSkeleton} />
              <Skeleton style={styles.dealerActionLabelSkeleton} />
            </View>
          ))}
        </ScrollView>
      </View>

      <Skeleton style={styles.dealerSectionTitleSkeleton} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealerStatsRowSkeleton}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[styles.dealerStatCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton style={styles.dealerStatIconSkeleton} />
            <Skeleton style={styles.dealerStatValueSkeleton} />
            <Skeleton style={styles.dealerStatLabelSkeleton} />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.dealerAlertSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.dealerAlertLeftSkeleton}>
          <Skeleton style={styles.dealerAlertIconSkeleton} />
          <View style={styles.dealerAlertTextSkeleton}>
            <Skeleton style={styles.dealerAlertTitleSkeleton} />
            <Skeleton style={styles.dealerAlertSubtitleSkeleton} />
          </View>
        </View>
        <Skeleton style={styles.dealerAlertBtnSkeleton} />
      </View>
    </View>
  );
}

export function DealerOrderDetailSkeleton() {
  const colors = useColors();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.dealerOrderDetailScroll}
    >
      <View style={[styles.dealerDetailStatusHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.dealerDetailStatusIcon} />
        <View style={styles.dealerDetailStatusTexts}>
          <Skeleton style={styles.dealerDetailStatusLabel} />
          <Skeleton style={styles.dealerDetailStatusValue} />
        </View>
        <Skeleton style={styles.dealerDetailPaymentPill} />
      </View>

      <View style={[styles.timelineCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.dealerDetailPlacedLine} />
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

      <View style={[styles.dealerDetailCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.accordionTitleSkeleton} />
        <View style={styles.dealerDetailInvoiceActions}>
          <Skeleton style={styles.dealerDetailInvoiceBtn} />
          <Skeleton style={styles.dealerDetailInvoiceBtn} />
        </View>
      </View>

      <View style={[styles.dealerDetailCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.accordionTitleSkeleton} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.dealerDetailInfoRow}>
            <Skeleton style={styles.dealerDetailInfoIcon} />
            <View style={styles.dealerDetailInfoTexts}>
              <Skeleton style={styles.dealerDetailInfoLabel} />
              <Skeleton style={styles.dealerDetailInfoValue} />
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.dealerDetailCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.accordionTitleSkeleton} />
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
    </ScrollView>
  );
}

export function DealerBankSkeleton() {
  const colors = useColors();

  return (
    <View style={styles.dealerBankSkeleton}>
      <Skeleton style={styles.dealerBankBannerSkeleton} />

      <View style={[styles.dealerBankCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.dealerBankCardHeaderSkeleton}>
          <Skeleton style={styles.dealerBankCardTitleSkeleton} />
          <Skeleton style={styles.dealerBankActionSkeleton} />
        </View>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.dealerBankFieldRowSkeleton}>
            <Skeleton style={styles.dealerBankFieldLabelSkeleton} />
            <Skeleton style={styles.dealerBankFieldValueSkeleton} />
          </View>
        ))}
      </View>

      <View style={[styles.dealerBankCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.dealerBankCardHeaderSkeleton}>
          <Skeleton style={styles.dealerBankCardTitleSkeleton} />
          <Skeleton style={styles.dealerBankActionSkeleton} />
        </View>
        {[1, 2].map((i) => (
          <View key={i} style={styles.dealerBankUpiRowSkeleton}>
            <Skeleton style={styles.dealerBankUpiAvatarSkeleton} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton style={styles.dealerBankUpiIdSkeleton} />
              <Skeleton style={styles.dealerBankUpiMetaSkeleton} />
            </View>
            <Skeleton style={styles.dealerBankUpiBadgeSkeleton} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function DriveListSkeleton() {
  const colors = useColors();

  return (
    <View style={styles.driveListSkeleton}>
      <View style={[styles.driveHintSkeleton, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Skeleton style={styles.driveHintIconSkeleton} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton style={styles.driveHintTitleSkeleton} />
          <Skeleton style={styles.driveHintSubSkeleton} />
        </View>
      </View>
      <GarageBookingsListSkeleton />
    </View>
  );
}

export function DealerBusinessDetailsSkeleton() {
  const colors = useColors();

  return (
    <View style={styles.dealerBusinessSkeleton}>
      {[1, 2, 3].map((section) => (
        <View
          key={section}
          style={[styles.dealerBusinessCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Skeleton style={styles.dealerBusinessSectionTitleSkeleton} />
          {[1, 2, 3, 4].map((row) => (
            <View key={row} style={styles.dealerBusinessFieldRowSkeleton}>
              <Skeleton style={styles.dealerBusinessFieldLabelSkeleton} />
              <Skeleton style={styles.dealerBusinessFieldValueSkeleton} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function GarageVehicleCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.garageVehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton style={styles.garageVehicleImage} />
      <View style={styles.garageVehicleInfo}>
        <View style={styles.garageVehicleHeaderRow}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton style={styles.garageVehicleTitle} />
            <Skeleton style={styles.garageVehiclePlate} />
          </View>
          <Skeleton style={styles.garageYearBadge} />
        </View>
        <Skeleton style={styles.garageDivider} />
        <Skeleton style={styles.garageStatLine} />
        <Skeleton style={[styles.garageStatLine, { width: '55%', marginTop: 8 }]} />
        <View style={styles.garageActionsRow}>
          <Skeleton style={styles.garageActionBtnPrimary} />
          <Skeleton style={styles.garageActionBtn} />
          <Skeleton style={styles.garageActionBtn} />
        </View>
      </View>
    </View>
  );
}

export function GarageVehiclesListSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      {[1, 2].map((i) => (
        <GarageVehicleCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function GarageBookingCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.garageBookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.garageBookingTopRow}>
        <Skeleton style={styles.garageBookingBadge} />
        <Skeleton style={styles.garageBookingId} />
      </View>
      <View style={styles.garageBookingBody}>
        <Skeleton style={styles.garageBookingThumb} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton style={styles.garageBookingTitle} />
          <Skeleton style={styles.garageBookingMeta} />
          <Skeleton style={[styles.garageBookingMeta, { width: '70%' }]} />
          <Skeleton style={[styles.garageBookingMeta, { width: '85%' }]} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Skeleton style={styles.garageBookingPrice} />
          <Skeleton style={styles.garageBookingView} />
        </View>
      </View>
      <Skeleton style={styles.garageBookingStepper} />
      <Skeleton style={styles.garageBookingFooter} />
    </View>
  );
}

export function GarageBookingsListSkeleton() {
  return (
    <View style={{ gap: 14, paddingTop: 4 }}>
      {[1, 2, 3].map((i) => (
        <GarageBookingCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function GarageOrderCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.garageOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton style={styles.garageOrderAccent} />
      <View style={styles.garageOrderContent}>
        <View style={styles.garageOrderHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton style={styles.garageOrderId} />
            <Skeleton style={styles.garageOrderDate} />
          </View>
          <Skeleton style={styles.garageOrderBadge} />
        </View>
        <View style={[styles.garageOrderBody, { backgroundColor: colors.surfaceSecondary }]}>
          <Skeleton style={styles.garageOrderThumb} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton style={styles.garageOrderItem} />
            <Skeleton style={[styles.garageOrderItem, { width: '45%' }]} />
            <Skeleton style={styles.garageOrderTotal} />
          </View>
        </View>
        <Skeleton style={styles.garageOrderStatusLine} />
        <View style={styles.garageOrderFooter}>
          <Skeleton style={styles.garageOrderTrackBtn} />
          <Skeleton style={[styles.garageOrderTrackBtn, { flex: 1.2 }]} />
        </View>
      </View>
    </View>
  );
}

export function GarageOrdersListSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <GarageOrderCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function GarageVehicleDetailSkeleton() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Skeleton style={styles.garageDetailHero} />
      <View style={[styles.garageDetailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton style={styles.garageVehicleTitle} />
        <Skeleton style={[styles.garageVehiclePlate, { marginTop: 8 }]} />
        <View style={[styles.garageActionsRow, { marginTop: 16 }]}>
          <Skeleton style={styles.garageActionBtnPrimary} />
          <Skeleton style={styles.garageActionBtn} />
        </View>
      </View>
      <View style={[styles.garageDetailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.garageDetailRow}>
            <Skeleton style={styles.garageDetailIcon} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton style={styles.garageStatLine} />
              <Skeleton style={[styles.garageStatLine, { width: '45%' }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
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
  dealerDashboardSkeleton: {
    gap: 14,
  },
  dealerBannerSkeleton: {
    height: 132,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  dealerHeroSkeleton: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  dealerHeroTopSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dealerHeroLeftSkeleton: {
    flex: 1,
    gap: 8,
  },
  dealerEyebrowSkeleton: {
    height: 12,
    width: '40%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  dealerRevenueSkeleton: {
    height: 32,
    width: '55%',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  dealerTrendSkeleton: {
    height: 28,
    width: '85%',
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  dealerIllustrationSkeleton: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  dealerHeroStatsSkeleton: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  dealerHeroStatItemSkeleton: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dealerHeroStatValueSkeleton: {
    height: 18,
    width: 28,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  dealerHeroStatLabelSkeleton: {
    height: 10,
    width: 48,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerChipRowSkeleton: {
    gap: 10,
    paddingRight: 4,
  },
  dealerChipSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 130,
  },
  dealerChipIconSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  dealerChipTextSkeleton: {
    gap: 6,
  },
  dealerChipValueSkeleton: {
    height: 14,
    width: 36,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
  },
  dealerChipLabelSkeleton: {
    height: 10,
    width: 64,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerPanelSkeleton: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  dealerSectionTitleSkeleton: {
    height: 14,
    width: 120,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
  },
  dealerActionsSkeleton: {
    gap: 14,
    paddingTop: 4,
  },
  dealerActionCellSkeleton: {
    alignItems: 'center',
    width: 72,
    gap: 8,
  },
  dealerActionIconSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  dealerActionLabelSkeleton: {
    height: 10,
    width: 56,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerStatsRowSkeleton: {
    gap: 10,
    paddingRight: 4,
  },
  dealerStatCardSkeleton: {
    width: 108,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  dealerStatIconSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  dealerStatValueSkeleton: {
    height: 16,
    width: 40,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  dealerStatLabelSkeleton: {
    height: 10,
    width: 56,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerAlertSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  dealerAlertLeftSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dealerAlertIconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  dealerAlertTextSkeleton: {
    flex: 1,
    gap: 6,
  },
  dealerAlertTitleSkeleton: {
    height: 12,
    width: '75%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  dealerAlertSubtitleSkeleton: {
    height: 10,
    width: '90%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerAlertBtnSkeleton: {
    width: 96,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  dealerOrderDetailScroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 120,
  },
  dealerDetailStatusHero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  dealerDetailStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  dealerDetailStatusTexts: {
    flex: 1,
    gap: 6,
  },
  dealerDetailStatusLabel: {
    height: 10,
    width: 72,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerDetailStatusValue: {
    height: 18,
    width: '50%',
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
  },
  dealerDetailPaymentPill: {
    width: 72,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  dealerDetailPlacedLine: {
    height: 10,
    width: '45%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  dealerDetailCardSkeleton: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  dealerDetailInvoiceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dealerDetailInvoiceBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  dealerDetailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dealerDetailInfoIcon: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dealerDetailInfoTexts: {
    flex: 1,
    gap: 5,
  },
  dealerDetailInfoLabel: {
    height: 9,
    width: 48,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerDetailInfoValue: {
    height: 12,
    width: '70%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageVehicleCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  garageVehicleImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E2E8F0',
  },
  garageVehicleInfo: {
    padding: 16,
  },
  garageVehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  garageVehicleTitle: {
    height: 16,
    width: '55%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageVehiclePlate: {
    height: 12,
    width: '35%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageYearBadge: {
    height: 24,
    width: 48,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  garageDivider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
    backgroundColor: '#E2E8F0',
  },
  garageStatLine: {
    height: 12,
    width: '70%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  garageActionBtnPrimary: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  garageActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  garageBookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  garageBookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  garageBookingBadge: {
    height: 22,
    width: 80,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  garageBookingId: {
    height: 10,
    width: 110,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  garageBookingBody: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  garageBookingThumb: {
    width: 72,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  garageBookingTitle: {
    height: 14,
    width: '90%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageBookingMeta: {
    height: 11,
    width: '100%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  garageBookingPrice: {
    height: 14,
    width: 52,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageBookingView: {
    height: 11,
    width: 70,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  garageBookingStepper: {
    height: 36,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  garageBookingFooter: {
    height: 40,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  garageOrderCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  garageOrderAccent: {
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  garageOrderContent: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  garageOrderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  garageOrderId: {
    height: 15,
    width: '55%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageOrderDate: {
    height: 12,
    width: '40%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageOrderBadge: {
    height: 24,
    width: 88,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  garageOrderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 10,
  },
  garageOrderThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  garageOrderItem: {
    height: 13,
    width: '75%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageOrderStatusLine: {
    height: 12,
    width: '65%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageOrderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    gap: 8,
  },
  garageOrderTotal: {
    height: 16,
    width: 72,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  garageOrderTrackBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  garageDetailHero: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  garageDetailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  garageDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  garageDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  dealerBankSkeleton: {
    padding: 16,
    gap: 14,
  },
  dealerBankBannerSkeleton: {
    width: '100%',
    height: 84,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  dealerBankCardSkeleton: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  dealerBankCardHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dealerBankCardTitleSkeleton: {
    width: 140,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  dealerBankActionSkeleton: {
    width: 64,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  dealerBankFieldRowSkeleton: {
    gap: 6,
  },
  dealerBankFieldLabelSkeleton: {
    width: 88,
    height: 11,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerBankFieldValueSkeleton: {
    width: '70%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  dealerBankUpiRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dealerBankUpiAvatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  dealerBankUpiIdSkeleton: {
    width: '75%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  dealerBankUpiMetaSkeleton: {
    width: '45%',
    height: 11,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerBankUpiBadgeSkeleton: {
    width: 56,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
  },
  driveListSkeleton: {
    padding: 16,
    gap: 14,
  },
  driveHintSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  driveHintIconSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  driveHintTitleSkeleton: {
    width: '80%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  driveHintSubSkeleton: {
    width: '65%',
    height: 11,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerBusinessSkeleton: {
    padding: 16,
    gap: 14,
  },
  dealerBusinessCardSkeleton: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  dealerBusinessSectionTitleSkeleton: {
    width: 160,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginBottom: 4,
  },
  dealerBusinessFieldRowSkeleton: {
    gap: 6,
  },
  dealerBusinessFieldLabelSkeleton: {
    width: 100,
    height: 11,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dealerBusinessFieldValueSkeleton: {
    width: '85%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
});
