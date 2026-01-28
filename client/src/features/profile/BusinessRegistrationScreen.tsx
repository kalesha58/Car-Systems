import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { screenHeight, screenWidth } from '@utils/Scaling';
import { Fonts, Colors } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import CustomDropdownModal, { IDropdownOption } from '@components/ui/CustomDropdownModal';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { useTranslation } from 'react-i18next';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { uploadImage } from '@service/postService';
import { storage } from '@state/storage';
import {
  createBusinessRegistration,
  updateBusinessRegistration,
  ICreateBusinessRegistrationRequest,
  IBusinessRegistration,
  IBusinessRegistrationDocumentFile,
  IBusinessRegistrationPhoto,
} from '@service/dealerService';
import { resetAndNavigate, goBack } from '@utils/NavigationUtils';
import { getCurrentLocationWithAddress } from '@utils/addressUtils';
import { ILocationData } from '../../types/address/IAddress';
import { useRoute, RouteProp } from '@react-navigation/native';

const BUSINESS_TYPES: IDropdownOption[] = [
  { label: 'Automobile Showroom', value: 'Automobile Showroom' },
  { label: 'Vehicle Wash Station', value: 'Vehicle Wash Station' },
  { label: 'Detailing Center', value: 'Detailing Center' },
  { label: 'Mechanic Workshop', value: 'Mechanic Workshop' },
  { label: 'Spare Parts Dealer', value: 'Spare Parts Dealer' },
  { label: 'Riding Gear Store', value: 'Riding Gear Store' },
];

const PAYOUT_TYPES: IDropdownOption[] = [
  { label: 'UPI', value: 'UPI' },
  { label: 'Bank Account', value: 'BANK' },
];

const MAX_SHOP_PHOTOS = 10;
const BR_DRAFT_STORAGE_KEY = 'business-registration:draft:v1';

import { useAuthStore } from '@state/authStore';
import { refetchUser } from '@service/authService';

const BusinessRegistrationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: { isEdit?: boolean; registrationData?: IBusinessRegistration } }, 'params'>>();
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const { setUser } = useAuthStore();

  const { isEdit, registrationData } = route.params || {};
  // ... (rest of the component state)

  // ... (inside handleSubmit)


  const draft = (route.params as any)?.draft as
    | {
      businessName?: string;
      type?: string;
      address?: string;
      phone?: string;
      gst?: string;
      payoutType?: 'UPI' | 'BANK' | '';
      upiId?: string;
      accountNumber?: string;
      ifsc?: string;
      accountName?: string;
      shopPhotoUris?: string[];
      idDocUri?: string | null;
      panDocUri?: string | null;
    }
    | undefined;

  // Use a ref (instead of useMemo) so Fast Refresh is less likely to complain
  // about hook order changes while we iterate on this screen.
  const mmkvDraftRef = useRef<any>(undefined);
  if (mmkvDraftRef.current === undefined) {
    try {
      const raw = storage.getString(BR_DRAFT_STORAGE_KEY);
      mmkvDraftRef.current = raw ? JSON.parse(raw) : null;
    } catch {
      mmkvDraftRef.current = null;
    }
  }

  // Debug: track remounts & params
  const screenInstanceIdRef = useRef(`BR_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
  useEffect(() => {
    console.log('[BusinessRegistrationScreen] mount', {
      instanceId: screenInstanceIdRef.current,
      isEdit: !!isEdit,
      hasRegistrationData: !!registrationData,
      hasDraft: !!draft,
      draftKeys: draft ? Object.keys(draft) : [],
      hasMmkvDraft: !!mmkvDraftRef.current,
      mmkvDraftKeys: mmkvDraftRef.current ? Object.keys(mmkvDraftRef.current) : [],
    });
    return () => {
      console.log('[BusinessRegistrationScreen] unmount', {
        instanceId: screenInstanceIdRef.current,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialDraft = (draft ?? mmkvDraftRef.current ?? {}) as any;
  const [businessName, setBusinessName] = useState(initialDraft?.businessName ?? registrationData?.businessName ?? '');
  const [type, setType] = useState(initialDraft?.type ?? registrationData?.type ?? '');
  const [address, setAddress] = useState(initialDraft?.address ?? registrationData?.address ?? '');
  const [phone, setPhone] = useState(initialDraft?.phone ?? registrationData?.phone ?? '');
  const [gst, setGst] = useState(initialDraft?.gst ?? registrationData?.gst ?? '');

  // Initialize payout details
  const initialPayoutType = registrationData?.payout?.type || '';
  const initialUpiId = registrationData?.payout?.upiId || '';
  const initialBank = registrationData?.payout?.bank;

  const [payoutType, setPayoutType] = useState<'UPI' | 'BANK' | ''>(
    (initialDraft?.payoutType ?? ((initialPayoutType as any) || '')) as any,
  );
  const [upiId, setUpiId] = useState(initialDraft?.upiId ?? initialUpiId);
  const [accountNumber, setAccountNumber] = useState(initialDraft?.accountNumber ?? (initialBank?.accountNumber || ''));
  const [ifsc, setIfsc] = useState(initialDraft?.ifsc ?? (initialBank?.ifsc || ''));
  const [accountName, setAccountName] = useState(initialDraft?.accountName ?? (initialBank?.accountName || ''));
  const [location, setLocation] = useState<ILocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [payoutTypeModalVisible, setPayoutTypeModalVisible] = useState(false);

  const existingShopPhotos = useMemo(() => {
    const urls = (registrationData?.shopPhotos || []).map(p => p?.url).filter(Boolean) as string[];
    return urls;
  }, [registrationData?.shopPhotos]);

  const existingDocs = useMemo(() => {
    const docs = registrationData?.documents || [];
    const idDoc = docs.find(d => d.kind === 'ID')?.url || null;
    const panDoc = docs.find(d => d.kind === 'PAN')?.url || null;
    return { idDoc, panDoc };
  }, [registrationData?.documents]);

  const [shopPhotoUris, setShopPhotoUris] = useState<string[]>(initialDraft?.shopPhotoUris ?? existingShopPhotos);
  const [idDocUri, setIdDocUri] = useState<string | null>(initialDraft?.idDocUri ?? existingDocs.idDoc);
  const [panDocUri, setPanDocUri] = useState<string | null>(initialDraft?.panDocUri ?? existingDocs.panDoc);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    businessName?: string;
    type?: string;
    address?: string;
    phone?: string;
    gst?: string;
    upiId?: string;
    accountNumber?: string;
    ifsc?: string;
    accountName?: string;
    shopPhotos?: string;
    idDoc?: string;
    panDoc?: string;
  }>({});

  const persistDraft = () => {
    const payload = {
      businessName,
      type,
      address,
      phone,
      gst,
      payoutType,
      upiId,
      accountNumber,
      ifsc,
      accountName,
      shopPhotoUris,
      idDocUri,
      panDocUri,
    };

    // 1) MMKV (survives activity recreation)
    try {
      storage.set(BR_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch { }

    // 2) Nav params (helps within navigation state)
    try {
      (navigation as any).setParams({ draft: payload });
    } catch { }

    console.log('[BusinessRegistrationScreen] persistDraft', {
      instanceId: screenInstanceIdRef.current,
      shopPhotosCount: shopPhotoUris.length,
      hasIdDoc: !!idDocUri,
      hasPanDoc: !!panDocUri,
    });
  };

  // Persist draft to navigation params so if Android recreates the activity/screen
  // after opening the gallery, we can restore the form instead of resetting to empty.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    persistDraft();
  }, [
    navigation,
    businessName,
    type,
    address,
    phone,
    gst,
    payoutType,
    upiId,
    accountNumber,
    ifsc,
    accountName,
    shopPhotoUris,
    idDocUri,
    panDocUri,
  ]);

  const pickShopPhotos = () => {
    // Ensure draft is saved BEFORE opening gallery (in case Android recreates activity)
    persistDraft();
    console.log('[BusinessRegistrationScreen] pickShopPhotos', {
      instanceId: screenInstanceIdRef.current,
      currentCount: shopPhotoUris.length,
      max: MAX_SHOP_PHOTOS,
    });
    if (shopPhotoUris.length >= MAX_SHOP_PHOTOS) {
      Alert.alert(
        t('dealer.limitReached') || 'Limit Reached',
        t('dealer.maxImagesReached', { max: MAX_SHOP_PHOTOS }) ||
        `You can add up to ${MAX_SHOP_PHOTOS} images`,
      );
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        selectionLimit: MAX_SHOP_PHOTOS - shopPhotoUris.length,
      },
      (response: ImagePickerResponse) => {
        console.log('[BusinessRegistrationScreen] pickShopPhotos callback', {
          instanceId: screenInstanceIdRef.current,
          didCancel: response.didCancel,
          errorCode: response.errorCode,
          errorMessage: response.errorMessage,
          assetsCount: response.assets?.length || 0,
        });
        if (response.didCancel || response.errorCode) return;
        const selected = response.assets || [];
        if (selected.length < 1) return;
        const newUris = selected.map(a => a.uri || '').filter(Boolean);
        if (newUris.length < 1) return;
        setShopPhotoUris(prev => {
          const updated = [...prev, ...newUris].slice(0, MAX_SHOP_PHOTOS);
          // Clear error if photos are added
          if (updated.length > 0 && fieldErrors.shopPhotos) {
            setFieldErrors(prevErrors => ({ ...prevErrors, shopPhotos: undefined }));
          }
          return updated;
        });
      },
    );
  };

  const pickSingleDoc = (target: 'ID' | 'PAN') => {
    // Ensure draft is saved BEFORE opening gallery (in case Android recreates activity)
    persistDraft();
    console.log('[BusinessRegistrationScreen] pickSingleDoc', {
      instanceId: screenInstanceIdRef.current,
      target,
    });
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 1,
      },
      (response: ImagePickerResponse) => {
        console.log('[BusinessRegistrationScreen] pickSingleDoc callback', {
          instanceId: screenInstanceIdRef.current,
          target,
          didCancel: response.didCancel,
          errorCode: response.errorCode,
          errorMessage: response.errorMessage,
          assetsCount: response.assets?.length || 0,
          firstUri: response.assets?.[0]?.uri,
        });
        if (response.didCancel || response.errorCode) return;
        const uri = response.assets?.[0]?.uri;
        if (!uri) return;
        if (target === 'ID') {
          setIdDocUri(uri);
          if (fieldErrors.idDoc) {
            setFieldErrors(prev => ({ ...prev, idDoc: undefined }));
          }
        }
        if (target === 'PAN') {
          setPanDocUri(uri);
          if (fieldErrors.panDoc) {
            setFieldErrors(prev => ({ ...prev, panDoc: undefined }));
          }
        }
      },
    );
  };

  const removeShopPhoto = (index: number) => {
    setShopPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const clearDoc = (target: 'ID' | 'PAN') => {
    if (target === 'ID') {
      setIdDocUri(null);
      const error = validateField('idDoc', null);
      setFieldErrors(prev => ({ ...prev, idDoc: error }));
    }
    if (target === 'PAN') {
      setPanDocUri(null);
      const error = validateField('panDoc', null);
      setFieldErrors(prev => ({ ...prev, panDoc: error }));
    }
  };

  const getSelectedTypeLabel = () => {
    if (!type) return t('dealer.selectBusinessType') || 'Select Business Type';
    return type;
  };

  const handleDropdownSelect = (value: string) => {
    setType(value);
    setDropdownModalVisible(false);
    // Validate after selection
    setTimeout(() => {
      const error = validateField('type', value);
      setFieldErrors(prev => ({ ...prev, type: error }));
    }, 100);
  };

  const handlePayoutTypeSelect = (value: string) => {
    setPayoutType(value as 'UPI' | 'BANK');
    setPayoutTypeModalVisible(false);
    // Clear payout fields when type changes
    setUpiId('');
    setAccountNumber('');
    setIfsc('');
    setAccountName('');
    // Clear payout-related errors
    setFieldErrors(prev => ({
      ...prev,
      upiId: undefined,
      accountNumber: undefined,
      ifsc: undefined,
      accountName: undefined,
    }));
  };

  const getSelectedPayoutTypeLabel = () => {
    if (!payoutType) return t('dealer.selectPayoutType') || 'Select Payout Type';
    return payoutType === 'UPI' ? (t('dealer.upi') || 'UPI') : (t('dealer.bank') || 'Bank Account');
  };

  const handleLocationPicker = async () => {
    setIsGettingLocation(true);
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        setLocation(locationData);
        setAddress(locationData.address || locationData.formattedAddress);
      } else {
        showError(t('dealer.locationFailed') || 'Failed to get location. Please try again.');
      }
    } catch (error) {
      showError(t('dealer.locationFailed') || 'Failed to get location. Please try again.');
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

  // Validate individual fields and return error messages
  const validateField = (fieldName: string, value: any): string | undefined => {
    switch (fieldName) {
      case 'businessName':
        if (!value || !value.trim()) {
          return t('dealer.businessNameRequired') || 'Business name is required';
        }
        return undefined;

      case 'type':
        if (!value) {
          return t('dealer.businessTypeRequired') || 'Business type is required';
        }
        return undefined;

      case 'address':
        if (!value || !value.trim()) {
          return t('dealer.addressRequired') || 'Address is required';
        }
        return undefined;

      case 'phone':
        if (!value || !value.trim()) {
          return t('dealer.phoneRequired') || 'Phone number is required';
        }
        if (!isValidPhone(value)) {
          return t('dealer.phoneInvalid') || 'Please enter a valid phone number (at least 10 digits)';
        }
        return undefined;

      case 'upiId':
        if (payoutType === 'UPI') {
          if (!value || !value.trim()) {
            return t('dealer.upiIdRequired') || 'UPI ID is required';
          }
          if (!isValidUPIId(value)) {
            return t('dealer.invalidUPIId') || 'Invalid UPI ID format (e.g., user@paytm)';
          }
        }
        return undefined;

      case 'accountNumber':
        if (payoutType === 'BANK') {
          if (!value || !value.trim()) {
            return t('dealer.accountNumberRequired') || 'Account number is required';
          }
        }
        return undefined;

      case 'ifsc':
        if (payoutType === 'BANK') {
          if (!value || !value.trim()) {
            return t('dealer.ifscRequired') || 'IFSC code is required';
          }
          if (!isValidIFSC(value)) {
            return t('dealer.invalidIFSC') || 'Invalid IFSC code format (e.g., HDFC0001234)';
          }
        }
        return undefined;

      case 'accountName':
        if (payoutType === 'BANK') {
          if (!value || !value.trim()) {
            return t('dealer.accountNameRequired') || 'Account holder name is required';
          }
        }
        return undefined;

      case 'shopPhotos':
        if (!shopPhotoUris || shopPhotoUris.length === 0) {
          return t('dealer.shopPhotosRequired') || 'At least one shop photo is required';
        }
        return undefined;

      case 'idDoc':
        if (!idDocUri) {
          return t('dealer.idDocumentRequired') || 'ID document is required';
        }
        return undefined;

      case 'panDoc':
        if (!panDocUri) {
          return t('dealer.panCardRequired') || 'PAN card is required';
        }
        return undefined;

      case 'gst':
        if (!value || !value.trim()) {
          return t('dealer.gstRequired') || 'GST number is required';
        }
        // Basic GST format validation (15 characters, alphanumeric)
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(value.trim().toUpperCase())) {
          return t('dealer.invalidGST') || 'Invalid GST number format';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  // Validate all fields
  const validateAllFields = (): boolean => {
    const errors: typeof fieldErrors = {};

    errors.businessName = validateField('businessName', businessName);
    errors.type = validateField('type', type);
    errors.address = validateField('address', address);
    errors.phone = validateField('phone', phone);
    errors.gst = validateField('gst', gst);
    errors.shopPhotos = validateField('shopPhotos', shopPhotoUris);
    errors.idDoc = validateField('idDoc', idDocUri);
    errors.panDoc = validateField('panDoc', panDocUri);

    if (payoutType === 'UPI') {
      errors.upiId = validateField('upiId', upiId);
    }

    if (payoutType === 'BANK') {
      errors.accountNumber = validateField('accountNumber', accountNumber);
      errors.ifsc = validateField('ifsc', ifsc);
      errors.accountName = validateField('accountName', accountName);
    }

    setFieldErrors(errors);
    return !Object.values(errors).some(error => error !== undefined);
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

  const isFormValid = useMemo(() => {
    // Inline payout validation for clarity
    let payoutValid = true;
    if (payoutType) {
      if (payoutType === 'UPI') {
        payoutValid = upiId.trim() !== '' && isValidUPIId(upiId);
      } else if (payoutType === 'BANK') {
        payoutValid =
          accountNumber.trim() !== '' &&
          ifsc.trim() !== '' &&
          accountName.trim() !== '' &&
          isValidIFSC(ifsc);
      }
    }

    // Validate GST format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const isGstValid = !!gst.trim() && gstRegex.test(gst.trim().toUpperCase());

    const validations = {
      businessName: !!businessName.trim(),
      type: !!type,
      address: !!address.trim(),
      phone: !!phone.trim() && isValidPhone(phone),
      gst: isGstValid,
      payout: payoutValid,
      shopPhotos: shopPhotoUris.length > 0,
      idDoc: !!idDocUri,
      panDoc: !!panDocUri,
    };

    const isValid = Object.values(validations).every(v => v === true);

    // Debug logging to help identify which validation is failing
    if (!isValid) {
      console.log('[BusinessRegistrationScreen] Validation check:', validations);
      const failedChecks = Object.entries(validations)
        .filter(([_, v]) => !v)
        .map(([key]) => key);
      console.log('[BusinessRegistrationScreen] Failed validations:', failedChecks);
      console.log('[BusinessRegistrationScreen] Current values:', {
        businessName: businessName?.substring(0, 20),
        type,
        address: address?.substring(0, 20),
        phone,
        gst,
        payoutType,
        upiId: upiId?.substring(0, 20),
        shopPhotoUrisCount: shopPhotoUris?.length,
        shopPhotoUris: shopPhotoUris,
        idDocUri: idDocUri ? (idDocUri.length > 50 ? idDocUri.substring(0, 50) + '...' : idDocUri) : null,
        panDocUri: panDocUri ? (panDocUri.length > 50 ? panDocUri.substring(0, 50) + '...' : panDocUri) : null,
      });
    }

    return isValid;
  }, [
    businessName,
    type,
    address,
    phone,
    payoutType,
    upiId,
    accountNumber,
    ifsc,
    accountName,
    shopPhotoUris,
    idDocUri,
    panDocUri,
  ]);

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
    if (!isValidPhone(phone)) {
      showError(t('dealer.phoneInvalid') || 'Please enter a valid phone number (at least 10 digits)');
      return;
    }
    if (!gst.trim()) {
      showError(t('dealer.gstRequired') || 'GST number is required');
      return;
    }
    // Validate GST format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst.trim().toUpperCase())) {
      showError(t('dealer.invalidGST') || 'Invalid GST number format');
      return;
    }

    if (shopPhotoUris.length < 1) {
      showError(t('dealer.shopPhotosRequired') || 'At least one shop photo is required');
      return;
    }
    if (!idDocUri) {
      showError(t('dealer.idDocumentRequired') || 'Document ID is required');
      return;
    }
    if (!panDocUri) {
      showError(t('dealer.panCardRequired') || 'PAN card is required');
      return;
    }

    // Validate payout fields if payout type is selected
    if (payoutType) {
      if (payoutType === 'UPI') {
        if (!upiId.trim()) {
          showError(t('dealer.upiIdRequired') || 'UPI ID is required');
          return;
        }
        if (!isValidUPIId(upiId)) {
          showError(t('dealer.invalidUPIId') || 'Invalid UPI ID format (e.g., user@paytm)');
          return;
        }
      } else if (payoutType === 'BANK') {
        if (!accountNumber.trim()) {
          showError(t('dealer.accountNumberRequired') || 'Account number is required');
          return;
        }
        if (!ifsc.trim()) {
          showError(t('dealer.ifscRequired') || 'IFSC code is required');
          return;
        }
        if (!accountName.trim()) {
          showError(t('dealer.accountNameRequired') || 'Account holder name is required');
          return;
        }
        if (!isValidIFSC(ifsc)) {
          showError(t('dealer.invalidIFSC') || 'Invalid IFSC code format (e.g., HDFC0001234)');
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      const uploadIfNeeded = async (uri: string): Promise<string> => {
        if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
        return await uploadImage(uri);
      };

      // Parallelize image uploads
      const uploadedShopPhotos = await Promise.all(
        shopPhotoUris.map(async (uri) => {
          const url = await uploadIfNeeded(uri);
          return { url };
        })
      );
      console.log('[BusinessRegistrationScreen] Uploaded shop photos:', uploadedShopPhotos);

      const [idDocUrl, panDocUrl] = await Promise.all([
        uploadIfNeeded(idDocUri),
        uploadIfNeeded(panDocUri)
      ]);
      const uploadedDocuments: IBusinessRegistrationDocumentFile[] = [
        { kind: 'ID', url: idDocUrl },
        { kind: 'PAN', url: panDocUrl }
      ];
      console.log('[BusinessRegistrationScreen] Uploaded documents:', uploadedDocuments);

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
        gst: gst.trim().toUpperCase(),
        payout: payoutData,
        shopPhotos: uploadedShopPhotos,
        documents: uploadedDocuments,
      };

      console.log('[BusinessRegistrationScreen] Submitting data with images:', {
        shopPhotosCount: data.shopPhotos.length,
        documentsCount: data.documents.length,
        shopPhotos: data.shopPhotos,
        documents: data.documents,
      });

      if (isEdit && registrationData?.id) {
        await updateBusinessRegistration(registrationData.id, data);
        showSuccess(t('dealer.businessRegistrationUpdated') || 'Business registration updated successfully');
        try {
          storage.delete(BR_DRAFT_STORAGE_KEY);
        } catch { }

        // Also refetch user on edit to ensure latest state
        await refetchUser(setUser);
        goBack();
      } else {
        const registration = await createBusinessRegistration(data);
        console.log('Business registration created successfully:', {
          id: registration.id,
          status: registration.status
        });
        showSuccess(t('dealer.businessRegistrationSubmitted') || 'Business registration submitted successfully. Your request is pending admin approval.');
        try {
          storage.delete(BR_DRAFT_STORAGE_KEY);
        } catch { }

        // Refetch user to update local state (e.g. from user to dealer)
        await refetchUser(setUser);

        // Navigate based on context
        if (registration.status === 'pending' || registration.status === 'approved') {
          setTimeout(async () => {
            console.log('Navigating to DealerTabs after business registration submission');
            await resetAndNavigate('DealerTabs');
          }, 500);
        } else {
          // If manually coming here to add, just go back or to details
          goBack();
        }
      }
    } catch (error: any) {
      console.error('Error submitting business registration:', error);
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        t('dealer.operationFailed') ||
        'Operation failed. Please try again.';
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
    textInputContainerError: {
      borderColor: colors.error || '#ef4444',
      borderWidth: 1.5,
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
    dropdownButtonError: {
      borderColor: colors.error || '#ef4444',
      borderWidth: 1.5,
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
    imagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: screenWidth * 0.02,
      marginTop: screenHeight * 0.01,
    },
    imageWrapper: {
      position: 'relative',
      width: screenWidth * 0.25,
      height: screenWidth * 0.25,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    removeImageButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.012,
      gap: screenWidth * 0.02,
    },
    docLeft: {
      flex: 1,
      gap: 4,
    },
    docTitle: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Medium,
      color: colors.text,
    },
    docSub: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Regular,
      color: colors.text,
      opacity: 0.7,
    },
    helperText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      marginTop: 4,
      marginLeft: 4
    },
    errorText: {
      fontSize: RFValue(8),
      fontFamily: Fonts.Regular,
      color: colors.error || '#ef4444',
      marginTop: screenHeight * 0.006,
      marginLeft: screenWidth * 0.01,
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader title={isEdit ? (t('dealer.updateRegistration') || 'Update Registration') : (t('dealer.businessRegistration') || 'Business Registration')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: screenHeight * 0.12 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('dealer.businessName') || 'Business Name'} *
          </CustomText>
          <View style={[styles.textInputContainer, fieldErrors.businessName && styles.textInputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterBusinessName') || 'Enter business name'}
              placeholderTextColor={colors.disabled}
              value={businessName}
              onChangeText={(text) => {
                setBusinessName(text);
                if (fieldErrors.businessName) {
                  const error = validateField('businessName', text);
                  setFieldErrors(prev => ({ ...prev, businessName: error }));
                }
              }}
              onBlur={() => {
                const error = validateField('businessName', businessName);
                setFieldErrors(prev => ({ ...prev, businessName: error }));
              }}
            />
          </View>
          {fieldErrors.businessName && (
            <CustomText style={styles.errorText}>{fieldErrors.businessName}</CustomText>
          )}
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('dealer.businessType') || 'Business Type'} *
          </CustomText>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              fieldErrors.type && { borderColor: colors.error || '#ef4444', borderWidth: 1.5 },
            ]}
            onPress={() => setDropdownModalVisible(true)}>
            <CustomText style={styles.dropdownButtonText}>{getSelectedTypeLabel()}</CustomText>
            <Icon name="chevron-down" size={RFValue(16)} color={colors.text} />
          </TouchableOpacity>
          {fieldErrors.type && (
            <CustomText style={styles.errorText}>{fieldErrors.type}</CustomText>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <CustomText style={styles.label}>{t('dealer.address') || 'Address'} *</CustomText>
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
                  {isGettingLocation ? (t('dealer.gettingLocation') || 'Getting location...') : (t('dealer.useCurrentLocation') || 'Use Current Location')}
                </CustomText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={removeLocation}>
                <Icon name="location" size={RFValue(12)} color={Colors.secondary} />
                <CustomText style={styles.locationButtonText}>
                  {t('dealer.locationSet') || 'Location Set'}
                </CustomText>
                <Icon name="close-circle" size={RFValue(14)} color={colors.error} style={styles.removeLocationIcon} />
              </TouchableOpacity>
            )}
          </View>
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
          <View style={[styles.textInputContainer, fieldErrors.phone && styles.textInputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterPhone') || 'Enter phone number'}
              placeholderTextColor={colors.disabled}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (fieldErrors.phone) {
                  const error = validateField('phone', text);
                  setFieldErrors(prev => ({ ...prev, phone: error }));
                }
              }}
              onBlur={() => {
                const error = validateField('phone', phone);
                setFieldErrors(prev => ({ ...prev, phone: error }));
              }}
              keyboardType="phone-pad"
            />
          </View>
          {fieldErrors.phone && (
            <CustomText style={styles.errorText}>{fieldErrors.phone}</CustomText>
          )}
        </View>

        <View style={styles.section}>
          <CustomText style={styles.label}>{t('dealer.gst') || 'GST Number'} *</CustomText>
          <View style={[styles.textInputContainer, fieldErrors.gst && styles.textInputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={t('dealer.enterGST') || 'Enter GST number (e.g., 27AABCU9603R1ZX)'}
              placeholderTextColor={colors.disabled}
              value={gst}
              onChangeText={(text) => {
                const upperText = text.toUpperCase();
                setGst(upperText);
                if (fieldErrors.gst) {
                  const error = validateField('gst', upperText);
                  setFieldErrors(prev => ({ ...prev, gst: error }));
                }
              }}
              onBlur={() => {
                const error = validateField('gst', gst);
                setFieldErrors(prev => ({ ...prev, gst: error }));
              }}
              autoCapitalize="characters"
              maxLength={15}
            />
          </View>
          {fieldErrors.gst && (
            <CustomText style={styles.errorText}>{fieldErrors.gst}</CustomText>
          )}
        </View>

        {/* Payout Section */}
        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('dealer.payoutType') || 'Payout Type'} ({t('dealer.optional') || 'Optional'})
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
              {t('dealer.upiId') || 'UPI ID'} *
            </CustomText>
            <View style={[styles.textInputContainer, fieldErrors.upiId && styles.textInputContainerError]}>
              <TextInput
                style={styles.textInput}
                placeholder={t('dealer.enterUPIId') || 'Enter UPI ID (e.g., user@paytm)'}
                placeholderTextColor={colors.disabled}
                value={upiId}
                onChangeText={(text) => {
                  setUpiId(text);
                  if (fieldErrors.upiId) {
                    const error = validateField('upiId', text);
                    setFieldErrors(prev => ({ ...prev, upiId: error }));
                  }
                }}
                onBlur={() => {
                  const error = validateField('upiId', upiId);
                  setFieldErrors(prev => ({ ...prev, upiId: error }));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {fieldErrors.upiId && (
              <CustomText style={styles.errorText}>{fieldErrors.upiId}</CustomText>
            )}
          </View>
        )}

        {/* Bank Account Fields */}
        {payoutType === 'BANK' && (
          <>
            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('dealer.accountNumber') || 'Account Number'} *
              </CustomText>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterAccountNumber') || 'Enter account number'}
                  placeholderTextColor={colors.disabled}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('dealer.ifsc') || 'IFSC Code'} *
              </CustomText>
              <View style={[styles.textInputContainer, fieldErrors.ifsc && styles.textInputContainerError]}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterIFSC') || 'Enter IFSC code (e.g., HDFC0001234)'}
                  placeholderTextColor={colors.disabled}
                  value={ifsc}
                  onChangeText={(text) => {
                    const upperText = text.toUpperCase();
                    setIfsc(upperText);
                    if (fieldErrors.ifsc) {
                      const error = validateField('ifsc', upperText);
                      setFieldErrors(prev => ({ ...prev, ifsc: error }));
                    }
                  }}
                  onBlur={() => {
                    const error = validateField('ifsc', ifsc);
                    setFieldErrors(prev => ({ ...prev, ifsc: error }));
                  }}
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>
              {fieldErrors.ifsc && (
                <CustomText style={styles.errorText}>{fieldErrors.ifsc}</CustomText>
              )}
            </View>

            <View style={styles.section}>
              <CustomText style={styles.label}>
                {t('dealer.accountName') || 'Account Holder Name'} *
              </CustomText>
              <View style={[styles.textInputContainer, fieldErrors.accountName && styles.textInputContainerError]}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('dealer.enterAccountName') || 'Enter account holder name'}
                  placeholderTextColor={colors.disabled}
                  value={accountName}
                  onChangeText={(text) => {
                    setAccountName(text);
                    if (fieldErrors.accountName) {
                      const error = validateField('accountName', text);
                      setFieldErrors(prev => ({ ...prev, accountName: error }));
                    }
                  }}
                  onBlur={() => {
                    const error = validateField('accountName', accountName);
                    setFieldErrors(prev => ({ ...prev, accountName: error }));
                  }}
                />
              </View>
              {fieldErrors.accountName && (
                <CustomText style={styles.errorText}>{fieldErrors.accountName}</CustomText>
              )}
            </View>
          </>
        )}

        {/* Shop Photos */}
        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('dealer.shopPhotos') || 'Shop Photos'} *
          </CustomText>
          <TouchableOpacity
            style={[styles.button, fieldErrors.shopPhotos && { borderColor: colors.error || '#ef4444', borderWidth: 1.5 }]}
            onPress={() => {
              pickShopPhotos();
            }}
            disabled={isSubmitting}>
            <Icon name="image-outline" size={RFValue(16)} color={colors.text} />
            <CustomText style={styles.buttonText}>
              {(t('dealer.addImages') || 'Add Images') + ` (${shopPhotoUris.length}/${MAX_SHOP_PHOTOS})`}
            </CustomText>
          </TouchableOpacity>
          {shopPhotoUris.length > 0 && (
            <View style={styles.imagesContainer}>
              {shopPhotoUris.map((uri, index) => (
                <View key={`${uri}_${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      removeShopPhoto(index);
                      if (fieldErrors.shopPhotos && shopPhotoUris.length <= 1) {
                        setFieldErrors(prev => ({ ...prev, shopPhotos: undefined }));
                      }
                    }}
                    disabled={isSubmitting}>
                    <Icon name="close" size={RFValue(12)} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {fieldErrors.shopPhotos && (
            <CustomText style={styles.errorText}>{fieldErrors.shopPhotos}</CustomText>
          )}
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <CustomText style={styles.label}>
            {t('dealer.documents') || 'Documents'} *
          </CustomText>

          <View style={{ gap: screenHeight * 0.012 }}>
            {/* Document ID */}
            <TouchableOpacity
              style={[styles.docRow, fieldErrors.idDoc && { borderColor: colors.error || '#ef4444', borderWidth: 1.5 }]}
              onPress={() => pickSingleDoc('ID')}
              disabled={isSubmitting}>
              <Icon name="card-outline" size={RFValue(16)} color={colors.text} />
              <View style={styles.docLeft}>
                <CustomText style={styles.docTitle}>{t('dealer.documentId') || 'Document ID'}</CustomText>
                <CustomText style={styles.docSub} numberOfLines={1}>
                  {idDocUri ? (t('dealer.tapToChange') || 'Tap to change') : (t('dealer.tapToUpload') || 'Tap to upload')}
                </CustomText>
              </View>
              {idDocUri ? (
                <TouchableOpacity onPress={() => clearDoc('ID')} disabled={isSubmitting}>
                  <Icon name="close-circle" size={RFValue(18)} color={colors.error} />
                </TouchableOpacity>
              ) : (
                <Icon name="chevron-forward" size={RFValue(18)} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            {idDocUri && (
              <View style={styles.imagesContainer}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: idDocUri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => clearDoc('ID')}
                    disabled={isSubmitting}>
                    <Icon name="close" size={RFValue(12)} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {fieldErrors.idDoc && (
              <CustomText style={styles.errorText}>{fieldErrors.idDoc}</CustomText>
            )}

            {/* PAN Card */}
            <TouchableOpacity
              style={[styles.docRow, fieldErrors.panDoc && { borderColor: colors.error || '#ef4444', borderWidth: 1.5 }]}
              onPress={() => pickSingleDoc('PAN')}
              disabled={isSubmitting}>
              <Icon name="id-card-outline" size={RFValue(16)} color={colors.text} />
              <View style={styles.docLeft}>
                <CustomText style={styles.docTitle}>{t('dealer.panCard') || 'PAN Card'}</CustomText>
                <CustomText style={styles.docSub} numberOfLines={1}>
                  {panDocUri ? (t('dealer.tapToChange') || 'Tap to change') : (t('dealer.tapToUpload') || 'Tap to upload')}
                </CustomText>
              </View>
              {panDocUri ? (
                <TouchableOpacity onPress={() => clearDoc('PAN')} disabled={isSubmitting}>
                  <Icon name="close-circle" size={RFValue(18)} color={colors.error} />
                </TouchableOpacity>
              ) : (
                <Icon name="chevron-forward" size={RFValue(18)} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            {panDocUri && (
              <View style={styles.imagesContainer}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: panDocUri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => clearDoc('PAN')}
                    disabled={isSubmitting}>
                    <Icon name="close" size={RFValue(12)} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {fieldErrors.panDoc && (
              <CustomText style={styles.errorText}>{fieldErrors.panDoc}</CustomText>
            )}
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
                {isEdit ? (t('dealer.updateRegistration') || 'Update Registration') : (t('dealer.submitRegistration') || 'Submit Registration')}
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

      <CustomDropdownModal
        visible={payoutTypeModalVisible}
        onClose={() => setPayoutTypeModalVisible(false)}
        options={PAYOUT_TYPES}
        selectedValue={payoutType}
        onSelect={handlePayoutTypeSelect}
        title={t('dealer.selectPayoutType') || 'Select Payout Type'}
        searchable={false}
      />
    </View>
  );
};

export default BusinessRegistrationScreen;

