import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { FC } from 'react'
import { Fonts } from '@utils/Constants';
import CustomText from './CustomText';
import { useTheme } from '@hooks/useTheme';


interface CustomButtonProps {
    onPress: () => void;
    title: string;
    disabled: boolean;
    loading: boolean;
}


const CustomButton:FC<CustomButtonProps> = ({onPress,loading,title,disabled}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    btn: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        padding: 15,
        marginVertical: 15,
        width: '100%'
    },
    text: {
        color: colors.white
    }
  });

  return (
    <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    style={[styles.btn,{
        backgroundColor: disabled ? colors.disabled : colors.secondary
    }]}
    >{
        loading ? 
        <ActivityIndicator color={colors.white} size='small' />:
        <CustomText style={styles.text} variant='h6' fontFamily={Fonts.SemiBold}>
            {title}
        </CustomText>
    }
    </TouchableOpacity>
  )
}

export default CustomButton