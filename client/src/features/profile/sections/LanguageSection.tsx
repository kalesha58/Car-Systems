import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import React, {FC} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import {useLanguageStore} from '@state/languageStore';
import {LANGUAGES, LanguageCode} from '../../../types/language/ILanguage';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';

const LanguageSection: FC = () => {
  const {selectedLanguage, setLanguage} = useLanguageStore();
  const {t} = useTranslation();
  const {colors} = useTheme();

  const handleLanguagePress = (languageCode: LanguageCode) => {
    setLanguage(languageCode);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    title: {
      marginBottom: 12,
    },
    languageContainer: {
      flexDirection: 'row',
      gap: 10,
      paddingRight: 4,
    },
    languageButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    languageButtonSelected: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.secondary,
    },
    languageText: {
      color: colors.text,
    },
    languageTextSelected: {
      color: colors.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.title}>
        {t('profile.tryInLanguage')}
      </CustomText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.languageContainer}>
        {LANGUAGES.map(language => {
          const isSelected = language.code === selectedLanguage;
          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageButton,
                isSelected && styles.languageButtonSelected,
              ]}
              onPress={() => handleLanguagePress(language.code as LanguageCode)}
              activeOpacity={0.7}>
              <CustomText
                variant="h7"
                fontFamily={isSelected ? Fonts.SemiBold : Fonts.Medium}
                style={
                  isSelected
                    ? [styles.languageText, styles.languageTextSelected]
                    : styles.languageText
                }>
                {language.nativeName}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default LanguageSection;

