import {View, Text, StyleSheet, Pressable} from 'react-native';
import React, {FC, ReactNode} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from './CustomText';
import {useTheme} from '@hooks/useTheme';
import NotificationIcon from '@components/common/NotificationIcon';

interface CustomHeaderProps {
  title: string;
  search?: boolean;
  showNotificationIcon?: boolean;
  rightComponent?: ReactNode;
  onSearchPress?: () => void;
  transparent?: boolean;
  showBackButton?: boolean;
}

const CustomHeader: FC<CustomHeaderProps> = ({
  title,
  search,
  showNotificationIcon = true,
  rightComponent,
  onSearchPress,
  transparent = false,
  showBackButton = true,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    flexRow: {
      justifyContent: 'space-between',
      padding: 10,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: transparent ? 'transparent' : colors.cardBackground,
      borderBottomWidth: transparent ? 0 : 0.6,
      borderColor: colors.border,
    },
    text: {
      textAlign: 'center',
      flex: 1,
    },
    iconButton: {
      padding: 4,
    },
  });

  return (
    <View style={{paddingTop: transparent ? insets.top : insets.top, backgroundColor: transparent ? 'transparent' : colors.cardBackground}}>
      <View style={styles.flexRow}>
        {showBackButton ? (
          <Pressable 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}>
            <Icon name="chevron-back" color={colors.text} size={RFValue(16)} />
          </Pressable>
        ) : (
          <View style={{width: RFValue(16)}} />
        )}
        <CustomText
          style={styles.text}
          variant="h5"
          fontFamily={Fonts.SemiBold}>
          {title}
        </CustomText>

        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {rightComponent || (
            <>
              {search && (
                <Pressable onPress={onSearchPress} style={styles.iconButton}>
                  <Icon name="search" color={colors.text} size={RFValue(20)} />
                </Pressable>
              )}
              {!search && showNotificationIcon && <NotificationIcon />}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default CustomHeader;
