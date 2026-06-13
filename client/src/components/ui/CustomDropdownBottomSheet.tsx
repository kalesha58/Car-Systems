import React, {FC, useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenHeight} from '@utils/Scaling';
import { Fonts, fontStyle } from '@utils/Constants';
import CustomText from './CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';

export interface IDropdownOption {
  label: string;
  value: string;
}

interface ICustomDropdownBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  options: IDropdownOption[];
  title?: string;
  searchable?: boolean;
  placeholder?: string;
  selectedValue?: string;
  onSelect?: (value: string) => void;
  multiSelect?: boolean;
  selectedValues?: string[];
  onSelectMultiple?: (values: string[]) => void;
  showDoneButton?: boolean;
}

const CustomDropdownBottomSheet: FC<ICustomDropdownBottomSheetProps> = ({
  visible,
  onClose,
  options,
  title,
  searchable = false,
  placeholder = 'Search...',
  selectedValue,
  onSelect,
  multiSelect = false,
  selectedValues = [],
  onSelectMultiple,
  showDoneButton,
}) => {
  const {colors, isDark} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<IDropdownOption[]>(options);

  const shouldShowDone = showDoneButton ?? multiSelect;

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

  const handleSingleSelect = useCallback(
    (value: string) => {
      onSelect?.(value);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleMultiToggle = useCallback(
    (value: string) => {
      if (!onSelectMultiple) return;
      const next = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onSelectMultiple(next);
    },
    [onSelectMultiple, selectedValues],
  );

  const isOptionSelected = (value: string) =>
    multiSelect ? selectedValues.includes(value) : selectedValue === value;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: screenHeight * 0.7,
      borderWidth: isDark ? 1 : 0,
      borderBottomWidth: 0,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: -4},
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 16,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.disabled,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: RFValue(14),
      ...fontStyle(Fonts.SemiBold),
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    closeButton: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: RFValue(12),
      ...fontStyle(Fonts.Regular),
      color: colors.text,
      marginLeft: 8,
      paddingVertical: 0,
    },
    optionsList: {
      maxHeight: screenHeight * 0.45,
      paddingHorizontal: 12,
    },
    optionItem: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
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
      ...fontStyle(Fonts.Medium),
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    optionTextSelected: {
      ...fontStyle(Fonts.SemiBold),
      color: colors.secondary,
    },
    emptyText: {
      fontSize: RFValue(12),
      ...fontStyle(Fonts.Regular),
      color: colors.disabled,
      textAlign: 'center',
      paddingVertical: 24,
    },
    doneButton: {
      marginHorizontal: 20,
      marginTop: 8,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneButtonText: {
      fontSize: RFValue(12),
      ...fontStyle(Fonts.SemiBold),
      color: '#fff',
    },
    footerSpacer: {
      height: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 12)}]}>
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <CustomText style={styles.title}>{title || t('dealer.selectOption')}</CustomText>
                <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Icon name="close" size={RFValue(22)} color={colors.text} />
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
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <Icon name="close-circle" size={RFValue(16)} color={colors.disabled} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const isSelected = isOptionSelected(option.value);
                    return (
                      <TouchableOpacity
                        key={`${option.value}-${index}`}
                        style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                        onPress={() =>
                          multiSelect ? handleMultiToggle(option.value) : handleSingleSelect(option.value)
                        }
                        activeOpacity={0.7}>
                        <CustomText
                          style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {option.label}
                        </CustomText>
                        {isSelected && (
                          <Icon name="checkmark-circle" size={RFValue(20)} color={colors.secondary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <CustomText style={styles.emptyText}>{t('dealer.noOptionsFound')}</CustomText>
                )}
              </ScrollView>

              {shouldShowDone && (
                <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.85}>
                  <CustomText style={styles.doneButtonText}>{t('dealer.done')}</CustomText>
                </TouchableOpacity>
              )}

              {!shouldShowDone && <View style={styles.footerSpacer} />}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomDropdownBottomSheet;
