import React, { FC, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { RFValue } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';

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

const StatCard: FC<IStatCardProps> = ({ icon, value, label, trend, updateDate, iconColor, style }) => {
  const { colors, isDark } = useTheme();

  // Determine icon background gradient colors based on icon name
  const gradientColors = useMemo(() => {
    if (iconColor) return [iconColor, iconColor];

    // Gradient colors based on common icon names - adapt to dark theme
    if (icon === 'cube-outline' || icon === 'cube') {
      return isDark ? ['#5BA3F5', '#3A6BA8'] : ['#4A90E2', '#357ABD']; // Blue gradient
    }
    if (icon === 'trending-up-outline' || icon === 'trending-up' || icon === 'arrow-up-outline') {
      return isDark ? ['#10B981', '#059669'] : ['#10b981', '#059669']; // Green gradient
    }
    if (icon === 'trending-down-outline' || icon === 'trending-down') {
      return isDark ? ['#EF4444', '#DC2626'] : ['#ef4444', '#b91c1c']; // Red gradient
    }
    if (icon === 'bag-outline' || icon === 'cart-outline' || icon === 'receipt-outline') {
      return isDark ? ['#A78BFA', '#8B5CF6'] : ['#9B59B6', '#8E44AD']; // Purple gradient
    }
    if (icon === 'cash-outline') {
      return isDark ? ['#14B8A6', '#0D9488'] : ['#0D9488', '#0F766E']; // Teal — revenue / AOV
    }
    if (icon === 'stats-chart-outline' || icon === 'analytics-outline') {
      return isDark ? ['#F59E0B', '#D97706'] : ['#F59E0B', '#D97706']; // Orange/Amber gradient
    }
    if (icon === 'remove-outline' || icon === 'close-outline') {
      return isDark ? ['#EF4444', '#DC2626'] : ['#ef4444', '#b91c1c']; // Red gradient
    }
    // Default to primary color gradient
    return [colors.primary, colors.secondary];
  }, [icon, iconColor, colors.primary, colors.secondary, isDark]);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 18,
      padding: 14,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'rgba(15, 23, 42, 0.06)',
      ...(isDark
        ? {}
        : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.07,
          shadowRadius: 14,
          elevation: 5,
        }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      gap: 4,
    },
    value: {
      fontSize: RFValue(17),
      color: colors.text,
      ...fontStyle(Fonts.Bold),
      letterSpacing: -0.2,
    },
    label: {
      fontSize: RFValue(10),
      color: colors.textSecondary,
      ...fontStyle(Fonts.Medium),
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: trend?.isPositive ? '#10b98115' : '#ef444415',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    trendText: {
      fontSize: RFValue(9),
      color: trend?.isPositive ? '#10b981' : '#ef4444',
      ...fontStyle(Fonts.Bold),
    },
    updateDate: {
      fontSize: RFValue(8),
      color: colors.textSecondary,
      marginTop: 8,
    },
  });

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}>
          <Icon name={icon} size={RFValue(18)} color="#FFFFFF" />
        </LinearGradient>
        {trend && (
          <View style={styles.trendContainer}>
            <Icon
              name={trend.isPositive ? 'arrow-up-outline' : 'arrow-down-outline'}
              size={RFValue(10)}
              color={trend.isPositive ? '#10b981' : '#ef4444'}
            />
            <CustomText style={styles.trendText}>
              {trend.value}%
            </CustomText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <CustomText style={styles.value} numberOfLines={1}>
          {value}
        </CustomText>
        <CustomText style={styles.label} numberOfLines={1}>
          {label}
        </CustomText>
      </View>

      {updateDate && (
        <CustomText style={styles.updateDate}>
          Updated {new Date(updateDate).toLocaleDateString()}
        </CustomText>
      )}
    </View>
  );
};

export default StatCard;

