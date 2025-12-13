import React, { FC } from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { RFValue } from 'react-native-responsive-fontsize';

interface IEmptyStateProps {
  title: string;
  message: string;
  icon?: string;
}

const EmptyState: FC<IEmptyStateProps> = ({ title, message, icon = 'cube-outline' }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: RFValue(18),
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: RFValue(14),
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={40} color={colors.textSecondary} />
      </View>
      <CustomText variant="h3" fontFamily={Fonts.SemiBold} style={styles.title}>
        {title}
      </CustomText>
      <CustomText variant="h5" style={styles.message}>
        {message}
      </CustomText>
    </View>
  );
};

export default EmptyState;

