import React, {FC, useState} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {screenHeight, screenWidth} from '@utils/Scaling';

export type SortOption = 
  | 'relevance'
  | 'price_low_high'
  | 'price_high_low'
  | 'newest'
  | 'popularity';

interface ISortModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSort: (sort: SortOption) => void;
  currentSort?: SortOption;
}

const sortOptions: {label: string; value: SortOption; icon: string}[] = [
  {label: 'Relevance', value: 'relevance', icon: 'star-outline'},
  {label: 'Price: Low to High', value: 'price_low_high', icon: 'arrow-up-outline'},
  {label: 'Price: High to Low', value: 'price_high_low', icon: 'arrow-down-outline'},
  {label: 'Newest First', value: 'newest', icon: 'time-outline'},
  {label: 'Popularity', value: 'popularity', icon: 'flame-outline'},
];

const SortModal: FC<ISortModalProps> = ({
  visible,
  onClose,
  onSelectSort,
  currentSort = 'relevance',
}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
      maxHeight: screenHeight * 0.5,
    },
    modalHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    optionContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionIcon: {
      marginRight: 12,
    },
    checkIcon: {
      marginLeft: 'auto',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <CustomText
                  variant="h4"
                  fontFamily={Fonts.SemiBold}
                  style={{color: colors.text}}>
                  Sort By
                </CustomText>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Icon name="close" color={colors.text} size={RFValue(18)} />
                </TouchableOpacity>
              </View>

              {sortOptions.map(option => {
                const isSelected = currentSort === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.optionItem}
                    onPress={() => {
                      onSelectSort(option.value);
                      onClose();
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.optionContent}>
                      <Icon
                        name={option.icon}
                        color={isSelected ? Colors.secondary : colors.text}
                        size={RFValue(20)}
                        style={styles.optionIcon}
                      />
                      <CustomText
                        variant="h6"
                        fontFamily={isSelected ? Fonts.SemiBold : Fonts.Medium}
                        style={{
                          color: isSelected ? Colors.secondary : colors.text,
                        }}>
                        {option.label}
                      </CustomText>
                    </View>
                    {isSelected && (
                      <Icon
                        name="checkmark-circle"
                        color={Colors.secondary}
                        size={RFValue(22)}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default SortModal;

