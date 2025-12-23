import {View, StyleSheet, Platform} from 'react-native';
import React, {FC} from 'react';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';

const ActivitySection: FC = () => {
  const {t} = useTranslation();
  const {colors, isDark} = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      paddingHorizontal: 16,
      fontSize: RFValue(13),
      color: colors.textSecondary,
      textTransform: 'none',
      letterSpacing: 0.3,
    },
    menuContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 0,
      paddingHorizontal: 16,
      overflow: 'hidden',
      marginBottom: 8,
    },
  });

  const menuItems = [
    {
      icon: 'create-outline',
      label: t('profile.reviews'),
      onPress: () => {},
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: t('profile.questionsAnswers'),
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.sectionTitle}>
        {t('profile.myActivity') || 'my Activity'}
      </CustomText>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <ProfileMenuItem
            key={item.icon}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
            isLast={index === menuItems.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

export default ActivitySection;

