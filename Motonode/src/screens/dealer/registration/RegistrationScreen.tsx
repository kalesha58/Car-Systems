import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';

import { PhotoPermissionModal, PhotoPickerSheet, type PhotoPickerOption } from '@components/modals';
import { BookingPickerSheet } from '@components/booking/pickers/BookingPickerSheet';
import { uploadImage } from '@services/upload.service';
import { getString, setString } from '@storage/index';
import { StorageKeys } from '@storage/keys';
import { hasPhotoPermission, requestPhotoPermission, type PhotoSource } from '@utils/photoPermissions';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { BusinessProfile } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import { createBusinessRegistrationApi } from '@services/dealer.service';

type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
};

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.BusinessRegistration
>;

const EMPTY: BusinessProfile = {
  businessName: '',
  ownerName: '',
  mobile: '',
  email: '',
  gst: '',
  registrationNumber: '',
  establishedYear: '',
  website: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
  workingHoursOpen: '9:00 AM',
  workingHoursClose: '8:00 PM',
  facebook: '',
  instagram: '',
  youtube: '',
  upiId: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  storeLogo: null,
  storeBanner: null,
};

const WEEKDAYS = [
  { key: 'Monday', short: 'Mon' },
  { key: 'Tuesday', short: 'Tue' },
  { key: 'Wednesday', short: 'Wed' },
  { key: 'Thursday', short: 'Thu' },
  { key: 'Friday', short: 'Fri' },
  { key: 'Saturday', short: 'Sat' },
  { key: 'Sunday', short: 'Sun' },
] as const;

const STATES = [
  'Telangana',
  'Andhra Pradesh',
];

const CITIES_BY_STATE: Record<string, string[]> = {
  'Telangana': [
    'Hyderabad',
    'Warangal',
    'Nizamabad',
    'Karimnagar',
    'Khammam',
    'Ramagundam',
    'Mahbubnagar',
    'Nalgonda',
    'Adilabad',
    'Suryapet',
    'Siddipet',
    'Miryalaguda',
    'Jagtial',
    'Mancherial',
  ],
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Nellore',
    'Kurnool',
    'Rajahmundry',
    'Tirupati',
    'Kakinada',
    'Kadapa',
    'Anantapur',
    'Eluru',
    'Vizianagaram',
    'Ongole',
    'Nandyal',
    'Machilipatnam',
    'Adoni',
    'Tenali',
    'Proddatur',
    'Chittoor',
    'Hindupur',
    'Bhimavaram',
    'Madanapalle',
  ],
};

const INDIAN_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'Indian Bank',
  'Central Bank of India',
  'Indian Overseas Bank',
  'UCO Bank',
  'Bank of Maharashtra',
  'Federal Bank',
  'IDBI Bank',
  'South Indian Bank',
  'Karnataka Bank',
  'Karur Vysya Bank',
  'RBL Bank',
  'IDFC First Bank',
  'Bandhan Bank',
];

