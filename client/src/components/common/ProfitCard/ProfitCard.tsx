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
      backgroundColor: colors.backgroundSecondary || colors.background,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      position: 'relative',
      ...(isDark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }),
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    label: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
    },
    growthContainer: {
      alignItems: 'flex-end',
    },
    growthText: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: growth !== undefined && growth >= 0 ? colors.success : colors.error,
      marginBottom: 4,
    },
    growthLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    growthIcon: {
      marginRight: 2,
    },
    growthLabel: {
      fontSize: RFValue(10),
      color: colors.success,
    },
    amount: {
      fontSize: RFValue(32),
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <CustomText variant="h8" style={styles.label}>
          {label}
        </CustomText>
        {growth !== undefined && (
          <View style={styles.growthContainer}>
            <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.growthText}>
              {growth >= 0 ? '+' : ''}
              {growth}%
            </CustomText>
            {growthLabel && (
              <View style={styles.growthLabelContainer}>
                <Icon
                  name={growth >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={colors.success}
                  style={styles.growthIcon}
                />
                <CustomText variant="h9" style={styles.growthLabel}>
                  {growthLabel}
                </CustomText>
              </View>
            )}
          </View>
        )}
      </View>
      <CustomText variant="h1" fontFamily={Fonts.Bold} style={styles.amount}>
        {formatCurrency(amount)}
      </CustomText>
    </View>
  );
};

export default ProfitCard;

