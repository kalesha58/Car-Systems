import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { AddressFormFields, type AddressFormValues } from '@components/address';
import { PrimaryButton } from '@components/buttons';
import { CustomerStackRoutes } from '@constants/routes';
import { DEFAULT_COORDINATES } from '@constants/indianStates';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { saveAddress, updateAddress } from '@services/address.service';
import type { IAddress } from '@app-types/address';
import { buildAddressFormData, isValidIndianPhone } from '@utils/addressHelpers';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { setSelectedDeliveryAddressId } from '@utils/deliveryAddress';
import { successHaptic } from '@utils/haptics';

type RouteParams = {
  address?: IAddress;
  isEdit?: boolean;
};

type NavigationProp = NativeStackNavigationProp<{
  [CustomerStackRoutes.SavedAddresses]: undefined;
}>;

function addressToFormValues(address: IAddress): AddressFormValues {
  return {
    label: address.name,
    fullAddress: address.fullAddress,
    city: address.townOrCity ?? '',
    pincode: address.pincode ?? '',
    state: address.state ?? '',
    country: 'India',
  };
}

export function ManualAddressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { address, isEdit } = route.params ?? {};
  const [formValues, setFormValues] = useState<AddressFormValues>(
    address
      ? addressToFormValues(address)
      : {
          label: '',
          fullAddress: '',
          city: '',
          pincode: '',
          state: '',
          country: 'India',
        },
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const phone = user?.phone ?? '';
    if (!formValues.fullAddress.trim()) {
      Alert.alert('Missing address', 'Please enter your full address.');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      Alert.alert('Phone required', 'A valid 10-digit phone number is required on your profile.');
      return;
    }

    const coordinates = address?.coordinates ?? DEFAULT_COORDINATES;

    setSaving(true);
    try {
      const payload = buildAddressFormData({
        label: formValues.label,
        phone,
        fullAddress: formValues.fullAddress,
        city: formValues.city,
        pincode: formValues.pincode,
        state: formValues.state,
        coordinates,
        isDefault: address?.isDefault,
      });

      if (isEdit && address?._id) {
        await updateAddress(address._id, payload);
        await setSelectedDeliveryAddressId(address._id);
      } else {
        const saved = await saveAddress(payload);
        if (saved._id) {
          await setSelectedDeliveryAddressId(saved._id);
        }
      }
      successHaptic();
      navigation.navigate(CustomerStackRoutes.SavedAddresses);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to save address'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'Enter Address'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          <AddressFormFields values={formValues} onChange={setFormValues} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        <PrimaryButton label={saving ? 'Saving...' : 'Save Address'} onPress={handleSave} disabled={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  content: { padding: 20 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
});
