import React, {FC, useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from './CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchModal: FC<SearchModalProps> = ({
  visible,
  onClose,
  onSearch,
  placeholder = 'Search for products, vehicles, services...',
}) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingTop: insets.top + 10,
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      borderWidth: 0.6,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginTop: 10,
      minHeight: 50,
    },
    searchInput: {
      flex: 1,
      fontSize: RFValue(14),
      fontFamily: Fonts.Medium,
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    iconButton: {
      padding: 8,
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: RFValue(18),
      fontFamily: Fonts.SemiBold,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <CustomText style={styles.headerTitle} fontFamily={Fonts.SemiBold}>
              Search
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Icon name="close" color={colors.text} size={RFValue(24)} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Icon name="search" color={colors.text} size={RFValue(20)} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={colors.text + '80'}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
                <Icon name="close-circle" color={colors.text} size={RFValue(20)} />
              </TouchableOpacity>
            )}
            <View style={styles.divider} />
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="mic" color={colors.text} size={RFValue(20)} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default SearchModal;