export function RegistrationScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveBusinessProfile, completeRegistration, dealerType } = useDealer();
  const [form, setForm] = useState<BusinessProfile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Step 1: Basic Info, Step 2: Business Details, Step 3: Documents
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  
  const [doc1Uploaded, setDoc1Uploaded] = useState(false);
  const [doc2Uploaded, setDoc2Uploaded] = useState(false);
  const [gstUploading, setGstUploading] = useState(false);
  const [panUploading, setPanUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploaded, setBannerUploaded] = useState(false);

  const [gstVerified, setGstVerified] = useState(false);
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [permissionVisible, setPermissionVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [pendingSource, setPendingSource] = useState<PhotoSource | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'banner' | 'gst' | 'pan' | null>(null);

  const [gstDocUrl, setGstDocUrl] = useState<string | null>(null);
  const [panDocUrl, setPanDocUrl] = useState<string | null>(null);

  const handleGstChange = (val: string) => {
    setForm(prev => ({ ...prev, gst: val.toUpperCase() }));
    setGstVerified(false);
    setGstError(null);
  };

  const verifyGst = () => {
    const gstVal = form.gst.trim().toUpperCase();
    if (!gstVal) {
      setGstError('GST number is required.');
      return;
    }

    setGstVerifying(true);
    setGstError(null);

    // Simulate API check delay
    setTimeout(() => {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstRegex.test(gstVal)) {
        setGstVerified(true);
        setGstError(null);
        successHaptic();
      } else {
        setGstVerified(false);
        setGstError('Invalid GST format. Expected: 27AABCU9603R1ZX');
      }
      setGstVerifying(false);
    }, 800);
  };

  const openPhotoPickerFor = (target: 'banner' | 'gst' | 'pan') => {
    lightHaptic();
    setUploadTarget(target);
    setPickerVisible(true);
  };

  const handlePhotoPickerSelect = (option: PhotoPickerOption) => {
    lightHaptic();
    void beginPhotoPick(option);
  };

  const beginPhotoPick = async (source: PhotoSource) => {
    setPendingSource(source);

    const rationaleAccepted = await getString(StorageKeys.PHOTO_PERMISSION_RATIONALE);
    const systemGranted = await hasPhotoPermission(source);

    if (rationaleAccepted === 'true' && systemGranted) {
      openNativePicker(source);
      setPendingSource(null);
      return;
    }

    setPermissionDenied(false);
    setPermissionVisible(true);
  };

  const openNativePicker = (source: PhotoSource) => {
    const options = {
      mediaType: 'photo' as const,
      selectionLimit: 1,
      quality: 0.8 as const,
      maxWidth: 1600,
      maxHeight: 1600,
      includeBase64: false,
    };

    if (source === 'camera') {
      launchCamera(options, applyPickedImage);
    } else {
      launchImageLibrary(options, applyPickedImage);
    }
  };

  const applyPickedImage = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) {
      if (response.errorCode === 'permission') {
        setPendingSource(null);
        setPermissionDenied(true);
        setPermissionVisible(true);
      }
      return;
    }

    const pickedUri = response.assets?.[0]?.uri;
    if (!pickedUri) return;

    if (uploadTarget === 'gst') {
      setGstUploading(true);
    } else if (uploadTarget === 'pan') {
      setPanUploading(true);
    } else if (uploadTarget === 'banner') {
      setBannerUploading(true);
    }
    setSaving(true);
    try {
      const uploadedUrl = await uploadImage(pickedUri);
      
      if (uploadTarget === 'gst') {
        setGstDocUrl(uploadedUrl);
        setDoc1Uploaded(true);
      } else if (uploadTarget === 'pan') {
        setPanDocUrl(uploadedUrl);
        setDoc2Uploaded(true);
      } else if (uploadTarget === 'banner') {
        setForm(prev => ({ ...prev, storeBanner: uploadedUrl }));
        setBannerUploaded(true);
      }
      successHaptic();
    } catch (err: any) {
      console.error('Image upload failed:', err);
      Alert.alert('Upload Failed', err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setSaving(false);
      setGstUploading(false);
      setPanUploading(false);
      setBannerUploading(false);
      setUploadTarget(null);
    }
  };

  const handlePermissionAllow = async () => {
    if (!pendingSource) return;

    setPermissionLoading(true);
    try {
      await setString(StorageKeys.PHOTO_PERMISSION_RATIONALE, 'true');
      const granted = await requestPhotoPermission(pendingSource);

      if (granted) {
        setPermissionVisible(false);
        const source = pendingSource;
        setPendingSource(null);
        setPermissionDenied(false);
        openNativePicker(source);
        return;
      }

      setPermissionDenied(true);
    } finally {
      setPermissionLoading(false);
    }
  };

  const handlePermissionDeny = () => {
    setPermissionVisible(false);
    setPermissionDenied(false);
    setPendingSource(null);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const set = (key: keyof BusinessProfile, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedWorkingDays = form.workingDays
    ? form.workingDays.split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  const toggleWorkingDay = (day: string) => {
    lightHaptic();
    const next = selectedWorkingDays.includes(day)
      ? selectedWorkingDays.filter((d) => d !== day)
      : [...selectedWorkingDays, day];
    set('workingDays', next.join(','));
  };

  const formatWorkingDaysLabel = (days: string) =>
    days
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
      .join(' – ')
      .replace(/,([^,]*)$/, ' –$1');

  const handleNext = () => {
    lightHaptic();
    if (currentStep === 1) {
      const missing: string[] = [];
      if (!form.businessName) missing.push('Business Name');
      if (!form.ownerName) missing.push('Owner Name');
      if (!form.mobile) missing.push('Mobile Number');
      if (!form.email) missing.push('Email');
      if (!form.establishedYear) missing.push('Established Year');
      if (!form.city) missing.push('City');
      if (!form.state) missing.push('State');
      if (!form.pincode) missing.push('Pincode');
      if (!form.gst) missing.push('GST Number');

      if (missing.length > 0) {
        Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`);
        return;
      }

      const year = parseInt(form.establishedYear, 10);
      if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
        Alert.alert('Invalid Year', 'Please enter a valid established year.');
        return;
      }

      if (!gstVerified) {
        Alert.alert('GST Unverified', 'Please verify your GST Number before proceeding.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const missing: string[] = [];
      if (!form.upiId) missing.push('UPI ID');
      if (!form.bankName) missing.push('Bank Name');
      if (!form.accountNumber) missing.push('Account Number');
      if (!form.ifsc) missing.push('IFSC Code');
      if (!form.workingDays) missing.push('Working Days');
      if (!form.workingHoursOpen) missing.push('Opening Time');
      if (!form.workingHoursClose) missing.push('Closing Time');

      if (missing.length > 0) {
        Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    lightHaptic();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCompleteRegistration = async () => {
    lightHaptic();
    if (!doc1Uploaded || !doc2Uploaded) {
      Alert.alert('Documents Required', 'Please upload both GST Registration Certificate and PAN Card to proceed.');
      return;
    }
    setSaving(true);
    try {
      const docPayload = [];
      if (doc1Uploaded) {
        docPayload.push({
          kind: 'GST' as const,
          url: gstDocUrl || 'https://car-systems.s3.amazonaws.com/gst_cert_signed.pdf',
        });
      }
      if (doc2Uploaded) {
        docPayload.push({
          kind: 'PAN' as const,
          url: panDocUrl || 'https://car-systems.s3.amazonaws.com/pan_card_copy.jpg',
        });
      }

      const payload = {
        businessName: form.businessName,
        type: dealerType || 'Automobile Showroom',
        address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
        state: form.state,
        city: form.city,
        phone: form.mobile,
        gst: form.gst,
        registrationNumber: form.registrationNumber || undefined,
        establishedYear: parseInt(form.establishedYear, 10),
        website: form.website || undefined,
        workingDays: formatWorkingDaysLabel(form.workingDays),
        workingHours: {
          open: form.workingHoursOpen,
          close: form.workingHoursClose,
        },
        socialLinks: {
          facebook: form.facebook || undefined,
          instagram: form.instagram || undefined,
          youtube: form.youtube || undefined,
        },
        coverPhoto: form.storeBanner || undefined,
        payout: form.upiId
          ? {
              type: 'UPI',
              upiId: form.upiId,
            }
          : {
              type: 'BANK',
              bank: {
                accountNumber: form.accountNumber || '',
                ifsc: form.ifsc || '',
                accountName: form.ownerName || '',
              },
            },
        shopPhotos: form.storeBanner ? [{ url: form.storeBanner }] : [],
        documents: docPayload,
      };

      await createBusinessRegistrationApi(payload);
      await saveBusinessProfile(form);
      await completeRegistration();
      successHaptic();
      navigation.replace(DealerStackRoutes.DealerTabs);
    } catch (error: any) {
      console.error('Registration failed:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.Response?.ReturnMessage || error.message || 'Something went wrong while submitting registration.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BookingPickerSheet
        visible={bankPickerVisible}
        title="Select Bank"
        onClose={() => setBankPickerVisible(false)}
      >
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {INDIAN_BANKS.map((item) => {
            const selected = form.bankName === item;
            return (
              <Pressable
                key={item}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: selected ? colors.primarySubtle : colors.muted,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  lightHaptic();
                  setForm(prev => ({ ...prev, bankName: item }));
                  setBankPickerVisible(false);
                }}
              >
                <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>
                  {item}
                </Text>
                {selected && <Feather name="check" size={16} color={colors.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BookingPickerSheet>

      <BookingPickerSheet
        visible={statePickerVisible}
        title="Select State"
        onClose={() => setStatePickerVisible(false)}
      >
        {STATES.map((item) => {
          const selected = form.state === item;
          return (
            <Pressable
              key={item}
              style={[
                styles.pickerOption,
                {
                  backgroundColor: selected ? colors.primarySubtle : colors.muted,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                lightHaptic();
                setForm(prev => ({ ...prev, state: item, city: '' }));
                setStatePickerVisible(false);
              }}
            >
              <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>
                {item}
              </Text>
              {selected && <Feather name="check" size={16} color={colors.primary} />}
            </Pressable>
          );
        })}
      </BookingPickerSheet>

      <BookingPickerSheet
        visible={cityPickerVisible}
        title="Select City"
        onClose={() => setCityPickerVisible(false)}
      >
        {form.state ? (CITIES_BY_STATE[form.state] || []).map((item) => {
          const selected = form.city === item;
          return (
            <Pressable
              key={item}
              style={[
                styles.pickerOption,
                {
                  backgroundColor: selected ? colors.primarySubtle : colors.muted,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                lightHaptic();
                setForm(prev => ({ ...prev, city: item }));
                setCityPickerVisible(false);
              }}
            >
              <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>
                {item}
              </Text>
              {selected && <Feather name="check" size={16} color={colors.primary} />}
            </Pressable>
          );
        }) : null}
      </BookingPickerSheet>

      <PhotoPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handlePhotoPickerSelect}
      />

      <PhotoPermissionModal
        visible={permissionVisible && pendingSource !== null}
        source={pendingSource ?? 'gallery'}
        variant={permissionDenied ? 'denied' : 'request'}
        loading={permissionLoading}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Automobile Showroom Top Banner */}
        <Pressable 
          style={styles.bannerContainer}
          onPress={() => !bannerUploading && openPhotoPickerFor('banner')}
          disabled={bannerUploading}
        >
          {form.storeBanner ? (
            <Image source={{ uri: form.storeBanner }} style={styles.bannerImg} />
          ) : (
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80' }}
              style={[styles.bannerImg, { opacity: 0.15 }]}
            />
          )}
          <View style={styles.bannerOverlay} />
          
          <View style={[styles.bannerContentColumn, { paddingTop: topPad + 12 }]}>
            {/* Top Row: Back button + Title */}
            <View style={styles.headerTopRow}>
              <Pressable
                style={styles.backBtn}
                onPress={handleBack}
                hitSlop={8}
              >
                <Feather name="arrow-left" size={20} color="#ffffff" />
              </Pressable>
              <View style={styles.headerTextGroup}>
                <Text style={styles.bannerTitle}>Business Registration</Text>
                <Text style={styles.bannerSubtitle}>{dealerType ?? 'Automobile Showroom'}</Text>
              </View>
            </View>

            {/* Bottom Row: Camera upload button */}
            {bannerUploading ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: 'flex-start', marginLeft: 16 }} />
            ) : !form.storeBanner ? (
              <View style={styles.bannerUploadPromptContainer}>
                <Feather name="camera" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.bannerUploadPromptText}>Upload Cover Photo (Optional)</Text>
              </View>
            ) : (
              <View style={styles.bannerUploadedIndicator}>
                <Feather name="camera" size={12} color="#ffffff" />
                <Text style={styles.bannerUploadedText}>Change Cover Photo</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Stepper Card */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperCard}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 1 ? styles.activeStepCircle : null]}>
                <Text style={[styles.stepText, currentStep >= 1 ? styles.activeStepText : null]}>1</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep >= 1 ? styles.activeStepLabel : null]}>Basic Info</Text>
            </View>
            
            <View style={[styles.stepDivider, currentStep >= 2 ? styles.activeStepDivider : null]} />

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 2 ? styles.activeStepCircle : null]}>
                <Text style={[styles.stepText, currentStep >= 2 ? styles.activeStepText : null]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep >= 2 ? styles.activeStepLabel : null]}>Details</Text>
            </View>

            <View style={[styles.stepDivider, currentStep >= 3 ? styles.activeStepDivider : null]} />

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 3 ? styles.activeStepCircle : null]}>
                <Text style={[styles.stepText, currentStep >= 3 ? styles.activeStepText : null]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep >= 3 ? styles.activeStepLabel : null]}>Documents</Text>
            </View>
          </View>
        </View>

        {/* Scrollable Form Fields */}
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* STEP 1: Basic Information & Location */}
          {currentStep === 1 && (
            <>
              {/* Card 1: Basic Information */}
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="home" size={16} color={colors.icon} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Basic Information</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Tell us about your business</Text>
                  </View>
                </View>

                {/* Business & Owner Name row */}
                <View style={styles.formRow}>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                        <Feather name="home" size={14} color={colors.icon} />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Business Name *</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.businessName}
                          onChangeText={(v) => set('businessName', v)}
                          placeholder="Speed Auto Parts"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                        <Feather name="user" size={14} color={colors.icon} />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Owner Name *</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.ownerName}
                          onChangeText={(v) => set('ownerName', v)}
                          placeholder="Rajesh Kumar"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Mobile Number input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="phone" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mobile Number *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.mobile}
                      onChangeText={(v) => set('mobile', v)}
                      keyboardType="phone-pad"
                      placeholder="+91 98765 43210"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  {form.mobile.length > 5 && (
                    <Feather name="check-circle" size={16} color="#10B981" style={styles.rightFieldIcon} />
                  )}
                </View>

                {/* Email Address input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="mail" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.email}
                      onChangeText={(v) => set('email', v)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="store@example.com"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  {form.email.includes('@') && (
                    <Feather name="check-circle" size={16} color="#10B981" style={styles.rightFieldIcon} />
                  )}
                </View>

                {/* GST Number input */}
                <View style={{ marginBottom: 12 }}>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        borderColor: gstError ? colors.error : gstVerified ? '#10B981' : colors.border,
                        marginBottom: 0,
                      },
                    ]}
                  >
                    <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                      <Feather name="file-text" size={14} color={colors.icon} />
                    </View>
                    <View style={styles.inputTextContainer}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GST Number *</Text>
                      <TextInput
                        style={[styles.textInputStyle, { color: colors.textPrimary }]}
                        value={form.gst}
                        onChangeText={handleGstChange}
                        onBlur={verifyGst}
                        autoCapitalize="characters"
                        placeholder="22AAAAA0000A1Z5"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    {gstVerifying ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.rightFieldIcon} />
                    ) : gstVerified ? (
                      <Feather name="check-circle" size={16} color="#10B981" style={styles.rightFieldIcon} />
                    ) : (
                      <Pressable style={styles.verifyBtn} onPress={verifyGst}>
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      </Pressable>
                    )}
                  </View>
                  {gstError ? (
                    <Text style={{ color: colors.error, fontSize: 10, marginTop: 4, marginLeft: 12 }}>
                      {gstError}
                    </Text>
                  ) : gstVerified ? (
                    <Text style={{ color: '#10B981', fontSize: 10, marginTop: 4, marginLeft: 12 }}>
                      GST verified successfully ✓
                    </Text>
                  ) : null}
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                        <Feather name="hash" size={14} color={colors.icon} />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Registration No. (Optional)</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.registrationNumber}
                          onChangeText={(v) => set('registrationNumber', v)}
                          placeholder="BRN-2024-001"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                        <Feather name="calendar" size={14} color={colors.icon} />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Established Year *</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.establishedYear}
                          onChangeText={(v) => set('establishedYear', v.replace(/[^0-9]/g, '').slice(0, 4))}
                          keyboardType="numeric"
                          placeholder="2018"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="globe" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Website (Optional)</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.website}
                      onChangeText={(v) => set('website', v)}
                      autoCapitalize="none"
                      placeholder="https://yourbusiness.com"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </View>

              {/* Card 2: Location Information */}
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="map-pin" size={16} color={colors.icon} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Location</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Where is your business located?</Text>
                  </View>
                </View>

                {/* Address Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="map-pin" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.address}
                      onChangeText={(v) => set('address', v)}
                      placeholder="Shop No, Street, Area"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                {/* State Input */}
                <Pressable
                  onPress={() => {
                    lightHaptic();
                    setStatePickerVisible(true);
                  }}
                  style={[styles.inputWrapper, { borderColor: colors.border }]}
                >
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="map" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>State *</Text>
                    <Text
                      style={[
                        styles.textInputStyle,
                        {
                          color: form.state ? colors.textPrimary : colors.textTertiary,
                          paddingVertical: Platform.OS === 'ios' ? 4 : 0,
                        },
                      ]}
                    >
                      {form.state || 'Select State'}
                    </Text>
                  </View>
                  <Feather name="chevron-down" size={16} color={colors.textTertiary} style={styles.dropdownIcon} />
                </Pressable>

                {/* City Input */}
                <Pressable
                  onPress={() => {
                    if (!form.state) {
                      Alert.alert('Select State First', 'Please select a state before selecting a city.');
                      return;
                    }
                    lightHaptic();
                    setCityPickerVisible(true);
                  }}
                  style={[styles.inputWrapper, { borderColor: colors.border, opacity: form.state ? 1 : 0.6 }]}
                >
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="map" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>City *</Text>
                    <Text
                      style={[
                        styles.textInputStyle,
                        {
                          color: form.city ? colors.textPrimary : colors.textTertiary,
                          paddingVertical: Platform.OS === 'ios' ? 4 : 0,
                        },
                      ]}
                    >
                      {form.city || (form.state ? 'Select City' : 'Select state first')}
                    </Text>
                  </View>
                  <Feather name="chevron-down" size={16} color={colors.textTertiary} style={styles.dropdownIcon} />
                </Pressable>

                {/* Pincode Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="hash" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Pincode *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.pincode}
                      onChangeText={(v) => set('pincode', v)}
                      keyboardType="numeric"
                      placeholder="560001"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* STEP 2: Bank & Payments & Media Uploads */}
          {currentStep === 2 && (
            <>
              {/* Card 1: Bank & Payment */}
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="credit-card" size={16} color={colors.icon} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Bank & Payments</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Setup your payout accounts</Text>
                  </View>
                </View>

                {/* UPI ID Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="link" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>UPI ID *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.upiId}
                      onChangeText={(v) => set('upiId', v)}
                      autoCapitalize="none"
                      placeholder="store@upi"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                {/* Bank Name Input */}
                <Pressable
                  onPress={() => {
                    lightHaptic();
                    setBankPickerVisible(true);
                  }}
                  style={[styles.inputWrapper, { borderColor: colors.border }]}
                >
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="home" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bank Name *</Text>
                    <Text
                      style={[
                        styles.textInputStyle,
                        {
                          color: form.bankName ? colors.textPrimary : colors.textTertiary,
                          paddingVertical: Platform.OS === 'ios' ? 4 : 0,
                        },
                      ]}
                    >
                      {form.bankName || 'Select Bank Name'}
                    </Text>
                  </View>
                  <Feather name="chevron-down" size={16} color={colors.textTertiary} style={styles.dropdownIcon} />
                </Pressable>

                {/* Account Number Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="hash" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Number *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.accountNumber}
                      onChangeText={(v) => set('accountNumber', v)}
                      keyboardType="numeric"
                      placeholder="XXXX XXXX XXXX"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                {/* IFSC Code Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="code" size={14} color={colors.icon} />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>IFSC Code *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.ifsc}
                      onChangeText={(v) => set('ifsc', v)}
                      autoCapitalize="characters"
                      placeholder="SBIN0001234"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </View>

              {/* Card 2: Working Hours */}
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="clock" size={16} color={colors.icon} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Working Days & Hours</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>When is your business open?</Text>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Working Days *</Text>
                <View style={styles.dayChipRow}>
                  {WEEKDAYS.map((day) => {
                    const selected = selectedWorkingDays.includes(day.key);
                    return (
                      <Pressable
                        key={day.key}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: selected ? '#E60012' : colors.muted,
                            borderColor: selected ? '#E60012' : colors.border,
                          },
                        ]}
                        onPress={() => toggleWorkingDay(day.key)}
                      >
                        <Text style={[styles.dayChipText, { color: selected ? '#ffffff' : colors.textSecondary }]}>
                          {day.short}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={[styles.formRow, { marginTop: 12 }]}>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                        <Feather name="sunrise" size={14} color={colors.icon} />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Opens At *</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.workingHoursOpen}
                          onChangeText={(v) => set('workingHoursOpen', v)}
                          placeholder="9:00 AM"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#F2F2F2' }]}>
                        <Feather name="sunset" size={14} color={colors.icon} />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Closes At *</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.workingHoursClose}
                          onChangeText={(v) => set('workingHoursClose', v)}
                          placeholder="8:00 PM"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 3: Social Media */}
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F2F2F2' }]}>
                    <Feather name="share-2" size={16} color={colors.icon} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Social Media Links</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Optional — add if you have them</Text>
                  </View>
                </View>

                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="facebook" size={14} color="#1877F2" />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Facebook (Optional)</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.facebook}
                      onChangeText={(v) => set('facebook', v)}
                      autoCapitalize="none"
                      placeholder="facebook.com/yourpage"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#FDF2F8' }]}>
                    <Feather name="instagram" size={14} color="#E1306C" />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Instagram (Optional)</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.instagram}
                      onChangeText={(v) => set('instagram', v)}
                      autoCapitalize="none"
                      placeholder="instagram.com/yourpage"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#FEF2F2' }]}>
                    <Feather name="youtube" size={14} color="#FF0000" />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>YouTube (Optional)</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.youtube}
                      onChangeText={(v) => set('youtube', v)}
                      autoCapitalize="none"
                      placeholder="youtube.com/@yourchannel"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* STEP 3: Document Uploads */}
          {currentStep === 3 && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardHeaderIcon, { backgroundColor: '#F2F2F2' }]}>
                  <Feather name="file-text" size={16} color={colors.icon} />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Business Verification</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Upload business validation files</Text>
                </View>
              </View>

              {/* Document 1: GST Registration Certificate */}
              <Pressable
                style={[
                  styles.docUploadCard,
                  { borderColor: colors.border, backgroundColor: '#F8FAFC' },
                  doc1Uploaded && { borderColor: '#10B981', backgroundColor: '#ECFDF5' }
                ]}
                onPress={() => !gstUploading && openPhotoPickerFor('gst')}
                disabled={gstUploading}
              >
                <View style={styles.docLeft}>
                  <View style={[styles.docIconWrapper, { backgroundColor: doc1Uploaded ? '#D1FAE5' : '#E2E8F0' }]}>
                    {gstUploading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Feather name="file-text" size={18} color={doc1Uploaded ? '#10B981' : '#64748B'} />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.docLabelTitle, { color: colors.textPrimary }]}>GST Registration Certificate *</Text>
                    <Text style={[styles.docLabelSub, { color: colors.textSecondary }]}>
                      {gstUploading ? 'Uploading document...' : doc1Uploaded ? 'GST Certificate uploaded ✓' : 'Upload PDF or image of GST certificate'}
                    </Text>
                  </View>
                </View>
                {gstUploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather
                    name={doc1Uploaded ? "check-circle" : "upload-cloud"}
                    size={18}
                    color={doc1Uploaded ? "#10B981" : "#E60012"}
                  />
                )}
              </Pressable>

              {/* Document 2: PAN Card */}
              <Pressable
                style={[
                  styles.docUploadCard,
                  { borderColor: colors.border, backgroundColor: '#F8FAFC' },
                  doc2Uploaded && { borderColor: '#10B981', backgroundColor: '#ECFDF5' }
                ]}
                onPress={() => !panUploading && openPhotoPickerFor('pan')}
                disabled={panUploading}
              >
                <View style={styles.docLeft}>
                  <View style={[styles.docIconWrapper, { backgroundColor: doc2Uploaded ? '#D1FAE5' : '#E2E8F0' }]}>
                    {panUploading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Feather name="credit-card" size={18} color={doc2Uploaded ? '#10B981' : '#64748B'} />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.docLabelTitle, { color: colors.textPrimary }]}>Business PAN Card *</Text>
                    <Text style={[styles.docLabelSub, { color: colors.textSecondary }]}>
                      {panUploading ? 'Uploading document...' : doc2Uploaded ? 'PAN Card uploaded ✓' : 'Upload JPG or PDF copy of business PAN'}
                    </Text>
                  </View>
                </View>
                {panUploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather
                    name={doc2Uploaded ? "check-circle" : "upload-cloud"}
                    size={18}
                    color={doc2Uploaded ? "#10B981" : "#E60012"}
                  />
                )}
              </Pressable>

            </View>
          )}

        </ScrollView>

        {/* Sticky Bottom Actions Navigation Bar */}
        <View style={[styles.stickyBottomBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          {currentStep < 3 ? (
            <Pressable
              style={[styles.saveBtn, { backgroundColor: '#E60012' }]}
              onPress={handleNext}
            >
              <Text style={styles.saveBtnText}>Save & Continue</Text>
              <Feather name="arrow-right" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.saveBtn, { backgroundColor: '#10B981' }]}
              onPress={handleCompleteRegistration}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Complete Registration'}</Text>
              <Feather name="check" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
            </Pressable>
          )}
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerContainer: {
    height: 210,
    width: '100%',
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  bannerContentColumn: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  headerTextGroup: {
    marginTop: 4,
  },
  bannerTitle: { color: '#ffffff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  bannerSubtitle: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  
  stepperContainer: {
    paddingHorizontal: 16,
    marginTop: -28,
    zIndex: 10,
  },
  stepperCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  stepItem: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepCircle: {
    backgroundColor: '#E60012',
  },
  stepText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  activeStepText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  stepLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  activeStepLabel: { color: themeLight.textSecondary },
  stepDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: -14,
  },
  activeStepDivider: {
    backgroundColor: '#E60012',
  },

  content: { padding: 16, paddingTop: 20, gap: 16 },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  cardSubtitle: { fontSize: 11, marginTop: 1 },
  
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dayChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayChipText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  inputBox: {
    gap: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 52,
  },
  fieldIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inputTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  textInputStyle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    padding: 0,
    marginTop: 1,
  },
  rightFieldIcon: {
    marginLeft: 8,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    gap: 6,
  },
  mediaBtnLabel: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  mediaBtnSub: { fontSize: 10 },
  docUploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabelTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  docLabelSub: { fontSize: 10, marginTop: 2, flex: 1, flexWrap: 'wrap' },

  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  bannerUploadPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'center',
    gap: 8,
    marginTop: 12,
  },
  bannerUploadPromptText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  bannerUploadedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    gap: 6,
    marginTop: 12,
  },
  bannerUploadedText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickerOptionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  verifyBtn: {
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    alignSelf: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
