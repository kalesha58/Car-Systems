import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import { Fonts } from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
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
      <View style={styles.textContainer}>
        <CustomText variant="h6" fontFamily={Fonts.Medium} style={{ color: colors.text + '80' }}>
          {t('search.placeholder')}
        </CustomText>
      </View>

      <View style={styles.divider} />

      <Icon name='mic' color={colors.text} size={RFValue(20)} />

    </TouchableOpacity>
  );
};

export default SearchBar;
