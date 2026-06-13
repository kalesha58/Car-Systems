import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import CustomButton from '@components/ui/CustomButton';
import CustomDatePicker from '@components/ui/CustomDatePicker';
import CustomTimePicker from '@components/ui/CustomTimePicker';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import Icon from 'react-native-vector-icons/Ionicons';
import { Fonts, fontStyle } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { getServiceById } from '@service/serviceService';
import { createServiceBooking } from '@service/serviceBookingService';
import { getSubcategoryLabel } from '@config/serviceCategoryConfig';
import type { IService } from '../../types/service/IService';
import type { ServiceTypeValue } from '@config/serviceCategoryConfig';

type TyreServiceRequestRouteParams = {
  TyreServiceRequest: {
    serviceId: string;
  };
};

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const TyreServiceRequestScreen: React.FC = () => {
  const route = useRoute<RouteProp<TyreServiceRequestRouteParams, 'TyreServiceRequest'>>();
  const navigation = useNavigation();
  const { serviceId } = route.params;
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();

  const [service, setService] = useState<IService | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await getServiceById(serviceId);
        let svc: IService | null = null;
        if (response.success && response.Response) {
          if (Array.isArray((response.Response as any).services)) {
            svc = (response.Response as any).services[0] || null;
          } else if ((response.Response as any).id || (response.Response as any).name) {
            svc = response.Response as unknown as IService;
          }
        }
        if (!svc || svc.serviceType !== 'tire_service') {
          showError('This service is not available for tyre requests');
          navigation.goBack();
          return;
        }
        setService(svc);
        setSelectedDate(getTomorrowDate());
      } catch (error: any) {
        showError(error?.response?.data?.message || 'Failed to load service');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [serviceId, navigation, showError]);

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
      await createServiceBooking({
        serviceId,
        preferredDate: new Date(selectedDate).toISOString(),
        preferredTime: selectedTime,
        notes: notes.trim() || undefined,
        vehicleInfo:
          vehicleBrand.trim() || vehicleModel.trim() || registrationNumber.trim()
            ? {
                brand: vehicleBrand.trim() || undefined,
                model: vehicleModel.trim() || undefined,
                registrationNumber: registrationNumber.trim() || undefined,
              }
            : undefined,
        requestLocation:
          service?.homeService && locationAddress.trim()
            ? { address: locationAddress.trim() }
            : undefined,
      });
      showSuccess('Tyre service request submitted!');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const subcategoryLabel = getSubcategoryLabel(
    service?.serviceType as ServiceTypeValue | undefined,
    service?.serviceSubCategory,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { flexGrow: 1, paddingBottom: 24 },
        section: {
          backgroundColor: colors.cardBackground,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 12,
          padding: 16,
        },
        summaryTitle: {
          fontSize: RFValue(14),
          ...fontStyle(Fonts.Bold),
          color: colors.text,
          marginBottom: 4,
        },
        summaryText: {
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Regular),
          color: colors.textSecondary,
          marginTop: 2,
        },
        label: {
          fontSize: RFValue(12),
          ...fontStyle(Fonts.SemiBold),
          color: colors.text,
          marginBottom: 8,
        },
        input: {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 8,
          padding: 12,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          ...fontStyle(Fonts.Regular),
          fontSize: RFValue(12),
        },
        dateButton: {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        submitButton: { margin: 16, marginTop: 8 },
      }),
    [colors],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Request Tyre Service" />
        <ScrollView contentContainerStyle={styles.content}>
          <SkeletonLoader width="92%" height={100} borderRadius={12} style={{ margin: 16 }} />
          <SkeletonLoader width="92%" height={80} borderRadius={12} style={{ marginHorizontal: 16 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <CustomHeader title="Request Tyre Service" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.section, { marginTop: 16 }]}>
          <CustomText style={styles.summaryTitle}>{service?.name}</CustomText>
          {subcategoryLabel && (
            <CustomText style={styles.summaryText}>Type: {subcategoryLabel}</CustomText>
          )}
          <CustomText style={styles.summaryText}>
            {service?.homeService ? 'Home Service' : 'Store Service'}
          </CustomText>
          {service?.dealer?.businessName && (
            <CustomText style={styles.summaryText}>Dealer: {service.dealer.businessName}</CustomText>
          )}
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>Preferred Date *</CustomText>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}>
            <CustomText style={{ color: colors.text }}>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Select date'}
            </CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>Preferred Time *</CustomText>
          <CustomTimePicker selectedTime={selectedTime} onTimeSelect={setSelectedTime} />
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>Vehicle Brand</CustomText>
          <TextInput
            style={styles.input}
            placeholder="e.g. Honda"
            placeholderTextColor={colors.textSecondary}
            value={vehicleBrand}
            onChangeText={setVehicleBrand}
          />
          <CustomText style={[styles.label, { marginTop: 12 }]}>Vehicle Model</CustomText>
          <TextInput
            style={styles.input}
            placeholder="e.g. City"
            placeholderTextColor={colors.textSecondary}
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />
          <CustomText style={[styles.label, { marginTop: 12 }]}>Registration Number</CustomText>
          <TextInput
            style={styles.input}
            placeholder="e.g. KA01AB1234"
            placeholderTextColor={colors.textSecondary}
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            autoCapitalize="characters"
          />
        </View>

        {service?.homeService && (
          <View style={styles.section}>
            <CustomText style={styles.label}>Service Location</CustomText>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Enter your location or address"
              placeholderTextColor={colors.textSecondary}
              value={locationAddress}
              onChangeText={setLocationAddress}
              multiline
            />
          </View>
        )}

        <View style={styles.section}>
          <CustomText style={styles.label}>Notes</CustomText>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Describe the issue (e.g. flat tyre, roadside)"
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={styles.submitButton}>
          <CustomButton
            title={submitting ? 'Submitting...' : 'Submit Request'}
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

export default TyreServiceRequestScreen;
