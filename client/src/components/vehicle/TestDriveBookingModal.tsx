import React, { useState, FC } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import { createTestDrive } from '@service/testDriveService';
import { useToast } from '@hooks/useToast';
import CustomButton from '@components/ui/CustomButton';
import CustomDatePicker from '@components/ui/CustomDatePicker';
import CustomTimePicker from '@components/ui/CustomTimePicker';

interface ITestDriveBookingModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  allowTestDrive?: boolean;
}

const TestDriveBookingModal: FC<ITestDriveBookingModalProps> = ({
  visible,
  onClose,
  vehicleId,
  vehicleName,
  allowTestDrive = false,
}) => {
  console.log('TestDriveBookingModal render - visible:', visible, 'allowTestDrive:', allowTestDrive);
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  
  // Get tomorrow's date as default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!allowTestDrive) {
      showError('Test drive is not available for this vehicle');
      return;
    }

    if (!selectedDate) {
      showError('Please select a date');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected <= today) {
      showError('Please select a future date');
      return;
    }

    try {
      setLoading(true);
      await createTestDrive({
        vehicleId,
        preferredDate: new Date(selectedDate).toISOString(),
        preferredTime: selectedTime,
        notes: notes.trim() || undefined,
      });
      showSuccess('Test drive request submitted successfully');
      onClose();
      // Reset form
      setSelectedDate(getTomorrowDate());
      setSelectedTime('10:00');
      setNotes('');
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to book test drive');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      paddingBottom: 20,
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 16,
    },
    label: {
      fontSize: RFValue(12),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
      marginBottom: 10,
    },
    dateButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateButtonText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Medium,
      color: colors.text,
    },
    dateButtonPlaceholder: {
      color: colors.textSecondary,
    },
    notesInput: {
      minHeight: 100,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      color: colors.text,
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      textAlignVertical: 'top',
    },
    disabledText: {
      color: colors.textSecondary,
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      marginTop: 8,
    },
  });

  if (!allowTestDrive) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}>
          <View style={styles.container} onStartShouldSetResponder={() => true}>
                <View style={styles.header}>
                  <CustomText variant="h5" fontFamily={Fonts.Bold}>
                    Test Drive Not Available
                  </CustomText>
                  <TouchableOpacity onPress={onClose}>
                    <Icon name="close" size={RFValue(24)} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.content}>
                  <CustomText style={styles.disabledText}>
                    Test drive is not available for this vehicle. Please contact the dealer for more information.
                  </CustomText>
                </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
              <View style={styles.header}>
                <View>
                  <CustomText variant="h4" fontFamily={Fonts.SemiBold}>
                    Book Test Drive
                  </CustomText>
                  <CustomText variant="h8" style={{ color: colors.textSecondary, marginTop: 4 }}>
                    {vehicleName}
                  </CustomText>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={RFValue(24)} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                  <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.label}>Select Date</CustomText>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}>
                    <CustomText
                      variant="h5"
                      style={[
                        styles.dateButtonText,
                        !selectedDate && styles.dateButtonPlaceholder,
                      ]}>
                      {selectedDate
                        ? new Date(selectedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Select a date'}
                    </CustomText>
                    <Icon name="chevron-down" size={RFValue(16)} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.label}>Select Time</CustomText>
                  <CustomTimePicker selectedTime={selectedTime} onTimeSelect={setSelectedTime} />
                </View>

                <View style={styles.section}>
                  <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.label}>Additional Notes (Optional)</CustomText>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add any special requests or notes..."
                    placeholderTextColor={colors.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>

                <CustomButton
                  title={loading ? 'Submitting...' : 'Book Test Drive'}
                  onPress={handleSubmit}
                  disabled={loading}
                  loading={loading}
                />
              </ScrollView>
          </View>
        </TouchableOpacity>

        <CustomDatePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          minimumDate={new Date()}
        />
      </Modal>
    );
  };

export default TestDriveBookingModal;

