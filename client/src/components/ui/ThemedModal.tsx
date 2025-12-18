import React, {FC} from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';

import {useTheme} from '@hooks/useTheme';
import {Fonts} from '@utils/Constants';
import CustomButton from '@components/ui/CustomButton';
import CustomText from '@components/ui/CustomText';

export type ThemedModalVariant = 'info' | 'success' | 'warning' | 'error';

interface IThemedModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  variant?: ThemedModalVariant;
  primaryText?: string;
  onPrimaryPress?: () => void;
  onClose: () => void;
  dismissOnBackdropPress?: boolean;
}

const ThemedModal: FC<IThemedModalProps> = ({
  visible,
  title = 'Notice',
  message = '',
  variant = 'info',
  primaryText = 'OK',
  onPrimaryPress,
  onClose,
  dismissOnBackdropPress = true,
}) => {
  const {colors} = useTheme();

  const accent =
    variant === 'error'
      ? colors.error
      : variant === 'success'
        ? colors.success
        : variant === 'warning'
          ? colors.warning
          : colors.primary;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 18,
    },
    content: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 10,
    },
    accentDot: {
      width: 10,
      height: 10,
      borderRadius: 10,
      backgroundColor: accent,
      marginRight: 10,
    },
    title: {
      color: colors.text,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(14),
      flexShrink: 1,
    },
    closeBtn: {
      padding: 6,
      marginRight: -6,
    },
    body: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    message: {
      color: colors.textSecondary,
      fontFamily: Fonts.Regular,
      fontSize: RFValue(12),
      lineHeight: RFValue(16),
    },
    footer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });

  const handlePrimary = () => {
    if (onPrimaryPress) {
      onPrimaryPress();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback
        onPress={dismissOnBackdropPress ? onClose : undefined}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.accentDot} />
                  <CustomText style={styles.title}>{title}</CustomText>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                  style={styles.closeBtn}
                  onPress={onClose}>
                  <Icon name="close" size={RFValue(18)} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                {!!message && <CustomText style={styles.message}>{message}</CustomText>}
              </View>

              <View style={styles.footer}>
                <CustomButton title={primaryText} onPress={handlePrimary} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ThemedModal;

