import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';

interface ITrend {
  value: number;
  isPositive: boolean;
}

interface IStatCardProps {
  icon: string;
  value: string | number;
  label: string;
  trend?: ITrend;
  updateDate?: string;
}

const StatCard: FC<IStatCardProps> = ({icon, value, label, trend, updateDate}) => {
  const {colors, isDark} = useTheme();

  const styles = StyleSheet.create({
    card: {
      width: '48%',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...(isDark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }),
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    value: {
      fontSize: RFValue(20),
      fontWeight: '700',
      marginBottom: 4,
    },
    label: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
      marginBottom: 8,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    trendText: {
      fontSize: RFValue(10),
      color: trend?.isPositive ? colors.success : colors.error,
    },
    updateDate: {
      fontSize: RFValue(9),
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <CustomText variant="h3" fontFamily={Fonts.Bold} style={styles.value}>
        {value}
      </CustomText>
      <CustomText variant="h8" style={styles.label}>
        {label}
      </CustomText>
      {trend && (
        <View style={styles.trendContainer}>
          <Icon
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend.isPositive ? colors.success : colors.error}
          />
          <CustomText variant="h9" style={styles.trendText}>
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </CustomText>
        </View>
      )}
      {updateDate && (
        <CustomText variant="h9" style={styles.updateDate}>
          Updated {new Date(updateDate).toLocaleDateString()}
        </CustomText>
      )}
    </View>
  );
};

export default StatCard;

