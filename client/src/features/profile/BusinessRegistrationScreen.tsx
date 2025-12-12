import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenHeight, screenWidth} from '@utils/Scaling';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import CustomDropdownModal, {IDropdownOption} from '@components/ui/CustomDropdownModal';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';
import {useTranslation} from 'react-i18next';
import {createBusinessRegistration, ICreateBusinessRegistrationRequest} from '@service/dealerService';
import {resetAndNavigate} from '@utils/NavigationUtils';
import {getCurrentLocationWithAddress} from '@utils/addressUtils';
import {ILocationData} from '../../types/address/IAddress';

const BUSINESS_TYPES: IDropdownOption[] = [
  {label: 'Automobile Showroom', value: 'Automobile Showroom'},
  {label: 'Vehicle Wash Station', value: 'Vehicle Wash Station'},
  {label: 'Detailing Center', value: 'Detailing Center'},
  {label: 'Mechanic Workshop', value: 'Mechanic Workshop'},
  {label: 'Spare Parts Dealer', value: 'Spare Parts Dealer'},
  {label: 'Riding Gear Store', value: 'Riding Gear Store'},
];

const PAYOUT_TYPES: IDropdownOption[] = [
  {label: 'UPI', value: 'UPI'},
  {label: 'Bank Account', value: 'BANK'},
];

