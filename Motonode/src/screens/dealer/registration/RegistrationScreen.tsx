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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import { BusinessProfile } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';

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
  businessName: 'Speed Auto Parts',
  ownerName: 'Rajesh Kumar',
  mobile: '+91 98765 43210',
  email: 'store@example.com',
  gst: '22AAAAA0000A1Z5',
  address: 'Shop No, Street, Area',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
  upiId: 'store@upi',
  bankName: 'State Bank of India',
  accountNumber: '501001234567',
  ifsc: 'SBIN0001234',
  storeLogo: null,
  storeBanner: null,
};

export function RegistrationScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveBusinessProfile, completeRegistration, dealerType } = useDealer();
  const [form, setForm] = useState<BusinessProfile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Step 1: Basic Info, Step 2: Business Details, Step 3: Documents
  
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [bannerUploaded, setBannerUploaded] = useState(false);
  const [doc1Uploaded, setDoc1Uploaded] = useState(false);
  const [doc2Uploaded, setDoc2Uploaded] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const set = (key: keyof BusinessProfile, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => {
    lightHaptic();
    if (currentStep === 1) {
      // Validate Step 1
      const missing: string[] = [];
      if (!form.businessName) missing.push('Business Name');
      if (!form.ownerName) missing.push('Owner Name');
      if (!form.mobile) missing.push('Mobile Number');
      if (!form.email) missing.push('Email');
      if (!form.city) missing.push('City');
      if (!form.state) missing.push('State');
      if (!form.pincode) missing.push('Pincode');

      if (missing.length > 0) {
        Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate Step 2
      const missing: string[] = [];
      if (!form.upiId) missing.push('UPI ID');
      if (!form.bankName) missing.push('Bank Name');
      if (!form.accountNumber) missing.push('Account Number');
      if (!form.ifsc) missing.push('IFSC Code');

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
      await saveBusinessProfile(form);
      await completeRegistration();
      successHaptic();
      navigation.replace(DealerStackRoutes.DealerTabs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Automobile Showroom Top Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80' }}
            style={styles.bannerImg}
          />
          <View style={styles.bannerOverlay} />
          
          <View style={[styles.headerOverlayContent, { paddingTop: topPad + 12 }]}>
            <Pressable
              style={styles.backBtn}
              onPress={handleBack}
            >
              <Feather name="arrow-left" size={20} color="#ffffff" />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <Text style={styles.bannerTitle}>Business Registration</Text>
              <Text style={styles.bannerSubtitle}>{dealerType ?? 'Automobile Showroom'}</Text>
            </View>
          </View>
        </View>

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
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="home" size={16} color="#2563EB" />
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
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="home" size={14} color="#2563EB" />
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
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="user" size={14} color="#2563EB" />
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
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="phone" size={14} color="#2563EB" />
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
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="mail" size={14} color="#2563EB" />
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
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="file-text" size={14} color="#2563EB" />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GST Number</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.gst}
                      onChangeText={(v) => set('gst', v)}
                      autoCapitalize="characters"
                      placeholder="22AAAAA0000A1Z5"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <Feather name="info" size={16} color={colors.textTertiary} style={styles.rightFieldIcon} />
                </View>
              </View>

              {/* Card 2: Location Information */}
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="map-pin" size={16} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Location</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Where is your business located?</Text>
                  </View>
                </View>

                {/* Address Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="map-pin" size={14} color="#2563EB" />
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

                {/* City & State Row (Dropdown chevrons) */}
                <View style={styles.formRow}>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="map" size={14} color="#2563EB" />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>City *</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.city}
                          onChangeText={(v) => set('city', v)}
                          placeholder="Bengaluru"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                      <Feather name="chevron-down" size={16} color={colors.textTertiary} style={styles.dropdownIcon} />
                    </View>
                  </View>

                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="map" size={14} color="#2563EB" />
                      </View>
                      <View style={styles.inputTextContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>State *</Text>
                        <TextInput
                          style={[styles.textInputStyle, { color: colors.textPrimary }]}
                          value={form.state}
                          onChangeText={(v) => set('state', v)}
                          placeholder="Karnataka"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                      <Feather name="chevron-down" size={16} color={colors.textTertiary} style={styles.dropdownIcon} />
                    </View>
                  </View>
                </View>

                {/* Pincode Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="hash" size={14} color="#2563EB" />
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
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="credit-card" size={16} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Bank & Payments</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Setup your payout accounts</Text>
                  </View>
                </View>

                {/* UPI ID Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="link" size={14} color="#2563EB" />
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
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="home" size={14} color="#2563EB" />
                  </View>
                  <View style={styles.inputTextContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bank Name *</Text>
                    <TextInput
                      style={[styles.textInputStyle, { color: colors.textPrimary }]}
                      value={form.bankName}
                      onChangeText={(v) => set('bankName', v)}
                      placeholder="State Bank of India"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                {/* Account Number Input */}
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="hash" size={14} color="#2563EB" />
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
                  <View style={[styles.fieldIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="code" size={14} color="#2563EB" />
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

              {/* Card 2: Store Media Uploads */}
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="image" size={16} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Store Branding</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Upload logo and banners</Text>
                  </View>
                </View>

                <View style={styles.mediaRow}>
                  <Pressable
                    style={[
                      styles.mediaBtn,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      logoUploaded && { borderColor: '#10B981', backgroundColor: '#ECFDF5' }
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setLogoUploaded(true);
                    }}
                  >
                    <Feather name={logoUploaded ? "check-circle" : "image"} size={24} color={logoUploaded ? "#10B981" : "#2563EB"} />
                    <Text style={[styles.mediaBtnLabel, { color: colors.textSecondary }]}>Store Logo</Text>
                    <Text style={[styles.mediaBtnSub, { color: colors.textTertiary }]}>{logoUploaded ? 'Uploaded ✓' : 'Tap to upload'}</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.mediaBtn,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      bannerUploaded && { borderColor: '#10B981', backgroundColor: '#ECFDF5' }
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setBannerUploaded(true);
                    }}
                  >
                    <Feather name={bannerUploaded ? "check-circle" : "camera"} size={24} color={bannerUploaded ? "#10B981" : "#2563EB"} />
                    <Text style={[styles.mediaBtnLabel, { color: colors.textSecondary }]}>Store Banner</Text>
                    <Text style={[styles.mediaBtnSub, { color: colors.textTertiary }]}>{bannerUploaded ? 'Uploaded ✓' : 'Tap to upload'}</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {/* STEP 3: Document Uploads */}
          {currentStep === 3 && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="file-text" size={16} color="#2563EB" />
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
                onPress={() => {
                  lightHaptic();
                  setDoc1Uploaded(true);
                }}
              >
                <View style={styles.docLeft}>
                  <View style={[styles.docIconWrapper, { backgroundColor: doc1Uploaded ? '#D1FAE5' : '#E2E8F0' }]}>
                    <Feather name="file-text" size={18} color={doc1Uploaded ? '#10B981' : '#64748B'} />
                  </View>
                  <View>
                    <Text style={[styles.docLabelTitle, { color: colors.textPrimary }]}>GST Registration Certificate *</Text>
                    <Text style={[styles.docLabelSub, { color: colors.textSecondary }]}>
                      {doc1Uploaded ? 'gst_cert_signed.pdf (1.2 MB)' : 'Upload PDF copy of your GST certificate'}
                    </Text>
                  </View>
                </View>
                <Feather
                  name={doc1Uploaded ? "check-circle" : "upload-cloud"}
                  size={18}
                  color={doc1Uploaded ? "#10B981" : "#2563EB"}
                />
              </Pressable>

              {/* Document 2: PAN Card */}
              <Pressable
                style={[
                  styles.docUploadCard,
                  { borderColor: colors.border, backgroundColor: '#F8FAFC' },
                  doc2Uploaded && { borderColor: '#10B981', backgroundColor: '#ECFDF5' }
                ]}
                onPress={() => {
                  lightHaptic();
                  setDoc2Uploaded(true);
                }}
              >
                <View style={styles.docLeft}>
                  <View style={[styles.docIconWrapper, { backgroundColor: doc2Uploaded ? '#D1FAE5' : '#E2E8F0' }]}>
                    <Feather name="credit-card" size={18} color={doc2Uploaded ? '#10B981' : '#64748B'} />
                  </View>
                  <View>
                    <Text style={[styles.docLabelTitle, { color: colors.textPrimary }]}>Business PAN Card *</Text>
                    <Text style={[styles.docLabelSub, { color: colors.textSecondary }]}>
                      {doc2Uploaded ? 'pan_card_copy.jpg (800 KB)' : 'Upload JPG or PDF copy of business PAN'}
                    </Text>
                  </View>
                </View>
                <Feather
                  name={doc2Uploaded ? "check-circle" : "upload-cloud"}
                  size={18}
                  color={doc2Uploaded ? "#10B981" : "#2563EB"}
                />
              </Pressable>

            </View>
          )}

        </ScrollView>

        {/* Sticky Bottom Actions Navigation Bar */}
        <View style={[styles.stickyBottomBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          {currentStep < 3 ? (
            <Pressable
              style={[styles.saveBtn, { backgroundColor: '#2563EB' }]}
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
    height: 180,
    width: '100%',
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  headerOverlayContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    paddingHorizontal: 16,
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
    backgroundColor: '#2563EB',
  },
  stepText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  activeStepText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  stepLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  activeStepLabel: { color: '#2563EB' },
  stepDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: -14,
  },
  activeStepDivider: {
    backgroundColor: '#2563EB',
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
});
