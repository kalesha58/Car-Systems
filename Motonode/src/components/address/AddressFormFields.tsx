import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BookingPickerSheet } from '@components/booking/pickers/BookingPickerSheet';
import { COUNTRIES, INDIAN_STATES } from '@constants/indianStates';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

export interface AddressFormValues {
  label: string;
  fullAddress: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
}

interface AddressFormFieldsProps {
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
  currentLocationText?: string;
  onUpdateLocation?: () => void;
  updatingLocation?: boolean;
  showCurrentLocation?: boolean;
}

function PickerField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <Pressable
        onPress={() => {
          lightHaptic();
          onPress();
        }}
        style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
      >
        <Text style={{ color: value ? colors.textPrimary : colors.textSecondary, flex: 1 }}>
          {value || placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

export function AddressFormFields({
  values,
  onChange,
  currentLocationText,
  onUpdateLocation,
  updatingLocation,
  showCurrentLocation = false,
}: AddressFormFieldsProps) {
  const colors = useColors();
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const setField = <K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <View style={styles.container}>
      {showCurrentLocation ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Current Live Location</Text>
          <View style={styles.locationRow}>
            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={3}>
              {currentLocationText || 'Fetching location...'}
            </Text>
            <Pressable
              style={styles.updateBtn}
              onPress={() => {
                lightHaptic();
                onUpdateLocation?.();
              }}
              disabled={updatingLocation}
            >
              {updatingLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Feather name="refresh-cw" size={14} color={colors.primary} />
                  <Text style={[styles.updateText, { color: colors.primary }]}>Update</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Address Details</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Label (Optional)</Text>
          <TextInput
            value={values.label}
            onChangeText={text => setField('label', text)}
            placeholder="e.g. Home, Office, Workshop"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Full Address</Text>
          <TextInput
            value={values.fullAddress}
            onChangeText={text => setField('fullAddress', text)}
            placeholder="Enter your full address"
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.textArea,
              { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background },
            ]}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>City</Text>
            <TextInput
              value={values.city}
              onChangeText={text => setField('city', text)}
              placeholder="City"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
            />
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Pincode</Text>
            <TextInput
              value={values.pincode}
              onChangeText={text => setField('pincode', text.replace(/\D/g, '').slice(0, 6))}
              placeholder="Pincode"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
            />
          </View>
        </View>

        <PickerField
          label="State"
          value={values.state}
          placeholder="Select state"
          onPress={() => setStatePickerVisible(true)}
        />
        <PickerField
          label="Country"
          value={values.country}
          placeholder="Select country"
          onPress={() => setCountryPickerVisible(true)}
        />
      </View>

      <BookingPickerSheet
        visible={statePickerVisible}
        title="Select State"
        onClose={() => setStatePickerVisible(false)}
      >
        {INDIAN_STATES.map(item => (
          <Pressable
            key={item.value}
            style={[styles.option, values.state === item.value && { backgroundColor: colors.muted }]}
            onPress={() => {
              setField('state', item.value);
              setStatePickerVisible(false);
            }}
          >
            <Text style={{ color: colors.textPrimary }}>{item.label}</Text>
          </Pressable>
        ))}
      </BookingPickerSheet>

      <BookingPickerSheet
        visible={countryPickerVisible}
        title="Select Country"
        onClose={() => setCountryPickerVisible(false)}
      >
        {COUNTRIES.map(item => (
          <Pressable
            key={item.value}
            style={[styles.option, values.country === item.value && { backgroundColor: colors.muted }]}
            onPress={() => {
              setField('country', item.value);
              setCountryPickerVisible(false);
            }}
          >
            <Text style={{ color: colors.textPrimary }}>{item.label}</Text>
          </Pressable>
        ))}
      </BookingPickerSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  locationRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  locationText: { flex: 1, fontSize: 14, lineHeight: 20 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  updateText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 96, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  picker: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
});
