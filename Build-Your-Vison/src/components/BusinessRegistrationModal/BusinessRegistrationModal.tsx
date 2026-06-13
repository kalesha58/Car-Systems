import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Modal } from '@components/Modal/Modal';
import { Select } from '@components/Select';
import { createBusinessRegistration, getBusinessRegistrationByUserId, type ICreateBusinessRegistrationPayload, updateBusinessRegistration } from '@services/dealerService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { formatPhoneInput, getPhoneError } from '@utils/validation';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import React from 'react';

interface IBusinessRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerId: string;
  onSuccess?: () => void;
  onSkip?: () => void;
  hasExistingRegistration?: boolean;
}

const BUSINESS_TYPES = [
  'Automobile Showroom',
  'Vehicle Wash Station',
  'Detailing Center',
  'Mechanic Workshop',
  'Spare Parts Dealer',
  'Riding Gear Store',
] as const;

export const BusinessRegistrationModal: React.FC<IBusinessRegistrationModalProps> = ({
  isOpen,
  onClose,
  dealerId,
  onSuccess,
  onSkip,
  hasExistingRegistration = false,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [formData, setFormData] = useState<ICreateBusinessRegistrationPayload>({
    businessName: '',
    type: 'Automobile Showroom',
    address: '',
    phone: '',
    gst: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ICreateBusinessRegistrationPayload, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch existing business registration data when editing
  React.useEffect(() => {
    const fetchBusinessRegistration = async () => {
      if (isOpen && hasExistingRegistration && dealerId) {
        try {
          setLoading(true);
          // Use admin endpoint with userId to get business registration
          const response = await getBusinessRegistrationByUserId(dealerId);
          if (response.Response) {
            setFormData({
              businessName: response.Response.businessName || '',
              type: response.Response.type || 'Automobile Showroom',
              address: response.Response.address || '',
              phone: response.Response.phone || '',
              gst: response.Response.gst || '',
            });
          }
        } catch (error) {
          console.error('Error fetching business registration:', error);
        } finally {
          setLoading(false);
        }
      } else if (isOpen && !hasExistingRegistration) {
        // Reset form for new registration
        setFormData({
          businessName: '',
          type: 'Automobile Showroom',
          address: '',
          phone: '',
          gst: '',
        });
        setErrors({});
      }
    };

    fetchBusinessRegistration();
  }, [isOpen, hasExistingRegistration, dealerId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ICreateBusinessRegistrationPayload, string>> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Business type is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.gst.trim()) {
      newErrors.gst = 'GST number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      let response;
      if (hasExistingRegistration) {
        // Update existing business registration using userId (dealerId)
        // Endpoint: PUT /admin/dealers/{userId}/business-registration
        response = await updateBusinessRegistration(dealerId, formData);
      } else {
        // Create new business registration
        // Endpoint: POST /admin/dealers/{userId}/business-registration
        response = await createBusinessRegistration(dealerId, formData);
      }
      
      // Check response structure
      // Response structure: { success: true/false, Response: { ... }, ReturnMessage: "...", message: "..." }
      const responseData = response as { 
        success?: boolean;
        Response?: { ReturnMessage?: string; message?: string }; 
        ReturnMessage?: string; 
        message?: string;
        data?: unknown;
      };
      
      // Check if response explicitly has success: false
      // If so, the API interceptor already showed an error toast - don't show another one
      if (responseData.success === false) {
        // Interceptor already showed error toast, just close and reset
        onSuccess?.();
        setFormData({
          businessName: '',
          type: 'Automobile Showroom',
          address: '',
          phone: '',
          gst: '',
        });
        setErrors({});
        onClose();
        return;
      }
      
      // Check if the response indicates success
      // Response is successful if: success === true OR Response object exists OR data exists
      const isSuccess = response && (
        responseData.success === true || 
        responseData.Response !== undefined ||
        responseData.data !== undefined
      );
      
      if (isSuccess) {
        // For success responses, check if backend provided a message
        const backendMessage = responseData?.Response?.ReturnMessage ||
                               responseData?.Response?.message ||
                               responseData?.ReturnMessage ||
                               responseData?.message;
        
        // Only show our generic success message if backend didn't provide one
        // Backend messages are typically shown by the backend response itself
        if (!backendMessage || !backendMessage.trim()) {
          showToast(
            hasExistingRegistration 
              ? 'Business registration updated successfully' 
              : 'Business registration completed successfully', 
            'success'
          );
        }
        
        // Call onSuccess callback to update parent component state
        onSuccess?.();
        // Reset form after successful submission
        setFormData({
          businessName: '',
          type: 'Automobile Showroom',
          address: '',
          phone: '',
          gst: '',
        });
        setErrors({});
        onClose();
      } else {
        // If success is false or missing, the API interceptor already showed an error toast
        // Don't show another error toast here to avoid duplicates
        onSuccess?.();
        setFormData({
          businessName: '',
          type: 'Automobile Showroom',
          address: '',
          phone: '',
          gst: '',
        });
        setErrors({});
        onClose();
      }
    } catch (error: unknown) {
      console.error(`Error ${hasExistingRegistration ? 'updating' : 'creating'} business registration:`, error);
      
      // The API interceptor already shows error toasts for API errors with ReturnMessage
      // Don't show additional error toasts here to avoid duplicates
      // Only handle the error silently and let the interceptor's toast be the single source of truth
      
      // Check if this is actually a success response that was incorrectly caught
      const responseData = (error as { response?: { data?: { success?: boolean; Response?: unknown; data?: unknown; ReturnMessage?: string; message?: string } } })?.response?.data;
      if (responseData && (
        responseData.success === true || 
        responseData.Response !== undefined ||
        responseData.data !== undefined
      )) {
        // This is actually a success, but was caught as an error
        // Don't show toast here - let the try block handle it or show generic success
        const backendMessage = responseData.Response && typeof responseData.Response === 'object' && 'ReturnMessage' in responseData.Response
          ? (responseData.Response as { ReturnMessage?: string }).ReturnMessage
          : responseData.ReturnMessage || responseData.message;
        
        // Only show success toast if backend didn't provide a message
        if (!backendMessage || !backendMessage.trim()) {
          showToast(
            hasExistingRegistration 
              ? 'Business registration updated successfully' 
              : 'Business registration completed successfully', 
            'success'
          );
        }
        
        onSuccess?.();
        setFormData({
          businessName: '',
          type: 'Automobile Showroom',
          address: '',
          phone: '',
          gst: '',
        });
        setErrors({});
        onClose();
        return;
      }
      
      // For actual errors, the interceptor already showed the toast
      // Don't show another one here
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
              <Building2 size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="m-0 text-xl font-bold text-slate-900 dark:text-white">
                Business Registration
              </h2>
              <p className="m-0 mt-1 text-sm text-slate-500 dark:text-slate-400">
                {hasExistingRegistration
                  ? 'Update your business registration details'
                  : 'Complete your business registration to continue'}
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(value) => {
                setFormData({ ...formData, businessName: value });
                setErrors({ ...errors, businessName: undefined });
              }}
              placeholder="Enter business name"
              error={errors.businessName}
              required
              icon={Building2}
            />

            <div style={{ marginBottom: theme.spacing.md }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: theme.spacing.xs,
                  color: theme.colors.text,
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                Business Type <span style={{ color: theme.colors.error }}>*</span>
              </label>
              <Select
                value={formData.type}
                onChange={(value) => {
                  setFormData({ ...formData, type: value });
                  setErrors({ ...errors, type: undefined });
                }}
                placeholder="Select business type"
                required
                error={errors.type}
                options={BUSINESS_TYPES.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
              {errors.type && (
                <div style={{ marginTop: theme.spacing.xs, color: theme.colors.error, fontSize: '0.875rem' }}>
                  {errors.type}
                </div>
              )}
            </div>

            <Input
              label="Address"
              value={formData.address}
              onChange={(value) => {
                setFormData({ ...formData, address: value });
                setErrors({ ...errors, address: undefined });
              }}
              placeholder="Enter business address"
              error={errors.address}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(value) => {
                const formatted = formatPhoneInput(value);
                setFormData({ ...formData, phone: formatted });
                setErrors({ ...errors, phone: getPhoneError(formatted) });
              }}
              placeholder="Enter 10-digit phone number"
              error={errors.phone}
              required
            />

            <Input
              label="GST Number"
              value={formData.gst}
              onChange={(value) => {
                setFormData({ ...formData, gst: value });
                setErrors({ ...errors, gst: undefined });
              }}
              placeholder="Enter GST number"
              error={errors.gst}
              required
            />

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end', marginTop: theme.spacing.xl }}>
              {!hasExistingRegistration && (
                <Button variant="outline" onClick={handleSkip}>
                  Skip for Now
                </Button>
              )}
              <Button onClick={handleSubmit} loading={submitting || loading}>
                {hasExistingRegistration ? 'Update Registration' : 'Register Business'}
              </Button>
            </div>
        </motion.div>
      </div>
    </Modal>
  );
};

