import {View, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import React, {FC, useState, useMemo} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {IAddress} from '../../types/address/IAddress';
import {useTheme} from '@hooks/useTheme';

interface IAddressItemProps {
  item: IAddress;
  index: number;
  onMenuPress?: (item: IAddress, action: 'edit' | 'delete') => void;
  isDeleting?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (item: IAddress) => void;
}

const AddressItem: FC<IAddressItemProps> = ({
  item,
  index,
  onMenuPress,
  isDeleting = false,
  selectMode = false,
  isSelected = false,
  onSelect,
}) => {
  const {colors} = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const getIconName = (iconType: string) => {
    switch (iconType) {
      case 'home':
        return 'home-outline';
      case 'building':
        return 'business-outline';
      case 'location':
        return 'location-outline';
      default:
        return 'location-outline';
    }
  };

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  const handleAction = (action: 'edit' | 'delete') => {
    setShowMenu(false);
    onMenuPress?.(item, action);
  };

  const handleItemPress = () => {
    if (selectMode && onSelect) {
      onSelect(item);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: 15,
          paddingHorizontal: 10,
          borderTopWidth: 0.7,
          borderColor: colors.border,
        },
        selectableContainer: {
          paddingVertical: 12,
        },
        selectedContainer: {
          backgroundColor: colors.backgroundSecondary,
          borderLeftWidth: 3,
          borderLeftColor: colors.secondary,
        },
        flexRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.backgroundSecondary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        contentContainer: {
          flex: 1,
          gap: 4,
        },
        nameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        defaultBadge: {
          backgroundColor: colors.secondary,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 4,
        },
        defaultBadgeText: {
          color: '#fff',
          fontSize: RFValue(10),
        },
        addressText: {
          color: colors.text,
          opacity: 0.8,
          marginTop: 4,
        },
        phoneText: {
          color: colors.text,
          opacity: 0.7,
          marginTop: 4,
        },
        menuContainer: {
          position: 'relative',
        },
        menuButton: {
          padding: 5,
        },
        menuOptions: {
          position: 'absolute',
          right: 0,
          top: -10,
          backgroundColor: colors.cardBackground,
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 4,
          minWidth: 120,
          shadowColor: colors.black,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          zIndex: 1000,
        },
        menuOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 12,
          gap: 8,
        },
        deleteOption: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        menuOptionText: {
          color: colors.text,
        },
        deleteText: {
          color: '#ff3b30',
        },
        checkmarkContainer: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: 8,
        },
      }),
    [colors],
  );

  const containerStyle = [
    styles.container,
    {borderTopWidth: index === 0 ? 0.7 : 0},
    selectMode && styles.selectableContainer,
    isSelected && styles.selectedContainer,
  ];

  const contentWrapper = selectMode ? (
    <TouchableOpacity
      style={styles.flexRow}
      onPress={handleItemPress}
      activeOpacity={0.7}
      disabled={isDeleting}>
      <View style={styles.iconContainer}>
        <Icon
          name={getIconName(item.iconType)}
          size={RFValue(20)}
          color={isSelected ? colors.secondary : colors.text}
        />
      </View>

      <View style={styles.contentContainer}>
        <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
          {item.name}
        </CustomText>
        <CustomText variant="h8" style={styles.addressText} numberOfLines={3}>
          {item.fullAddress}
        </CustomText>
        <CustomText variant="h9" style={styles.phoneText}>
          {item.phone}
        </CustomText>
      </View>

      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Icon name="checkmark-circle" size={RFValue(24)} color={colors.secondary} />
        </View>
      )}
    </TouchableOpacity>
  ) : (
    <View style={styles.flexRow}>
      <View style={styles.iconContainer}>
        <Icon
          name={getIconName(item.iconType)}
          size={RFValue(20)}
          color={colors.text}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.nameRow}>
          <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
            {item.name}
          </CustomText>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <CustomText variant="h9" fontFamily={Fonts.Medium} style={styles.defaultBadgeText}>
                Default
              </CustomText>
            </View>
          )}
        </View>
        <CustomText variant="h8" style={styles.addressText} numberOfLines={3}>
          {item.fullAddress}
        </CustomText>
        <CustomText variant="h9" style={styles.phoneText}>
          {item.phone}
        </CustomText>
      </View>

      {!selectMode && (
        <View style={styles.menuContainer}>
          {showMenu && (
            <View style={styles.menuOptions}>
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleAction('edit')}
                disabled={isDeleting}>
                <Icon name="create-outline" size={RFValue(18)} color={colors.secondary} />
                <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.menuOptionText}>
                  Edit
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuOption, styles.deleteOption]}
                onPress={() => handleAction('delete')}
                disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ff3b30" />
                ) : (
                  <>
                    <Icon name="trash-outline" size={RFValue(18)} color="#ff3b30" />
                    <CustomText
                      variant="h8"
                      fontFamily={Fonts.Medium}
                      style={[styles.menuOptionText, styles.deleteText]}>
                      Delete
                    </CustomText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Icon name="ellipsis-vertical" size={RFValue(18)} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return <View style={containerStyle}>{contentWrapper}</View>;
};

export default AddressItem;

