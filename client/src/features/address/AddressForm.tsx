import {View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput} from 'react-native';
import React, {useState, useEffect, useMemo} from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import CustomInput from '@components/ui/CustomInput';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {goBack, navigate, replace} from '@utils/NavigationUtils';
import {saveAddress, updateAddress} from '@service/addressService';
import {ILocationData, IAddressFormData, IAddress} from '../../types/address/IAddress';
import {useTranslation} from 'react-i18next';
import {useToast} from '@hooks/useToast';
import {useTheme} from '@hooks/useTheme';

interface RouteParams {
  location?: ILocationData | null;
  address?: IAddress;
  isEdit?: boolean;
  selectMode?: boolean;
  isManualEntry?: boolean;
}

const AddressForm = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {showSuccess, showError} = useToast();
  const {colors} = useTheme();
  const {location, address, isEdit, selectMode, isManualEntry} = (route.params as RouteParams) || {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('home');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [nearbyLocation, setNearbyLocation] = useState('');
  const [alternateNumber, setAlternateNumber] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [townOrCity, setTownOrCity] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // For manual entry, we need coordinates - use default or allow user to set
  const [manualCoordinates, setManualCoordinates] = useState<{latitude: number; longitude: number} | null>(null);

  const isValidPhone = (phoneNumber: string): boolean => {
    const cleanedPhone = phoneNumber.trim();
    return /^[0-9]{10}$/.test(cleanedPhone);
  };

  const isFormValid = (): boolean => {
    return name.trim().length > 0 && isValidPhone(phone);
  };

  const handlePhoneChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setPhone(numericText);
    }
  };

  const handleAlternateNumberChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setAlternateNumber(numericText);
    }
  };

  useEffect(() => {
    if (isEdit && address) {
      // Pre-fill form with address data in edit mode
      setName(address.name);
      setPhone(address.phone);
      setAddressType(address.addressType);
      setLocationDescription(address.locationDescription || '');
      setNearbyLocation(address.nearbyLocation || '');
      setAlternateNumber(address.alternateNumber || '');
      setFlatNumber(address.flatNumber || '');
      setBuildingName(address.buildingName || '');
      setTownOrCity(address.townOrCity || '');
      setIsDefault(address.isDefault || false);
      // Extract additional details if any (assuming fullAddress contains formattedAddress + additional)
      const mainAddress = address.fullAddress.split(',')[0];
      const additional = address.fullAddress.replace(mainAddress, '').trim();
      if (additional.startsWith(',')) {
        setAdditionalDetails(additional.substring(1).trim());
      } else {
        setAdditionalDetails(additional);
      }
    } else if (!location && !isManualEntry) {
      showError('Location data is missing');
      goBack();
    } else if (isManualEntry && !manualCoordinates) {
      // For manual entry, set default coordinates (can be updated)
      setManualCoordinates({latitude: 17.385044, longitude: 78.486671});
    }
  }, [location, address, isEdit, isManualEntry]);

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
      showError('Please enter a name');
      return;
    }

    if (!phone.trim()) {
      showError('Please enter a phone number');
      return;
    }

    if (!isValidPhone(phone)) {
      showError('Please enter a valid 10-digit phone number');
      return;
    }

    if (isEdit && address) {
      // Edit mode
      if (!address._id) {
        showError('Invalid address ID');
        return;
      }

      setIsLoading(true);

      try {
        // Build full address from components
        let fullAddr = address.fullAddress.split(',')[0];
        const addressParts = [];
        if (flatNumber.trim()) addressParts.push(`Flat ${flatNumber.trim()}`);
        if (buildingName.trim()) addressParts.push(buildingName.trim());
        if (nearbyLocation.trim()) addressParts.push(`Near ${nearbyLocation.trim()}`);
        if (townOrCity.trim()) addressParts.push(townOrCity.trim());
        if (additionalDetails.trim()) addressParts.push(additionalDetails.trim());
        
        if (addressParts.length > 0) {
          fullAddr = `${fullAddr}, ${addressParts.join(', ')}`;
        }

        const addressData: Partial<IAddressFormData> = {
          name: name.trim(),
          phone: phone.trim(),
          fullAddress: fullAddr,
          addressType,
          iconType: getIconType(addressType),
          locationDescription: addressType === 'other' ? locationDescription.trim() : undefined,
          nearbyLocation: nearbyLocation.trim() || undefined,
          alternateNumber: alternateNumber.trim() || undefined,
          flatNumber: flatNumber.trim() || undefined,
          buildingName: buildingName.trim() || undefined,
          townOrCity: townOrCity.trim() || undefined,
          isDefault,
        };

        await updateAddress(address._id, addressData);

        setIsLoading(false);
        showSuccess('Address updated successfully');
        
        setTimeout(() => {
          replace('SavedAddresses', selectMode ? {selectMode: true} : undefined);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
        showError(error instanceof Error ? error.message : 'Failed to update address. Please try again.');
      }
    } else {
      // Add mode
      let coordinates = {latitude: 0, longitude: 0};
      let baseAddress = '';

      if (isManualEntry) {
        if (!manualCoordinates) {
          showError('Please set location coordinates');
          return;
        }
        coordinates = manualCoordinates;
        // Build address from manual fields
        const addressParts = [];
        if (flatNumber.trim()) addressParts.push(`Flat ${flatNumber.trim()}`);
        if (buildingName.trim()) addressParts.push(buildingName.trim());
        if (nearbyLocation.trim()) addressParts.push(`Near ${nearbyLocation.trim()}`);
        if (townOrCity.trim()) addressParts.push(townOrCity.trim());
        if (additionalDetails.trim()) addressParts.push(additionalDetails.trim());
        baseAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Manual Address';
      } else {
        if (!location) {
          showError('Location data is missing');
          return;
        }
        coordinates = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
        baseAddress = location.formattedAddress;
      }

      setIsLoading(true);

      try {
        // Build full address
        const addressParts = [];
        if (flatNumber.trim()) addressParts.push(`Flat ${flatNumber.trim()}`);
        if (buildingName.trim()) addressParts.push(buildingName.trim());
        if (nearbyLocation.trim()) addressParts.push(`Near ${nearbyLocation.trim()}`);
        if (townOrCity.trim()) addressParts.push(townOrCity.trim());
        if (additionalDetails.trim()) addressParts.push(additionalDetails.trim());
        
        const fullAddress = addressParts.length > 0
          ? `${baseAddress}, ${addressParts.join(', ')}`
          : baseAddress;

        const addressData: IAddressFormData = {
          name: name.trim(),
          phone: phone.trim(),
          fullAddress,
          coordinates,
          addressType,
          iconType: getIconType(addressType),
          locationDescription: addressType === 'other' ? locationDescription.trim() : undefined,
          nearbyLocation: nearbyLocation.trim() || undefined,
          alternateNumber: alternateNumber.trim() || undefined,
          flatNumber: flatNumber.trim() || undefined,
          buildingName: buildingName.trim() || undefined,
          townOrCity: townOrCity.trim() || undefined,
          isDefault,
        };

        await saveAddress(addressData);

        setIsLoading(false);
        showSuccess('Address saved successfully');
        
        setTimeout(() => {
          replace('SavedAddresses', selectMode ? {selectMode: true} : undefined);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
        showError(error instanceof Error ? error.message : 'Failed to save address. Please try again.');
      }
    }
  };

  if (!isEdit && !location && !isManualEntry) {
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          padding: 15,
          paddingBottom: 30,
        },
        addressPreview: {
          backgroundColor: colors.backgroundSecondary,
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
          color: colors.text,
          flex: 1,
        },
        fullAddress: {
          color: colors.text,
          opacity: 0.8,
          marginLeft: 24,
        },
        addressTypeContainer: {
          marginBottom: 20,
        },
        label: {
          color: colors.text,
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
          borderColor: colors.border,
          backgroundColor: colors.cardBackground,
        },
        typeButtonActive: {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
        },
        typeButtonText: {
          color: colors.text,
        },
        typeButtonTextActive: {
          color: colors.white,
        },
        additionalDetailsContainer: {
          marginBottom: 20,
        },
        textAreaContainer: {
          minHeight: 100,
        },
        defaultAddressContainer: {
          marginBottom: 20,
          paddingVertical: 10,
        },
        checkboxContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        checkbox: {
          width: RFValue(20),
          height: RFValue(20),
          borderRadius: 4,
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.cardBackground,
          justifyContent: 'center',
          alignItems: 'center',
        },
        checkboxChecked: {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
        },
        checkboxLabel: {
          color: colors.text,
          flex: 1,
        },
        saveButton: {
          backgroundColor: colors.secondary,
          paddingVertical: 15,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 10,
        },
        saveButtonDisabled: {
          backgroundColor: colors.disabled,
          opacity: 0.6,
        },
        saveButtonText: {
          color: colors.white,
        },
        saveButtonTextDisabled: {
          opacity: 0.7,
        },
      }),
    [colors],
  );

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
              <Icon name="location" size={RFValue(16)} color={colors.secondary} />
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
          onChangeText={handlePhoneChange}
          placeholder="Phone number (10 digits)"
          inputMode="tel"
          keyboardType="numeric"
          maxLength={10}
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
            {t('address.addressType')}
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
                  color={addressType === type ? colors.white : colors.text}
                />
                <CustomText
                  variant="h8"
                  fontFamily={Fonts.Medium}
                  style={
                    addressType === type
                      ? [styles.typeButtonText, styles.typeButtonTextActive]
                      : styles.typeButtonText
                  }>
                  {t(`address.${type}`)}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {addressType === 'other' && (
          <CustomInput
            value={locationDescription}
            onChangeText={setLocationDescription}
            placeholder="What is this location? (e.g., uncle's house, grandma's house)"
            left={
              <Icon
                name="information-circle-outline"
                color={Colors.secondary}
                style={{marginLeft: 10}}
                size={RFValue(18)}
              />
            }
            right={false}
          />
        )}

        <CustomInput
          value={nearbyLocation}
          onChangeText={setNearbyLocation}
          placeholder="Nearby location (landmark, area)"
          left={
            <Icon
              name="location-outline"
              color={Colors.secondary}
              style={{marginLeft: 10}}
              size={RFValue(18)}
            />
          }
          right={false}
        />

        <CustomInput
          value={flatNumber}
          onChangeText={setFlatNumber}
          placeholder="Flat number"
          left={
            <Icon
              name="home-outline"
              color={Colors.secondary}
              style={{marginLeft: 10}}
              size={RFValue(18)}
            />
          }
          right={false}
        />

        <CustomInput
          value={buildingName}
          onChangeText={setBuildingName}
          placeholder="Building name"
          left={
            <Icon
              name="business-outline"
              color={Colors.secondary}
              style={{marginLeft: 10}}
              size={RFValue(18)}
            />
          }
          right={false}
        />

        <CustomInput
          value={townOrCity}
          onChangeText={setTownOrCity}
          placeholder="Town or City"
          left={
            <Icon
              name="map-outline"
              color={Colors.secondary}
              style={{marginLeft: 10}}
              size={RFValue(18)}
            />
          }
          right={false}
        />

        <CustomInput
          value={alternateNumber}
          onChangeText={handleAlternateNumberChange}
          placeholder="Alternate number (optional)"
          inputMode="tel"
          keyboardType="numeric"
          maxLength={10}
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

        <View style={styles.additionalDetailsContainer}>
          <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.label}>
            Additional Details (Optional)
          </CustomText>
          <View style={styles.textAreaContainer}>
            <CustomInput
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              placeholder="Any other details..."
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

        <View style={styles.defaultAddressContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsDefault(!isDefault)}
            activeOpacity={0.7}>
            <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
              {isDefault && (
                <Icon name="checkmark" size={RFValue(16)} color="#fff" />
              )}
            </View>
            <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.checkboxLabel}>
              Make this my default address
            </CustomText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid() || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid() || isLoading}>
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={[
              styles.saveButtonText,
              (!isFormValid() || isLoading) && styles.saveButtonTextDisabled,
            ]}>
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


export default AddressForm;

