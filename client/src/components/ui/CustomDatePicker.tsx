import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';

interface ICustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD format
  onDateSelect: (date: string) => void;
  minimumDate?: Date;
}

const CustomDatePicker: React.FC<ICustomDatePickerProps> = ({
  visible,
  onClose,
  selectedDate,
  onDateSelect,
  minimumDate,
}) => {
  const { colors } = useTheme();

  const today = new Date();
  const minDate = minimumDate || today;
  minDate.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateDisabled = (date: Date): boolean => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < minDate;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return formatDate(date) === selectedDate;
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(date)) {
      onDateSelect(formatDate(date));
      onClose();
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        container: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: Platform.OS === 'ios' ? 20 : 16,
          maxHeight: '80%',
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        monthNav: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        },
        monthText: {
          minWidth: 150,
          textAlign: 'center',
        },
        navButton: {
          padding: 8,
        },
        content: {
          padding: 16,
        },
        weekDays: {
          flexDirection: 'row',
          marginBottom: 8,
        },
        weekDay: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
        },
        calendarGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        emptyDay: {
          flex: 1,
          minWidth: '14.28%',
          aspectRatio: 1,
        },
        dayButton: {
          flex: 1,
          minWidth: '14.28%',
          aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          margin: 2,
        },
        dayButtonDisabled: {
          opacity: 0.3,
        },
        dayButtonSelected: {
          backgroundColor: colors.secondary,
        },
        dayText: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Medium,
        },
        dayTextSelected: {
          color: '#fff',
          fontFamily: Fonts.SemiBold,
        },
        dayTextDisabled: {
          color: colors.textSecondary,
        },
      }),
    [colors, currentMonth],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <CustomText variant="h4" fontFamily={Fonts.SemiBold}>
                  Select Date
                </CustomText>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={RFValue(20)} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <View style={styles.monthNav}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigateMonth('prev')}
                    activeOpacity={0.7}>
                    <Icon name="chevron-back" size={RFValue(20)} color={colors.text} />
                  </TouchableOpacity>
                  <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.monthText}>
                    {monthName}
                  </CustomText>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigateMonth('next')}
                    activeOpacity={0.7}>
                    <Icon name="chevron-forward" size={RFValue(20)} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekDays}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <View key={day} style={styles.weekDay}>
                      <CustomText variant="h8" style={{ color: colors.textSecondary }}>
                        {day}
                      </CustomText>
                    </View>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {emptyDays.map((_, index) => (
                    <View key={`empty-${index}`} style={styles.emptyDay} />
                  ))}
                  {days.map((day) => {
                    const date = new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day,
                    );
                    const disabled = isDateDisabled(date);
                    const selected = isDateSelected(date);

                    return (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          selected && styles.dayButtonSelected,
                          disabled && styles.dayButtonDisabled,
                        ]}
                        onPress={() => handleDateSelect(day)}
                        disabled={disabled}
                        activeOpacity={0.7}>
                        <CustomText
                          variant="h6"
                          style={[
                            styles.dayText,
                            selected && styles.dayTextSelected,
                            disabled && !selected && styles.dayTextDisabled,
                            !disabled && !selected && { color: colors.text },
                          ]}>
                          {day}
                        </CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomDatePicker;












