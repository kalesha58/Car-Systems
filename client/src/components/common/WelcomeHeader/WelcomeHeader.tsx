import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';

interface IWelcomeHeaderProps {
  businessName: string;
  onMessagePress: () => void;
  hasNotifications?: boolean;
}

const WelcomeHeader: FC<IWelcomeHeaderProps> = ({
  businessName,
  onMessagePress,
  hasNotifications,
}) => {
  const {colors, isDark} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    leftSection: {
      flex: 1,
    },
    greeting: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
      marginBottom: 4,
    },
    businessName: {
      fontSize: RFValue(20),
      fontWeight: '700',
    },
    messageButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      ...(isDark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }),
    },
    notificationBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.error,
      borderWidth: 2,
      borderColor: colors.cardBackground,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <CustomText variant="h8" style={styles.greeting}>
          Welcome back!
        </CustomText>
        <CustomText variant="h2" fontFamily={Fonts.Bold} style={styles.businessName}>
          {businessName}
        </CustomText>
      </View>
      <TouchableOpacity style={styles.messageButton} onPress={onMessagePress} activeOpacity={0.7}>
        <Icon name="message-circle" size={20} color={colors.text} />
        {hasNotifications && <View style={styles.notificationBadge} />}
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeHeader;

