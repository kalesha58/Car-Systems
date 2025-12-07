import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';

interface IOrderStatusCardProps {
  status: string;
  count: number;
  total: number;
}

const OrderStatusCard: FC<IOrderStatusCardProps> = ({status, count, total}) => {
  const {colors, isDark} = useTheme();

  const getStatusColor = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'delivered') {
      return colors.success;
    }
    if (normalizedStatus === 'confirmed' || normalizedStatus === 'processing') {
      return colors.secondary;
    }
    if (normalizedStatus === 'pending') {
      return colors.warning;
    }
    if (normalizedStatus === 'cancelled') {
      return colors.error;
    }
    return colors.disabled;
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const percentage = total > 0 ? (count / total) * 100 : 0;

  const styles = StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      ...(isDark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }),
    },
    leftSection: {
      flex: 1,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: getStatusColor(status),
      marginRight: 8,
    },
    statusLabel: {
      fontSize: RFValue(14),
      fontWeight: '600',
    },
    count: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
    },
    rightSection: {
      alignItems: 'flex-end',
    },
    percentage: {
      fontSize: RFValue(16),
      fontWeight: '700',
      color: getStatusColor(status),
    },
    percentageLabel: {
      fontSize: RFValue(10),
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.statusLabel}>
            {getStatusLabel(status)}
          </CustomText>
        </View>
        <CustomText variant="h8" style={styles.count}>
          {count} orders
        </CustomText>
      </View>
      <View style={styles.rightSection}>
        <CustomText variant="h4" fontFamily={Fonts.Bold} style={styles.percentage}>
          {percentage.toFixed(1)}%
        </CustomText>
        <CustomText variant="h9" style={styles.percentageLabel}>
          of total
        </CustomText>
      </View>
    </View>
  );
};

export default OrderStatusCard;

