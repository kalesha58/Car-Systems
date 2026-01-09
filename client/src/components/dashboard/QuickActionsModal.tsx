import React, { FC, useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';

interface IQuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface IQuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onTestDrivePress: () => void;
  onUpcomingBookingsPress: () => void;
  onPreBookingsPress: () => void;
}

const QuickActionsModal: FC<IQuickActionsModalProps> = ({
  visible,
  onClose,
  onTestDrivePress,
  onUpcomingBookingsPress,
  onPreBookingsPress,
}) => {
  const { colors } = useTheme();

  const actions: IQuickAction[] = useMemo(
    () => [
      {
        id: 'test-drive',
        label: 'Test Drive',
        icon: 'car-sport-outline',
        color: colors.secondary || '#4A90E2',
        onPress: onTestDrivePress,
      },
      {
        id: 'upcoming-bookings',
        label: 'Upcoming Bookings',
        icon: 'calendar-outline',
        color: colors.success || '#4CAF50',
        onPress: onUpcomingBookingsPress,
      },
      {
        id: 'pre-bookings',
        label: 'Manage Pre-Bookings',
        icon: 'bookmark-outline',
        color: colors.warning || '#FF9800',
        onPress: onPreBookingsPress,
      },
    ],
    [colors, onTestDrivePress, onUpcomingBookingsPress, onPreBookingsPress],
  );

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: RFValue(20),
      fontFamily: Fonts.Bold,
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    actionsContainer: {
      gap: 12,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    actionContent: {
      flex: 1,
    },
    actionLabel: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    actionDescription: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
    },
    chevron: {
      marginLeft: 8,
    },
  });

  const handleActionPress = (action: IQuickAction) => {
    action.onPress();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <CustomText style={styles.title}>Quick Actions</CustomText>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Icon name="close" size={RFValue(24)} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsContainer}>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionCard}
                    onPress={() => handleActionPress(action)}
                    activeOpacity={0.7}>
                    <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
                      <Icon name={action.icon} size={RFValue(24)} color={action.color} />
                    </View>
                    <View style={styles.actionContent}>
                      <CustomText style={styles.actionLabel}>{action.label}</CustomText>
                      <CustomText style={styles.actionDescription}>
                        {action.id === 'test-drive'
                          ? 'Manage test drive requests'
                          : action.id === 'upcoming-bookings'
                            ? 'View upcoming test drives and bookings'
                            : 'Manage vehicle pre-bookings'}
                      </CustomText>
                    </View>
                    <Icon
                      name="chevron-forward"
                      size={RFValue(20)}
                      color={colors.textSecondary}
                      style={styles.chevron}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default QuickActionsModal;



