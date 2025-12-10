import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from 'react-native'
import React, { FC } from 'react'
import Icon from "react-native-vector-icons/Ionicons";
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';

interface InputProps {
    left: React.ReactNode;
    onClear?: () => void;
    right?: boolean;
    rightIcon?: React.ReactNode;
}

const CustomInput:FC<InputProps & React.ComponentProps<typeof TextInput>> = ({left,onClear,right,rightIcon,...props}) => {
  const {colors} = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;

  const getResponsiveValue = (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };

  const styles = StyleSheet.create({
    icon: {
        minWidth: getResponsiveValue(40, 48, 52),
        width: rightIcon ? 'auto' : getResponsiveValue(40, 48, 52),
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: getResponsiveValue(10, 12, 14),
        paddingLeft: rightIcon ? getResponsiveValue(8, 10, 12) : 0,
    },
    inputContainer: {
        flex: 1,
        fontFamily: Fonts.SemiBold,
        fontSize: RFValue(getResponsiveValue(12, 14, 16)),
        paddingVertical: getResponsiveValue(14, 16, 18),
        paddingBottom: getResponsiveValue(15, 17, 19),
        paddingRight: getResponsiveValue(8, 10, 12),
        height: '100%',
        color: colors.text,
        bottom: -1
    },
    text: {
        width: '10%',
        marginLeft: 10
    },
    flexRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: getResponsiveValue(10, 12, 14),
        borderWidth: 0.5,
        width: '100%',
        marginVertical: getResponsiveValue(10, 12, 14),
        minHeight: getResponsiveValue(50, 56, 60),
        backgroundColor: colors.cardBackground,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.6,
        shadowRadius: 2,
        shadowColor: colors.border,
        borderColor: colors.border
    },
  });

  return (
    <View style={styles.flexRow}>
        {left}
        <TextInput
        {...props}
        style={styles.inputContainer}
        placeholderTextColor={colors.disabled}
        />
        <View style={styles.icon}>
            {rightIcon && rightIcon}
            {props?.value?.length !=0 && right && !rightIcon && 
            <TouchableOpacity onPress={onClear}>
                <Icon name='close-circle-sharp' size={RFValue(16)} color={colors.disabled} />
            </TouchableOpacity>
            }
        </View>
    </View>
  )
}

export default CustomInput