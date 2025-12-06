import {View, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import {useTranslation} from 'react-i18next';

const FeedbackSection: FC = () => {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
        {t('profile.feedbackInformation')}
      </CustomText>

      <View style={styles.menuContainer}>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
});

export default FeedbackSection;

