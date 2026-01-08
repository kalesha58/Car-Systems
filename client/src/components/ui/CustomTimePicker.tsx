import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';

interface ICustomTimePickerProps {
  selectedTime: string; // HH:MM format
  onTimeSelect: (time: string) => void;
  timeSlots?: string[];
}

const CustomTimePicker: React.FC<ICustomTimePickerProps> = ({
  selectedTime,
  onTimeSelect,
  timeSlots,
}) => {
  const { colors } = useTheme();

  const defaultTimeSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
  ];

  const slots = timeSlots || defaultTimeSlots;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
        },
        timeSlotContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        timeSlot: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          borderWidth: 1.5,
          minWidth: 80,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
        timeSlotSelected: {
          backgroundColor: colors.secondary + '20',
          borderColor: colors.secondary,
        },
        timeSlotText: {
          fontSize: RFValue(11),
          fontFamily: Fonts.Medium,
          color: colors.text,
        },
        timeSlotTextSelected: {
          color: colors.secondary,
          fontFamily: Fonts.SemiBold,
        },
      }),
    [colors, selectedTime],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeSlotContainer}>
        {slots.map((time) => {
          const isSelected = selectedTime === time;
          return (
            <TouchableOpacity
              key={time}
              style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
              onPress={() => onTimeSelect(time)}
              activeOpacity={0.7}>
              <CustomText
                variant="h6"
                style={[
                  styles.timeSlotText,
                  isSelected && styles.timeSlotTextSelected,
                ]}>
                {time}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CustomTimePicker;

