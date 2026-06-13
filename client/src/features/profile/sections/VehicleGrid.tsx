import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React, {FC} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import { Fonts, fontStyle } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import {IUserVehicle} from '../../../types/vehicle/IVehicle';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import {shouldHideVehicleNumber, maskVehicleNumber} from '@utils/privacyUtils';

interface VehicleGridProps {
  vehicles: IUserVehicle[];
  loading?: boolean;
  refreshing?: boolean;
  onVehiclePress?: (vehicle: IUserVehicle) => void;
}

const HAIR = StyleSheet.hairlineWidth;

function vehicleThumbnailUri(item: IUserVehicle): string | null {
  if (item.images && item.images.length > 0) {
    return item.images[0];
  }
  const legacy = (item as {image?: string}).image;
  return legacy ?? null;
}

const VehicleGrid: FC<VehicleGridProps> = ({
  vehicles,
  loading = false,
  onVehiclePress,
}) => {
  const {colors} = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const colW = screenWidth / 3;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: screenWidth,
    },
    vehicleItem: {
      width: colW,
      aspectRatio: 1,
      backgroundColor: colors.cardBackground,
      overflow: 'hidden',
      borderRightWidth: HAIR,
      borderBottomWidth: HAIR,
      borderColor: colors.border,
    },
    vehicleItemLastCol: {
      borderRightWidth: 0,
    },
    vehicleImage: {
      width: '100%',
      height: '100%',
    },
    vehicleOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.58)',
      paddingVertical: 6,
      paddingHorizontal: 6,
    },
    vehicleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vehicleText: {
      fontSize: RFValue(8.5),
      ...fontStyle(Fonts.Bold),
      color: '#fff',
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 56,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: RFValue(16),
      ...fontStyle(Fonts.SemiBold),
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: RFValue(13),
      ...fontStyle(Fonts.Regular),
      color: colors.textSecondary,
      textAlign: 'center',
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: screenWidth,
    },
    skeletonItem: {
      width: colW,
      aspectRatio: 1,
      backgroundColor: colors.cardBackground,
      borderRightWidth: HAIR,
      borderBottomWidth: HAIR,
      borderColor: colors.border,
      position: 'relative',
    },
    skeletonLastCol: {
      borderRightWidth: 0,
    },
    skeletonOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: 8,
    },
  });

  const renderVehicleItem = (item: IUserVehicle, index: number) => {
    const firstImage = vehicleThumbnailUri(item);
    const isLastCol = index % 3 === 2;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.vehicleItem, isLastCol && styles.vehicleItemLastCol]}
        onPress={() => onVehiclePress?.(item)}
        activeOpacity={0.85}>
        {firstImage ? (
          <>
            <Image source={{uri: firstImage}} style={styles.vehicleImage} resizeMode="cover" />
            <View style={styles.vehicleOverlay}>
              <View style={styles.vehicleInfo}>
                <CustomText style={styles.vehicleText} numberOfLines={1}>
                  {item.brand} {item.model}
                </CustomText>
              </View>
              {item.numberPlate && !shouldHideVehicleNumber() && (
                <CustomText style={[styles.vehicleText, {fontSize: RFValue(9), marginTop: 2}]} numberOfLines={1}>
                  {maskVehicleNumber(item.numberPlate)}
                </CustomText>
              )}
            </View>
          </>
        ) : (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8}}>
            <CustomText style={{color: colors.textSecondary, fontSize: RFValue(12), textAlign: 'center'}}>
              {item.brand} {item.model}
            </CustomText>
            {item.numberPlate && !shouldHideVehicleNumber() && (
              <CustomText style={{color: colors.textSecondary, fontSize: RFValue(10), marginTop: 4}}>
                {maskVehicleNumber(item.numberPlate)}
              </CustomText>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CustomText style={{fontSize: RFValue(48), color: colors.textSecondary, marginBottom: 12}}>
        🚗
      </CustomText>
      <CustomText style={styles.emptyTitle}>No Vehicles Yet</CustomText>
      <CustomText style={styles.emptyText}>
        When you add vehicles, they'll appear here.
      </CustomText>
    </View>
  );

  if (loading) {
    const skeletonCount = 9;
    return (
      <View style={styles.container}>
        <View style={styles.skeletonGrid}>
          {Array.from({length: skeletonCount}, (_, index) => (
            <View
              key={`skeleton-${index}`}
              style={[styles.skeletonItem, index % 3 === 2 && styles.skeletonLastCol]}>
              <SkeletonLoader width="100%" height="100%" borderRadius={0} />
              <View style={styles.skeletonOverlay}>
                <SkeletonLoader width="70%" height={12} borderRadius={0} style={{marginBottom: 4}} />
                <SkeletonLoader width="50%" height={10} borderRadius={0} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (vehicles.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>{vehicles.map((item, index) => renderVehicleItem(item, index))}</View>
    </View>
  );
};

export default VehicleGrid;
