import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, {FC, useMemo} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import {IUserVehicle} from '../../../types/vehicle/IVehicle';
import {Dimensions} from 'react-native';
import SkeletonLoader from '@components/ui/SkeletonLoader';

interface VehicleGridProps {
  vehicles: IUserVehicle[];
  loading?: boolean;
  refreshing?: boolean;
  onVehiclePress?: (vehicle: IUserVehicle) => void;
}

const VehicleGrid: FC<VehicleGridProps> = ({vehicles, loading = false, refreshing = false, onVehiclePress}) => {
  const {colors, isDark} = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const itemSize = screenWidth / 3; // 3 columns with no gap (like Instagram)

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    vehicleItem: {
      width: itemSize,
      height: itemSize,
      backgroundColor: colors.cardBackground,
      position: 'relative',
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 4,
    },
    vehicleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    vehicleText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
      color: '#fff',
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: RFValue(13),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skeletonItem: {
      width: itemSize,
      height: itemSize,
      backgroundColor: colors.cardBackground,
      position: 'relative',
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

  const renderVehicleItem = (item: IUserVehicle) => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.vehicleItem}
        onPress={() => onVehiclePress?.(item)}
        activeOpacity={0.8}>
        {firstImage ? (
          <>
            <Image
              source={{uri: firstImage}}
              style={styles.vehicleImage}
              resizeMode="cover"
            />
            <View style={styles.vehicleOverlay}>
              <View style={styles.vehicleInfo}>
                <CustomText style={styles.vehicleText} numberOfLines={1}>
                  {item.brand} {item.model}
                </CustomText>
              </View>
              {item.numberPlate && (
                <CustomText style={[styles.vehicleText, {fontSize: RFValue(9), marginTop: 2}]} numberOfLines={1}>
                  {item.numberPlate}
                </CustomText>
              )}
            </View>
          </>
        ) : (
          <View style={[styles.vehicleItem, {justifyContent: 'center', alignItems: 'center'}]}>
            <CustomText style={{color: colors.textSecondary, fontSize: RFValue(12), textAlign: 'center', padding: 8}}>
              {item.brand} {item.model}
            </CustomText>
            {item.numberPlate && (
              <CustomText style={{color: colors.textSecondary, fontSize: RFValue(10), marginTop: 4}}>
                {item.numberPlate}
              </CustomText>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <CustomText style={{fontSize: RFValue(48), color: colors.textSecondary}}>🚗</CustomText>
      </View>
      <CustomText style={styles.emptyTitle}>No Vehicles Yet</CustomText>
      <CustomText style={styles.emptyText}>
        When you add vehicles, they'll appear here.
      </CustomText>
    </View>
  );

  if (loading) {
    // Show 9 skeleton items (3x3 grid like Instagram)
    const skeletonCount = 9;
    return (
      <View style={styles.container}>
        <View style={styles.skeletonGrid}>
          {Array.from({length: skeletonCount}, (_, index) => (
            <View key={`skeleton-${index}`} style={styles.skeletonItem}>
              <SkeletonLoader width="100%" height="100%" borderRadius={0} />
              <View style={styles.skeletonOverlay}>
                <SkeletonLoader width="70%" height={12} borderRadius={4} style={{marginBottom: 4}} />
                <SkeletonLoader width="50%" height={10} borderRadius={4} />
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
      <View style={styles.grid}>
        {vehicles.map((item) => renderVehicleItem(item))}
      </View>
    </View>
  );
};

export default VehicleGrid;

