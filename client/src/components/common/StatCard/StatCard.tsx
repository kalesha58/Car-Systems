import React, {FC, useMemo} from 'react';
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
  iconColor?: string;
  style?: any;
}

const StatCard: FC<IStatCardProps> = ({icon, value, label, trend, updateDate, iconColor, style}) => {
  const {colors, isDark} = useTheme();

  // Determine icon background color based on icon name or use provided color
  const iconBgColor = useMemo(() => {
    if (iconColor) return iconColor;
    
    // Default colors based on common icon names
    if (icon === 'package' || icon === 'box') {
      return '#4A90E2'; // Blue
    }
    if (icon === 'trending-up' || icon === 'trending-down') {
      return colors.success; // Green
    }
    if (icon === 'shopping-bag' || icon === 'shopping-cart') {
      return '#9B59B6'; // Purple
    }
    // Default to primary color
    return colors.primary;
  }, [icon, iconColor, colors.primary, colors.success]);

  const iconTextColor = '#FFFFFF';

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      ...(isDark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }),
    },
    iconContainer: {
      width: 48,
      height: 48,
      minWidth: 48,
      minHeight: 48,
      borderRadius: 10,
      backgroundColor: iconBgColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    value: {
      fontSize: RFValue(20),
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    label: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
      marginBottom: trend ? 6 : 0,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    trendText: {
      fontSize: RFValue(11),
      color: trend?.isPositive ? colors.success : colors.error,
      fontFamily: Fonts.SemiBold,
    },
    updateDate: {
      fontSize: RFValue(9),
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconContainer}>
        <Icon 
          name={icon} 
          size={24} 
          color={iconTextColor}
          style={{textAlign: 'center'}}
        />
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

