import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from './CustomText';
import {useTheme} from '@hooks/useTheme';
import {Fonts} from '@utils/Constants';
import {IToast, ToastType} from '../../types/toast/IToast';

interface IToastProps {
  toast: IToast;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<IToastProps> = ({toast, onDismiss}) => {
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    dismissTimeoutRef.current = setTimeout(() => {
      handleDismiss();
    }, toast.duration);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success,
          iconColor: colors.white,
          textColor: colors.white,
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          iconColor: colors.white,
          textColor: colors.white,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          iconColor: colors.white,
          textColor: colors.white,
        };
      case 'info':
        return {
          backgroundColor: colors.primary,
          iconColor: colors.white,
          textColor: colors.white,
        };
      default:
        return {
          backgroundColor: colors.success,
          iconColor: colors.white,
          textColor: colors.white,
        };
    }
  };

  const getIconName = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'check-circle';
    }
  };

  const toastColors = getToastColors(toast.type);
  const iconName = getIconName(toast.type);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: insets.top + 10,
      left: 16,
      right: 16,
      zIndex: 9999,
      borderRadius: 12,
      backgroundColor: toastColors.backgroundColor,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    iconContainer: {
      marginRight: 12,
    },
    messageContainer: {
      flex: 1,
    },
    closeButton: {
      marginLeft: 8,
      padding: 4,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY: slideAnim}],
          opacity: opacityAnim,
        },
      ]}>
      <View style={styles.iconContainer}>
        <Icon
          name={iconName}
          size={RFValue(24)}
          color={toastColors.iconColor}
        />
      </View>
      <View style={styles.messageContainer}>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Medium}
          style={{color: toastColors.textColor}}>
          {toast.message}
        </CustomText>
      </View>
      <TouchableOpacity
        onPress={handleDismiss}
        style={styles.closeButton}
        activeOpacity={0.7}>
        <Icon
          name="close"
          size={RFValue(20)}
          color={toastColors.iconColor}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;

