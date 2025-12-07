import React, {FC, useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenWidth, screenHeight} from '@utils/Scaling';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from './CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';

export interface IDropdownOption {
  label: string;
  value: string;
}

interface ICustomDropdownModalProps {
  visible: boolean;
  onClose: () => void;
  options: IDropdownOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  title?: string;
  searchable?: boolean;
  placeholder?: string;
}

const CustomDropdownModal: FC<ICustomDropdownModalProps> = ({
  visible,
  onClose,
  options,
  selectedValue,
  onSelect,
  title,
  searchable = false,
  placeholder = 'Search...',
}) => {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<IDropdownOption[]>(options);

  useEffect(() => {
    if (searchable && searchQuery.trim()) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options || []);
    }
  }, [searchQuery, options, searchable, visible]);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
    }
  }, [visible]);

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: screenWidth * 0.85,
      maxHeight: screenHeight * 0.7,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: colors.text,
      marginLeft: 8,
    },
    optionsList: {
      maxHeight: screenHeight * 0.5,
    },
    optionItem: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    optionItemSelected: {
      backgroundColor: colors.secondary + '20',
    },
    optionText: {
      fontSize: RFValue(13),
      fontFamily: Fonts.Medium,
      color: colors.text,
    },
    optionTextSelected: {
      fontFamily: Fonts.SemiBold,
      color: colors.secondary,
    },
    emptyText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: colors.disabled,
      textAlign: 'center',
      paddingVertical: 20,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <CustomText style={styles.title}>{title || t('dealer.selectOption')}</CustomText>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Icon name="close" size={RFValue(20)} color={colors.text} />
                </TouchableOpacity>
              </View>

              {searchable && (
                <View style={styles.searchContainer}>
                  <Icon name="search-outline" size={RFValue(16)} color={colors.disabled} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={placeholder}
                    placeholderTextColor={colors.disabled}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              )}

              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                        ]}
                        onPress={() => handleSelect(option.value)}
                        activeOpacity={0.7}>
                        <CustomText
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}>
                          {option.label}
                        </CustomText>
                        {isSelected && (
                          <Icon
                            name="checkmark-circle"
                            size={RFValue(20)}
                            color={colors.secondary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <CustomText style={styles.emptyText}>{t('dealer.noOptionsFound')}</CustomText>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomDropdownModal;

