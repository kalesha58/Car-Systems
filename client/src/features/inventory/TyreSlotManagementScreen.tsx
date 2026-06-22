import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import CustomButton from '@components/ui/CustomButton';
import CustomDatePicker from '@components/ui/CustomDatePicker';
import CustomTimePicker from '@components/ui/CustomTimePicker';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getDealerServiceSlots,
  createDealerServiceSlot,
  updateDealerServiceSlot,
  deleteDealerServiceSlot,
  IDealerServiceSlot,
} from '@service/dealerService';

type RouteParams = {
  TyreSlotManagement: {
    serviceId: string;
    serviceName?: string;
  };
};

const TyreSlotManagementScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'TyreSlotManagement'>>();
  const navigation = useNavigation();
  const { serviceId, serviceName } = route.params;
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();

  const [slots, setSlots] = useState<IDealerServiceSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('10:30');
  const [endTime, setEndTime] = useState('11:00');
  const [maxBookings, setMaxBookings] = useState('3');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadSlots = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getDealerServiceSlots(serviceId);
      setSlots(data);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load slots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serviceId, showError]);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    loadSlots();
  }, [loadSlots]);

  const handleCreateSlot = async () => {
    if (!selectedDate) {
      showError('Please select a date');
      return;
    }
    const capacity = parseInt(maxBookings, 10);
    if (!capacity || capacity < 1) {
      showError('Vehicle capacity must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      await createDealerServiceSlot(serviceId, {
        date: selectedDate,
        startTime,
        endTime,
        serviceType: 'center',
        maxBookings: capacity,
      });
      showSuccess('Slot created');
      loadSlots(true);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCapacity = async (slot: IDealerServiceSlot) => {
    const next = slot.maxBookings + 1;
    if (next > 10) {
      showError('Maximum capacity is 10');
      return;
    }
    try {
      await updateDealerServiceSlot(serviceId, slot.id, next);
      showSuccess(`Capacity updated to ${next}`);
      loadSlots(true);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update slot');
    }
  };

  const handleDeleteSlot = async (slot: IDealerServiceSlot) => {
    if (slot.currentBookings > 0) {
      showError('Cannot delete a slot with active bookings');
      return;
    }
    try {
      await deleteDealerServiceSlot(serviceId, slot.id);
      showSuccess('Slot deleted');
      loadSlots(true);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to delete slot');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    section: {
      margin: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { fontSize: RFValue(11), color: colors.textSecondary, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      marginBottom: 12,
    },
    slotCard: {
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });

  return (
    <View style={styles.container}>
      <CustomHeader
        title={serviceName ? `Slots — ${serviceName}` : 'Tyre Slots'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSlots(true); }} />
        }>
        <View style={styles.section}>
          <CustomText fontFamily={Fonts.Bold} style={{ marginBottom: 12 }}>
            Add Time Slot
          </CustomText>
          <CustomText style={styles.label}>Date</CustomText>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <CustomText>{selectedDate || 'Select date'}</CustomText>
          </TouchableOpacity>
          <CustomText style={styles.label}>Start time</CustomText>
          <CustomTimePicker selectedTime={startTime} onTimeSelect={setStartTime} />
          <CustomText style={[styles.label, { marginTop: 8 }]}>End time</CustomText>
          <CustomTimePicker selectedTime={endTime} onTimeSelect={setEndTime} />
          <CustomText style={[styles.label, { marginTop: 8 }]}>Vehicles allowed</CustomText>
          <TextInput
            style={styles.input}
            value={maxBookings}
            onChangeText={setMaxBookings}
            keyboardType="number-pad"
            placeholder="e.g. 3 or 4"
            placeholderTextColor={colors.textSecondary}
          />
          <CustomButton title="Create Slot" onPress={handleCreateSlot} loading={submitting} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.secondary} />
        ) : slots.length === 0 ? (
          <CustomText style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 24 }}>
            No slots yet. Create your first time slot above.
          </CustomText>
        ) : (
          slots.map(slot => (
            <View key={slot.id} style={styles.slotCard}>
              <View style={styles.row}>
                <View>
                  <CustomText fontFamily={Fonts.Bold}>
                    {slot.startTime} – {slot.endTime}
                  </CustomText>
                  <CustomText style={{ color: colors.textSecondary, fontSize: RFValue(11), marginTop: 4 }}>
                    {new Date(slot.date).toLocaleDateString('en-IN')} · {slot.currentBookings}/{slot.maxBookings} vehicles
                  </CustomText>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => handleUpdateCapacity(slot)}>
                    <Icon name="add-circle-outline" size={RFValue(22)} color={colors.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteSlot(slot)}>
                    <Icon name="trash-outline" size={RFValue(22)} color={colors.error || '#ef4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <CustomDatePicker
        visible={showDatePicker}
        selectedDate={selectedDate}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={date => {
          setSelectedDate(date);
          setShowDatePicker(false);
        }}
        minimumDate={new Date()}
      />
    </View>
  );
};

export default TyreSlotManagementScreen;
