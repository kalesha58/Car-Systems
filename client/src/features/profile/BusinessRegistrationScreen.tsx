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
import {screenHeight} from '@utils/Scaling';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import CustomDropdownModal, {IDropdownOption} from '@components/ui/CustomDropdownModal';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';
import {useTranslation} from 'react-i18next';
import {createBusinessRegistration, ICreateBusinessRegistrationRequest} from '@service/dealerService';
import {resetAndNavigate} from '@utils/NavigationUtils';

const BUSINESS_TYPES: IDropdownOption[] = [
  {label: 'Automobile Showroom', value: 'Automobile Showroom'},
  {label: 'Vehicle Wash Station', value: 'Vehicle Wash Station'},
  {label: 'Detailing Center', value: 'Detailing Center'},
  {label: 'Mechanic Workshop', value: 'Mechanic Workshop'},
  {label: 'Spare Parts Dealer', value: 'Spare Parts Dealer'},
  {label: 'Riding Gear Store', value: 'Riding Gear Store'},
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);

  const getSelectedTypeLabel = () => {
    if (!type) return t('dealer.selectBusinessType') || 'Select Business Type';
    return type;
  };

  const handleDropdownSelect = (value: string) => {
    setType(value);
    setDropdownModalVisible(false);
  };

  const isFormValid = businessName.trim() && type && address.trim() && phone.trim();

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      showError(t('dealer.businessNameRequired') || 'Business name is required');
      return;
    }
    if (!type) {
      showError(t('dealer.businessTypeRequired') || 'Business type is required');
      return;
    }
    if (!address.trim()) {
      showError(t('dealer.addressRequired') || 'Address is required');
      return;
    }
    if (!phone.trim()) {
      showError(t('dealer.phoneRequired') || 'Phone number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const data: ICreateBusinessRegistrationRequest = {
        businessName: businessName.trim(),
        type,
        address: address.trim(),
        phone: phone.trim(),
        gst: gst.trim() || undefined,
      };

      const registration = await createBusinessRegistration(data);
      console.log('Business registration created successfully:', { 
        id: registration.id, 
        status: registration.status 
      });
      showSuccess(t('dealer.businessRegistrationSubmitted') || 'Business registration submitted successfully. Your request is pending admin approval.');
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
        t('dealer.failedToSubmitRegistration') ||
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
      padding: 16,
      paddingTop: 20,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      marginBottom: 8,
      color: colors.text,
    },
    textInputContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
    },
    textInput: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: RFValue(14),
      color: colors.text,
      fontFamily: Fonts.Regular,
    },
    textInputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
    },
    dropdownButtonText: {
      fontSize: RFValue(14),
      color: colors.text,
      fontFamily: Fonts.Regular,
      flex: 1,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.cardBackground,
      gap: 8,
    },
    buttonText: {
      fontSize: RFValue(14),
      color: colors.text,
      fontFamily: Fonts.Medium,
    },
    stickyButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: colors.background,
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
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    submitButtonDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader title={t('dealer.businessRegistration') || 'Business Registration'} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: screenHeight * 0.12}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('dealer.businessName') || 'Business Name'} *
          </CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterBusinessName') || 'Enter business name'}
              placeholderTextColor={colors.disabled}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('dealer.businessType') || 'Business Type'} *
          </CustomText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownModalVisible(true)}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedTypeLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.address') || 'Address'} *</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              placeholder={t('dealer.enterAddress') || 'Enter business address'}
              placeholderTextColor={colors.disabled}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.phone') || 'Phone'} *</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterPhone') || 'Enter phone number'}
              placeholderTextColor={colors.disabled}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.gst') || 'GST Number'}</CustomText>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterGST') || 'Enter GST number (optional)'}
              placeholderTextColor={colors.disabled}
              value={gst}
              onChangeText={setGst}
            />
          </View>
        </View>
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
                {t('dealer.submitRegistration') || 'Submit Registration'}
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
        title={t('dealer.selectBusinessType') || 'Select Business Type'}
        searchable={true}
      />
    </View>
  );
};

export default BusinessRegistrationScreen;

