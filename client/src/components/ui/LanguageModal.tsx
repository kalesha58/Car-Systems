import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import React, {FC, useState} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from './CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenWidth, screenHeight} from '@utils/Scaling';
import {useLanguageStore} from '@state/languageStore';
import {LANGUAGES, ILanguage, LanguageCode} from '../../types/language/ILanguage';
import {useTranslation} from 'react-i18next';

interface ILanguageModalProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelect?: (language: LanguageCode) => void;
}

const LanguageModal: FC<ILanguageModalProps> = ({
  visible,
  onClose,
  onLanguageSelect,
}) => {
  const {selectedLanguage, setLanguage} = useLanguageStore();
  const {t} = useTranslation();
  const [tempSelectedLanguage, setTempSelectedLanguage] =
    useState<LanguageCode>(selectedLanguage);

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    setTempSelectedLanguage(languageCode);
  };

  const handleContinue = () => {
    setLanguage(tempSelectedLanguage);
    if (onLanguageSelect) {
      onLanguageSelect(tempSelectedLanguage);
    }
    onClose();
  };

  const renderLanguageItem = (language: ILanguage) => {
    const isSelected = tempSelectedLanguage === language.code;
    return (
      <TouchableOpacity
        key={language.code}
        style={[
          styles.languageItem,
          isSelected && styles.languageItemSelected,
        ]}
        onPress={() => handleLanguageSelect(language.code as LanguageCode)}
        activeOpacity={0.7}>
        <CustomText
          variant="h6"
          fontFamily={isSelected ? Fonts.SemiBold : Fonts.Medium}
          style={[
            styles.languageText,
            isSelected && styles.languageTextSelected,
          ]}>
          {language.nativeName}
        </CustomText>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <CustomText variant="h3" fontFamily={Fonts.SemiBold}>
                  {t('profile.tryInLanguage')}
                </CustomText>
              </View>

              <ScrollView
                contentContainerStyle={styles.languageGrid}
                showsVerticalScrollIndicator={false}>
                {LANGUAGES.filter(
                  lang => lang.code === 'en' || lang.code === 'hi' || lang.code === 'te',
                ).map(language => renderLanguageItem(language))}
              </ScrollView>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}>
                <CustomText
                  variant="h5"
                  fontFamily={Fonts.SemiBold}
                  style={styles.continueButtonText}>
                  {t('profile.continue')}
                </CustomText>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: screenHeight * 0.75,
  },
  modalHeader: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  languageItem: {
    width: (screenWidth - 48) / 3,
    aspectRatio: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    borderColor: Colors.secondary,
    backgroundColor: '#fff',
  },
  languageText: {
    color: Colors.text,
    textAlign: 'center',
  },
  languageTextSelected: {
    color: Colors.secondary,
  },
  continueButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#fff',
  },
});

export default LanguageModal;

