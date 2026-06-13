import React, { FC, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { screenHeight } from '@utils/Scaling';
import { Fonts, fontStyle } from '@utils/Constants';
import CustomText from './CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@hooks/useTheme';

export interface IActionSheetItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  iconColor?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ICustomActionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: IActionSheetItem[];
}

const CustomActionBottomSheet: FC<ICustomActionBottomSheetProps> = ({
  visible,
  onClose,
  title = 'Actions',
  subtitle,
  actions,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        sheet: {
          width: '100%',
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: screenHeight * 0.55,
          borderWidth: isDark ? 1 : 0,
          borderBottomWidth: 0,
          borderColor: colors.border,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -4 },
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
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        headerTextBlock: {
          flex: 1,
          minWidth: 0,
          paddingRight: 8,
        },
        title: {
          fontSize: RFValue(16),
          lineHeight: RFValue(22),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
        },
        subtitle: {
          fontSize: RFValue(12),
          lineHeight: RFValue(17),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
          marginTop: 6,
        },
        closeButton: {
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: -2,
        },
        actionsList: {
          flexGrow: 0,
        },
        actionsListContent: {
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 4,
        },
        actionItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 12,
          marginBottom: 6,
          gap: 12,
        },
        iconWrap: {
          width: 42,
          height: 42,
          borderRadius: 21,
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        },
        actionContent: {
          flex: 1,
          minWidth: 0,
        },
        actionLabel: {
          fontSize: RFValue(14),
          lineHeight: RFValue(20),
          ...fontStyle(Fonts.SemiBold),
          color: colors.text,
        },
        actionDescription: {
          fontSize: RFValue(11),
          lineHeight: RFValue(16),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
          marginTop: 4,
        },
        chevronWrap: {
          flexShrink: 0,
          paddingLeft: 4,
        },
        cancelButton: {
          marginHorizontal: 20,
          marginTop: 8,
          marginBottom: Math.max(insets.bottom, 12),
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: isDark ? colors.backgroundSecondary : '#F1F5F9',
          borderWidth: 1,
          borderColor: colors.border,
          flexShrink: 0,
        },
        cancelText: {
          fontSize: RFValue(13),
          ...fontStyle(Fonts.SemiBold),
          color: colors.text,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  const handleActionPress = (action: IActionSheetItem) => {
    onClose();
    action.onPress();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <View style={styles.headerTextBlock}>
                    <CustomText style={styles.title} numberOfLines={2}>
                      {title}
                    </CustomText>
                    {!!subtitle && (
                      <CustomText style={styles.subtitle} numberOfLines={2}>
                        {subtitle}
                      </CustomText>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="close" size={RFValue(22)} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.actionsList}
                contentContainerStyle={styles.actionsListContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled">
                {actions.map((action) => {
                  const iconColor =
                    action.iconColor ||
                    (action.destructive ? colors.error : colors.secondary);
                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionItem}
                      onPress={() => handleActionPress(action)}
                      activeOpacity={0.7}>
                      <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
                        <Icon name={action.icon} size={RFValue(20)} color={iconColor} />
                      </View>
                      <View style={styles.actionContent}>
                        <CustomText
                          style={[
                            styles.actionLabel,
                            action.destructive ? { color: colors.error } : undefined,
                          ]}
                          numberOfLines={1}>
                          {action.label}
                        </CustomText>
                        {!!action.description && (
                          <CustomText style={styles.actionDescription} numberOfLines={2}>
                            {action.description}
                          </CustomText>
                        )}
                      </View>
                      <View style={styles.chevronWrap}>
                        <Icon name="chevron-forward" size={RFValue(16)} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.85}>
                <CustomText style={styles.cancelText}>Cancel</CustomText>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomActionBottomSheet;
