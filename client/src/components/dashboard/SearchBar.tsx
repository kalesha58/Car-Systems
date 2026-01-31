import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import { Fonts } from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import RollingBar from 'react-native-rolling-bar';
import CustomText from '@components/ui/CustomText';
import { useTheme } from '@hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  onPress?: () => void;
  showVehicleSuggestions?: boolean;
}

const SearchBar: FC<SearchBarProps> = ({ onPress, showVehicleSuggestions = false }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 10,
      borderWidth: 0.6,
      borderColor: colors.border,
      marginTop: 15,
      overflow: 'hidden',
      marginHorizontal: 10,
      paddingHorizontal: 10,
      minHeight: 50,
    },
    textContainer: {
      flex: 1,
      paddingLeft: 10,
      paddingRight: 10,
      height: 50,
      justifyContent: 'center',
      alignItems: 'flex-start',
      overflow: 'hidden',
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
      marginHorizontal: 10,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={onPress}>
      <Icon name="search" color={colors.text} size={RFValue(20)} />
      <RollingBar
        interval={3000}
        defaultStyle={false}
        customStyle={styles.textContainer}>
        {showVehicleSuggestions ? (
          <>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.newCars')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.usedCars')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.vehicles')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.engineOil')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.carService')}
            </CustomText>
          </>
        ) : (
          <>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.engineOil')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.brakePads')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.tiresAndMore')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.carWash')}
            </CustomText>
            <CustomText variant="h6" fontFamily={Fonts.Medium}>
              {t('search.carService')}
            </CustomText>
          </>
        )}
      </RollingBar>

      <View style={styles.divider} />

      <Icon name='mic' color={colors.text} size={RFValue(20)} />

    </TouchableOpacity>
  );
};

export default SearchBar;