const BusinessRegistrationScreen: React.FC = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {showSuccess, showError} = useToast();
  const {t} = useTranslation('dealer');

  const [businessName, setBusinessName] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [payoutType, setPayoutType] = useState<'UPI' | 'BANK' | ''>('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountName, setAccountName] = useState('');
  const [location, setLocation] = useState<ILocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [payoutTypeModalVisible, setPayoutTypeModalVisible] = useState(false);

  const getSelectedTypeLabel = () => {
    if (!type) return t('selectBusinessType') || 'Select Business Type';
    return type;
  };

  const handleDropdownSelect = (value: string) => {
    setType(value);
    setDropdownModalVisible(false);
  };

  const handlePayoutTypeSelect = (value: string) => {
    setPayoutType(value as 'UPI' | 'BANK');
    setPayoutTypeModalVisible(false);
    // Clear payout fields when type changes
    setUpiId('');
    setAccountNumber('');
    setIfsc('');
    setAccountName('');
  };

  const getSelectedPayoutTypeLabel = () => {
    if (!payoutType) return t('selectPayoutType') || 'Select Payout Type';
    return payoutType === 'UPI' ? (t('upi') || 'UPI') : (t('bank') || 'Bank Account');
  };

  const handleLocationPicker = async () => {
    setIsGettingLocation(true);
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        setLocation(locationData);
        setAddress(locationData.address || locationData.formattedAddress);
      } else {
        showError(t('locationFailed') || 'Failed to get location. Please try again.');
      }
    } catch (error) {
      showError(t('locationFailed') || 'Failed to get location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const removeLocation = () => {
    setLocation(null);
    // Optionally clear address or keep it
    // setAddress('');
  };

  // Validate phone number (should be at least 10 digits)
  const isValidPhone = (phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    return cleanPhone.length >= 10;
  };

  // Validate UPI ID format
  const isValidUPIId = (upi: string): boolean => {
    const upiRegex = /^[\w.-]+@[\w]+$/;
    return upiRegex.test(upi.trim());
  };

  // Validate IFSC code format
  const isValidIFSC = (ifscCode: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifscCode.trim().toUpperCase());
  };

  // Check if payout fields are valid (if payout type is selected)
  const isPayoutValid = (): boolean => {
    if (!payoutType) return true; // Payout is optional
    if (payoutType === 'UPI') {
      return upiId.trim() !== '' && isValidUPIId(upiId);
    } else if (payoutType === 'BANK') {
      return (
        accountNumber.trim() !== '' &&
        ifsc.trim() !== '' &&
        accountName.trim() !== '' &&
        isValidIFSC(ifsc)
      );
    }
    return true;
  };

  const isFormValid = 
    businessName.trim() && 
    type && 
    address.trim() && 
    phone.trim() && 
    isValidPhone(phone) &&
    isPayoutValid();

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      showError(t('businessNameRequired') || 'Business name is required');
      return;
    }
    if (!type) {
      showError(t('businessTypeRequired') || 'Business type is required');
      return;
    }
    if (!address.trim()) {
      showError(t('addressRequired') || 'Address is required');
      return;
    }
    if (!phone.trim()) {
      showError(t('phoneRequired') || 'Phone number is required');
      return;
    }
    if (!isValidPhone(phone)) {
      showError(t('phoneInvalid') || 'Please enter a valid phone number (at least 10 digits)');
      return;
    }

    // Validate payout fields if payout type is selected
    if (payoutType) {
      if (payoutType === 'UPI') {
        if (!upiId.trim()) {
          showError(t('upiIdRequired') || 'UPI ID is required');
          return;
        }
        if (!isValidUPIId(upiId)) {
          showError(t('invalidUPIId') || 'Invalid UPI ID format (e.g., user@paytm)');
          return;
        }
      } else if (payoutType === 'BANK') {
        if (!accountNumber.trim()) {
          showError(t('accountNumberRequired') || 'Account number is required');
          return;
        }
        if (!ifsc.trim()) {
          showError(t('ifscRequired') || 'IFSC code is required');
          return;
        }
        if (!accountName.trim()) {
          showError(t('accountNameRequired') || 'Account holder name is required');
          return;
        }
        if (!isValidIFSC(ifsc)) {
          showError(t('invalidIFSC') || 'Invalid IFSC code format (e.g., HDFC0001234)');
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      // Prepare payout object if payout type is selected
      let payoutData: any = undefined;
      if (payoutType === 'UPI') {
        payoutData = {
          type: 'UPI',
          upiId: upiId.trim(),
        };
      } else if (payoutType === 'BANK') {
        payoutData = {
          type: 'BANK',
          bank: {
            accountNumber: accountNumber.trim(),
            ifsc: ifsc.trim().toUpperCase(),
            accountName: accountName.trim(),
          },
        };
      }

      const data: ICreateBusinessRegistrationRequest = {
        businessName: businessName.trim(),
        type: type as any, // Type assertion to match DealerType enum
        address: address.trim(),
        phone: phone.trim(),
        gst: gst.trim() || undefined,
        payout: payoutData,
      };

      const registration = await createBusinessRegistration(data);
      console.log('Business registration created successfully:', { 
        id: registration.id, 
        status: registration.status 
      });
      showSuccess(t('businessRegistrationSubmitted') || 'Business registration submitted successfully. Your request is pending admin approval.');
      // Navigate to DealerTabs after a short delay to ensure success message is shown
      setTimeout(() => {
        console.log('Navigating to DealerTabs after business registration submission');
        resetAndNavigate('DealerTabs');
      }, 500);
    } catch (error: any) {
      console.error('Error creating business registration:', error);
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        t('failedToSubmitRegistration') ||
        'Failed to submit business registration. Please try again.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: screenWidth * 0.04,
      paddingBottom: screenHeight * 0.05,
    },
    section: {
      marginBottom: screenHeight * 0.02,
    },
    label: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Medium,
      color: colors.text,
      marginBottom: screenHeight * 0.008,
      opacity: 0.8,
    },
    textInputContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.01,
      minHeight: screenHeight * 0.05,
    },
    textInput: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.text,
    },
    textInputMultiline: {
      minHeight: screenHeight * 0.12,
      textAlignVertical: 'top',
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.012,
    },
    dropdownButtonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.text,
      flex: 1,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.012,
    },
    buttonText: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Medium,
      color: colors.text,
      marginLeft: screenWidth * 0.02,
    },
    stickyButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      paddingHorizontal: screenWidth * 0.04,
      paddingVertical: screenHeight * 0.015,
      paddingBottom: screenHeight * 0.02,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    submitButton: {
      backgroundColor: Colors.secondary,
      borderRadius: 8,
      paddingVertical: screenHeight * 0.015,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: screenWidth * 0.02,
    },
    submitButtonDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.SemiBold,
      color: '#fff',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: screenHeight * 0.008,
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: screenWidth * 0.015,
      paddingHorizontal: screenWidth * 0.02,
      paddingVertical: screenHeight * 0.006,
      borderRadius: 6,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationButtonText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Medium,
      color: colors.text,
    },
    removeLocationIcon: {
      marginLeft: screenWidth * 0.01,
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: screenHeight * 0.008,
      paddingHorizontal: screenWidth * 0.02,
      paddingVertical: screenHeight * 0.006,
      backgroundColor: colors.cardBackground,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: Colors.secondary + '30',
      gap: screenWidth * 0.015,
    },
    locationInfoText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Regular,
      color: colors.text,
      flex: 1,
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader title={t('businessRegistration') || 'Business Registration'} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: screenHeight * 0.12}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('businessName') || 'Business Name'} *
          </CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('enterBusinessName') || 'Enter business name'}
              placeholderTextColor={colors.disabled}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('businessType') || 'Business Type'} *
          </CustomText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownModalVisible(true)}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedTypeLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <CustomText style={styles.label}>{t('address') || 'Address'} *</CustomText>
            {!location ? (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleLocationPicker}
                disabled={isGettingLocation}>
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Icon name="location-outline" size={RFValue(12)} color={colors.text} />
                )}
                <CustomText style={styles.locationButtonText}>
                  {isGettingLocation ? (t('gettingLocation') || 'Getting location...') : (t('useCurrentLocation') || 'Use Current Location')}
                </CustomText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={removeLocation}>
                <Icon name="location" size={RFValue(12)} color={Colors.secondary} />
                <CustomText style={styles.locationButtonText}>
                  {t('locationSet') || 'Location Set'}
                </CustomText>
                <Icon name="close-circle" size={RFValue(14)} color={colors.error} style={styles.removeLocationIcon} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.textInputContainer}>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              placeholder={t('enterAddress') || 'Enter business address'}
              placeholderTextColor={colors.disabled}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('phone') || 'Phone'} *</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('enterPhone') || 'Enter phone number'}
              placeholderTextColor={colors.disabled}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('gst') || 'GST Number'}</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('enterGST') || 'Enter GST number (optional)'}
              placeholderTextColor={colors.disabled}
              value={gst}
              onChangeText={setGst}
            />
          </View>
        </View>

        {/* Payout Section */}
        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('payoutType') || 'Payout Type'} ({t('optional') || 'Optional'})
          </CustomText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setPayoutTypeModalVisible(true)}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedPayoutTypeLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* UPI Fields */}
        {payoutType === 'UPI' && (
          <View style={styles.section}>
            <CustomText style={styles.label}>
              {t('upiId') || 'UPI ID'} *
            </CustomText>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t('enterUPIId') || 'Enter UPI ID (e.g., user@paytm)'}
                placeholderTextColor={colors.disabled}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>
        )}

        {/* Bank Account Fields */}
        {payoutType === 'BANK' && (
          <>
            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('accountNumber') || 'Account Number'} *
              </CustomText>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('enterAccountNumber') || 'Enter account number'}
                  placeholderTextColor={colors.disabled}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('ifsc') || 'IFSC Code'} *
              </CustomText>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('enterIFSC') || 'Enter IFSC code (e.g., HDFC0001234)'}
                  placeholderTextColor={colors.disabled}
                  value={ifsc}
                  onChangeText={(text) => setIfsc(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>
            </View>

            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('accountName') || 'Account Holder Name'} *
              </CustomText>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('enterAccountName') || 'Enter account holder name'}
                  placeholderTextColor={colors.disabled}
                  value={accountName}
                  onChangeText={setAccountName}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Button Container */}
      <View style={styles.stickyButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="checkmark-circle-outline" size={RFValue(16)} color="#fff" />
              <CustomText style={styles.submitButtonText}>
                {t('submitRegistration') || 'Submit Registration'}
              </CustomText>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CustomDropdownModal
        visible={dropdownModalVisible}
        onClose={() => setDropdownModalVisible(false)}
        options={BUSINESS_TYPES}
        selectedValue={type}
        onSelect={handleDropdownSelect}
        title={t('selectBusinessType') || 'Select Business Type'}
        searchable={true}
      />

      <CustomDropdownModal
        visible={payoutTypeModalVisible}
        onClose={() => setPayoutTypeModalVisible(false)}
        options={PAYOUT_TYPES}
        selectedValue={payoutType}
        onSelect={handlePayoutTypeSelect}
        title={t('selectPayoutType') || 'Select Payout Type'}
        searchable={false}
      />
    </View>
  );
};

export default BusinessRegistrationScreen;

