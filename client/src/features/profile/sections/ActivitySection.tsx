import {View, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';

const ActivitySection: FC = () => {
  const {t} = useTranslation();
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      opacity: 0.7,
      paddingHorizontal: 4,
    },
    menuContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
  });

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
        {t('profile.myActivity')}
      </CustomText>

      <View style={styles.menuContainer}>
        <ProfileMenuItem
          icon="create-outline"
          label={t('profile.reviews')}
          onPress={() => {
            // TODO: Navigate to reviews screen when implemented
          }}
        />
        <ProfileMenuItem
          icon="chatbubble-ellipses-outline"
          label={t('profile.questionsAnswers')}
          onPress={() => {
            // TODO: Navigate to Q&A screen when implemented
          }}
        />
      </View>
    </View>
  );
};

export default ActivitySection;

