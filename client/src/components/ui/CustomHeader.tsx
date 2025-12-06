import {View, Text, StyleSheet, Pressable} from 'react-native';
import React, {FC, ReactNode} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import {goBack} from '@utils/NavigationUtils';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from './CustomText';
import {useTheme} from '@hooks/useTheme';

const CustomHeader: FC<{title: string; search?: boolean; rightComponent?: ReactNode}> = ({
  title,
  search,
  rightComponent,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    flexRow: {
      justifyContent: 'space-between',
      padding: 10,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.6,
      borderColor: colors.border,
    },
    text: {
      textAlign: 'center',
    },
  });

  return (
    <View style={{paddingTop: insets.top, backgroundColor: colors.cardBackground}}>
      <View style={styles.flexRow}>
        <Pressable onPress={() => goBack()}>
          <Icon name="chevron-back" color={colors.text} size={RFValue(16)} />
        </Pressable>
        <CustomText
          style={styles.text}
          variant="h5"
          fontFamily={Fonts.SemiBold}>
          {title}
        </CustomText>

        <View>
          {rightComponent || (search && (
            <Icon name="search" color={colors.text} size={RFValue(16)} />
          ))}
        </View>
      </View>
    </View>
  );
};

export default CustomHeader;
