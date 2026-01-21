import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import { useTheme } from '@hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { getServiceSlots } from '@service/serviceService';

export interface IServiceSlot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: 'center' | 'home';
  maxBookings: number;
  currentBookings: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceSlotPickerProps {
  serviceId: string;
  selectedDate: Date;
  serviceType?: 'center' | 'home';
  onSlotSelect: (slot: IServiceSlot) => void;
  selectedSlotId?: string;
}

const ServiceSlotPicker: React.FC<ServiceSlotPickerProps> = ({
  serviceId,
  selectedDate,
  serviceType,
  onSlotSelect,
  selectedSlotId,
}) => {
  const { colors } = useTheme();
  const [slots, setSlots] = useState<IServiceSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateString = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!serviceId || !dateString) return;

      try {
        setLoading(true);
        setError(null);
        const response = await getServiceSlots(serviceId, dateString, serviceType);
        setSlots(response.slots || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [serviceId, dateString, serviceType]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginVertical: 16,
        },
        title: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 12,
          color: colors.text,
        },
        slotsContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        slotButton: {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
          borderWidth: 1,
          minWidth: 100,
          alignItems: 'center',
        },
        slotButtonAvailable: {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
        slotButtonSelected: {
          backgroundColor: colors.secondary + '20',
          borderColor: colors.secondary,
        },
        slotButtonUnavailable: {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.disabled,
          opacity: 0.5,
        },
        slotText: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Medium,
        },
        slotTextAvailable: {
          color: colors.text,
        },
        slotTextSelected: {
          color: colors.secondary,
        },
        slotTextUnavailable: {
          color: colors.disabled,
        },
        emptyContainer: {
          padding: 20,
          alignItems: 'center',
        },
        emptyText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        loadingContainer: {
          padding: 20,
          alignItems: 'center',
        },
      }),
    [colors],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.secondary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="alert-circle-outline" size={RFValue(24)} color={colors.error} />
        <CustomText style={styles.emptyText}>{error}</CustomText>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="time-outline" size={RFValue(24)} color={colors.disabled} />
        <CustomText style={styles.emptyText}>
          No available slots for this date
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomText style={styles.title}>
        Available {serviceType === 'home' ? 'Home Service' : 'Center'} Slots
      </CustomText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.slotsContainer}>
          {slots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            const isAvailable = slot.isAvailable && slot.currentBookings < slot.maxBookings;

            return (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotButton,
                  isSelected
                    ? styles.slotButtonSelected
                    : isAvailable
                    ? styles.slotButtonAvailable
                    : styles.slotButtonUnavailable,
                ]}
                onPress={() => {
                  if (isAvailable) {
                    onSlotSelect(slot);
                  }
                }}
                disabled={!isAvailable}
                activeOpacity={0.7}>
                <CustomText
                  style={[
                    styles.slotText,
                    isSelected
                      ? styles.slotTextSelected
                      : isAvailable
                      ? styles.slotTextAvailable
                      : styles.slotTextUnavailable,
                  ]}>
                  {slot.startTime} - {slot.endTime}
                </CustomText>
                {slot.maxBookings > 1 && (
                  <CustomText
                    style={[
                      styles.slotText,
                      { fontSize: RFValue(10), marginTop: 2 },
                      isSelected
                        ? styles.slotTextSelected
                        : isAvailable
                        ? styles.slotTextAvailable
                        : styles.slotTextUnavailable,
                    ]}>
                    {slot.maxBookings - slot.currentBookings} left
                  </CustomText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default ServiceSlotPicker;
