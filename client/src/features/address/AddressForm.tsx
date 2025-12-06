import {View, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import CustomInput from '@components/ui/CustomInput';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {goBack, navigate} from '@utils/NavigationUtils';
import {saveAddress, updateAddress} from '@service/addressService';
import {ILocationData, IAddressFormData, IAddress} from '../../types/address/IAddress';

interface RouteParams {
  location?: ILocationData;
  address?: IAddress;
  isEdit?: boolean;
}

const AddressForm = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {location, address, isEdit} = (route.params as RouteParams) || {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('home');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEdit && address) {
      // Pre-fill form with address data in edit mode
      setName(address.name);
      setPhone(address.phone);
      setAddressType(address.addressType);
      // Extract additional details if any (assuming fullAddress contains formattedAddress + additional)
      const mainAddress = address.fullAddress.split(',')[0];
      const additional = address.fullAddress.replace(mainAddress, '').trim();
      if (additional.startsWith(',')) {
        setAdditionalDetails(additional.substring(1).trim());
      } else {
        setAdditionalDetails(additional);
      }
    } else if (!location) {
      Alert.alert('Error', 'Location data is missing');
      goBack();
    }
  }, [location, address, isEdit]);

  const getIconType = (type: 'home' | 'office' | 'other'): 'home' | 'building' | 'location' => {
    switch (type) {
      case 'home':
        return 'home';
      case 'office':
        return 'building';
      case 'other':
        return 'location';
      default:
        return 'location';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    if (isEdit && address) {
      // Edit mode
      if (!address._id) {
        Alert.alert('Error', 'Invalid address ID');
        return;
      }

      setIsLoading(true);

      try {
        const addressData: Partial<IAddressFormData> = {
          name: name.trim(),
          phone: phone.trim(),
          fullAddress: additionalDetails.trim()
            ? `${address.fullAddress.split(',')[0]}, ${additionalDetails.trim()}`
            : address.fullAddress,
          addressType,
          iconType: getIconType(addressType),
        };

        await updateAddress(address._id, addressData);

        Alert.alert('Success', 'Address updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigate('SavedAddresses');
            },
          },
        ]);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update address. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Add mode
      if (!location) {
        Alert.alert('Error', 'Location data is missing');
        return;
      }

      setIsLoading(true);

      try {
        const addressData: IAddressFormData = {
          name: name.trim(),
          phone: phone.trim(),
          fullAddress: additionalDetails.trim()
            ? `${location.formattedAddress}, ${additionalDetails.trim()}`
            : location.formattedAddress,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          addressType,
          iconType: getIconType(addressType),
        };

        await saveAddress(addressData);

        Alert.alert('Success', 'Address saved successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigate('SavedAddresses');
            },
          },
        ]);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save address. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isEdit && !location) {
    return null;
  }

  const currentLocation = isEdit && address
    ? {
        address: address.fullAddress.split(',')[0],
        formattedAddress: address.fullAddress,
        latitude: address.coordinates.latitude,
        longitude: address.coordinates.longitude,
      }
    : location;

  return (
    <View style={styles.container}>
      <CustomHeader title={isEdit ? 'Edit address details' : 'Add address details'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {currentLocation && (
          <View style={styles.addressPreview}>
            <View style={styles.addressRow}>
              <Icon name="location" size={RFValue(16)} color={Colors.secondary} />
              <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={styles.addressText}>
                {currentLocation.address.split(',')[0]}
              </CustomText>
            </View>
            <CustomText variant="h8" style={styles.fullAddress} numberOfLines={3}>
              {currentLocation.formattedAddress}
            </CustomText>
          </View>
        )}

        <CustomInput
          value={name}
          onChangeText={setName}
          placeholder="Name (e.g., John, Home)"
          left={
            <Icon
              name="person-outline"
              color={Colors.secondary}
              style={{marginLeft: 10}}
              size={RFValue(18)}
            />
          }
          right={false}
        />

        <CustomInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          inputMode="tel"
          left={
            <Icon
              name="call-outline"
              color={Colors.secondary}
              style={{marginLeft: 10}}
              size={RFValue(18)}
            />
          }
          right={false}
        />

        <View style={styles.addressTypeContainer}>
          <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.label}>
            Address Type
          </CustomText>
          <View style={styles.typeButtons}>
            {(['home', 'office', 'other'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  addressType === type && styles.typeButtonActive,
                ]}
                onPress={() => setAddressType(type)}>
                <Icon
                  name={
                    type === 'home'
                      ? 'home-outline'
                      : type === 'office'
                      ? 'business-outline'
                      : 'location-outline'
                  }
                  size={RFValue(18)}
                  color={addressType === type ? '#fff' : Colors.text}
                />
                <CustomText
                  variant="h8"
                  fontFamily={Fonts.Medium}
                  style={
                    addressType === type
                      ? [styles.typeButtonText, styles.typeButtonTextActive]
                      : styles.typeButtonText
                  }>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.additionalDetailsContainer}>
          <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.label}>
            Additional Details (Optional)
          </CustomText>
          <View style={styles.textAreaContainer}>
            <CustomInput
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              placeholder="Flat number, building name, landmark, etc."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              left={
                <Icon
                  name="information-circle-outline"
                  color={Colors.secondary}
                  style={{marginLeft: 10, marginTop: 10}}
                  size={RFValue(18)}
                />
              }
              right={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading || !name.trim() || !phone.trim()}>
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={styles.saveButtonText}>
            {isLoading
              ? isEdit
                ? 'Updating...'
                : 'Saving...'
              : isEdit
              ? 'Update Address'
              : 'Save Address'}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  addressPreview: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressText: {
    color: Colors.text,
    flex: 1,
  },
  fullAddress: {
    color: Colors.text,
    opacity: 0.8,
    marginLeft: 24,
  },
  addressTypeContainer: {
    marginBottom: 20,
  },
  label: {
    color: Colors.text,
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  typeButtonText: {
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  additionalDetailsContainer: {
    marginBottom: 20,
  },
  textAreaContainer: {
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  saveButtonText: {
    color: '#fff',
  },
});

export default AddressForm;

