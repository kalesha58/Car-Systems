import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';
import {formatCurrency} from '@utils/analytics';

interface IProfitCardProps {
  amount: number;
  label: string;
  growth?: number;
  growthLabel?: string;
}

const ProfitCard: FC<IProfitCardProps> = ({amount, label, growth, growthLabel}) => {
  const {colors, isDark} = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
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
    label: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
      marginBottom: 8,
    },
    amount: {
      fontSize: RFValue(28),
      fontWeight: '700',
      marginBottom: 12,
    },
    growthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    growthIcon: {
      marginRight: 4,
    },
    growthText: {
      fontSize: RFValue(12),
      color: growth !== undefined && growth >= 0 ? colors.success : colors.error,
    },
    growthLabel: {
      fontSize: RFValue(10),
      color: colors.textSecondary,
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.card}>
      <CustomText variant="h8" style={styles.label}>
        {label}
      </CustomText>
      <CustomText variant="h1" fontFamily={Fonts.Bold} style={styles.amount}>
        {formatCurrency(amount)}
      </CustomText>
      {growth !== undefined && (
        <View style={styles.growthContainer}>
          <Icon
            name={growth >= 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={growth >= 0 ? colors.success : colors.error}
            style={styles.growthIcon}
          />
          <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.growthText}>
            {growth >= 0 ? '+' : ''}
            {growth}%
          </CustomText>
          {growthLabel && (
            <CustomText variant="h9" style={styles.growthLabel}>
              {growthLabel}
            </CustomText>
          )}
        </View>
      )}
    </View>
  );
};

export default ProfitCard;

