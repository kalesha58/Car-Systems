import {View, StyleSheet, Platform} from 'react-native';
import React, {FC} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';
import { navigate } from '@utils/NavigationUtils';

const FeedbackSection: FC = () => {
  const {t} = useTranslation();
  const {colors, isDark} = useTheme();

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
      ...(isDark
        ? {}
        : {
            ...(Platform.OS === 'ios'
              ? {
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                }
              : {
                  elevation: 2,
                }),
          }),
    },
  });

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
        {t('profile.feedbackInformation')}
      </CustomText>

      <View style={styles.menuContainer}>
        <ProfileMenuItem
          icon="chatbubble-ellipses-outline"
          label={t('profile.metAI') || 'MetAI'}
          onPress={() => {
            navigate('MetAIChat');
          }}
        />
        <ProfileMenuItem
          icon="document-text-outline"
          label={t('profile.termsPolicies')}
          onPress={() => {
            // TODO: Navigate to terms screen when implemented
          }}
        />
        <ProfileMenuItem
          icon="help-circle-outline"
          label={t('profile.browseFAQs')}
          onPress={() => {
            // TODO: Navigate to FAQs screen when implemented
          }}
        />
      </View>
    </View>
  );
};

export default FeedbackSection;

