import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import { createTestDrive } from '@service/testDriveService';
import { getVehicleById } from '@service/vehicleService';
import type { IDealerVehicle } from '../../types/vehicle/IVehicle';
import CustomButton from '@components/ui/CustomButton';
import CustomDatePicker from '@components/ui/CustomDatePicker';
import CustomTimePicker from '@components/ui/CustomTimePicker';

type TestDriveBookingRouteParams = {
  TestDriveBooking: {
    vehicleId: string;
  };
};

const TestDriveBookingScreen: React.FC = () => {
  const route = useRoute<RouteProp<TestDriveBookingRouteParams, 'TestDriveBooking'>>();
  const navigation = useNavigation();
  const { vehicleId } = route.params;
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();

  const [vehicle, setVehicle] = useState<IDealerVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get tomorrow's date as default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setLoading(true);
        const response = await getVehicleById(vehicleId);
        if (response.success && response.Response) {
          let vehicleData: IDealerVehicle | null = null;
          if (response.Response.vehicles && Array.isArray(response.Response.vehicles)) {
            vehicleData = response.Response.vehicles[0] || null;
          } else if ((response.Response as any).id || (response.Response as any)._id) {
            vehicleData = response.Response as unknown as IDealerVehicle;
          }
          setVehicle(vehicleData);
          if (vehicleData && !vehicleData.allowTestDrive) {
            showError('Test drive is not available for this vehicle');
            navigation.goBack();
          }
        }
      } catch (error: any) {
        showError(error?.response?.data?.message || 'Failed to load vehicle');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      loadVehicle();
      setSelectedDate(getTomorrowDate());
    }
  }, [vehicleId]);

  const handleSubmit = async () => {
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
      setSubmitting(true);
      await createTestDrive({
        vehicleId,
        preferredDate: new Date(selectedDate).toISOString(),
        preferredTime: selectedTime,
        notes: notes.trim() || undefined,
      });
      showSuccess('Test drive request submitted successfully!');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to book test drive');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flexGrow: 1,
        },
        vehicleCard: {
          backgroundColor: colors.cardBackground,
          margin: 16,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        vehicleImage: {
          width: '100%',
          height: 200,
          backgroundColor: colors.backgroundSecondary,
        },
        vehicleInfo: {
          padding: 16,
        },
        vehicleTitle: {
          fontSize: RFValue(16),
          fontFamily: Fonts.Bold,
          color: colors.text,
          marginBottom: 8,
        },
        vehicleDetails: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        },
        detailBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundSecondary,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        },
        detailText: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Medium,
          color: colors.textSecondary,
          marginLeft: 6,
        },
        price: {
          fontSize: RFValue(18),
          fontFamily: Fonts.Bold,
          color: colors.secondary,
        },
        section: {
          backgroundColor: colors.cardBackground,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
        sectionTitle: {
          fontSize: RFValue(14),
          fontFamily: Fonts.SemiBold,
          color: colors.text,
          marginBottom: 12,
        },
        dateButton: {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 8,
          padding: 12,
          borderWidth: 1.5,
          borderColor: colors.border,
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
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 8,
          padding: 12,
          minHeight: 100,
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.text,
          borderWidth: 1.5,
          borderColor: colors.border,
          textAlignVertical: 'top',
        },
        notesInputFocused: {
          borderColor: colors.secondary,
        },
        submitButton: {
          margin: 16,
          marginTop: 8,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [colors, selectedTime],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Book Test Drive" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Book Test Drive" />
        <View style={styles.loadingContainer}>
          <CustomText>Vehicle not found</CustomText>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <CustomHeader title="Book Test Drive" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Vehicle Card */}
        <View style={styles.vehicleCard}>
          {vehicle.images && vehicle.images.length > 0 ? (
            <Image source={{ uri: vehicle.images[0] }} style={styles.vehicleImage} resizeMode="cover" />
          ) : (
            <View style={[styles.vehicleImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="car-outline" size={RFValue(60)} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.vehicleInfo}>
            <CustomText style={styles.vehicleTitle}>
              {vehicle.brand} {vehicle.vehicleModel}
            </CustomText>
            <View style={styles.vehicleDetails}>
              {vehicle.year && (
                <View style={styles.detailBadge}>
                  <Icon name="calendar-outline" size={RFValue(14)} color={colors.textSecondary} />
                  <CustomText style={styles.detailText}>{vehicle.year}</CustomText>
                </View>
              )}
              {vehicle.fuelType && (
                <View style={styles.detailBadge}>
                  <Icon name="flash-outline" size={RFValue(14)} color={colors.textSecondary} />
                  <CustomText style={styles.detailText}>{vehicle.fuelType}</CustomText>
                </View>
              )}
              {vehicle.transmission && (
                <View style={styles.detailBadge}>
                  <Icon name="settings-outline" size={RFValue(14)} color={colors.textSecondary} />
                  <CustomText style={styles.detailText}>{vehicle.transmission}</CustomText>
                </View>
              )}
            </View>
            <CustomText style={styles.price}>₹{vehicle.price?.toLocaleString()}</CustomText>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="calendar-outline" size={RFValue(18)} color={colors.secondary} style={{ marginRight: 8 }} />
            <CustomText variant="h4" fontFamily={Fonts.SemiBold}>Select Date</CustomText>
          </View>
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

        {/* Time Selection */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="time-outline" size={RFValue(18)} color={colors.secondary} style={{ marginRight: 8 }} />
            <CustomText variant="h4" fontFamily={Fonts.SemiBold}>Select Time</CustomText>
          </View>
          <CustomTimePicker selectedTime={selectedTime} onTimeSelect={setSelectedTime} />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="document-text-outline" size={RFValue(18)} color={colors.secondary} style={{ marginRight: 8 }} />
            <CustomText variant="h4" fontFamily={Fonts.SemiBold}>Additional Notes (Optional)</CustomText>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special requests or notes for the dealer..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitButton}>
          <CustomButton
            title={submitting ? 'Submitting...' : 'Book Test Drive'}
            onPress={handleSubmit}
            disabled={submitting || !selectedDate}
            loading={submitting}
          />
        </View>
      </ScrollView>

      <CustomDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        minimumDate={new Date()}
      />
    </KeyboardAvoidingView>
  );
};

export default TestDriveBookingScreen;

