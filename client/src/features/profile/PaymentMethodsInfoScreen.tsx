import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import React from 'react';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { RFValue } from 'react-native-responsive-fontsize';

const PaymentMethodsInfoScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <CustomHeader title={t('profile.savedCards')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <CustomText variant="body" fontFamily={Fonts.Regular} style={{ color: colors.text, lineHeight: RFValue(22) }}>
          {t('profile.paymentMethodsInfoParagraph')}
        </CustomText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
});

export default PaymentMethodsInfoScreen;
