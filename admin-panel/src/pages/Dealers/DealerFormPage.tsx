import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
// import { BusinessRegistrationModal } from '@components/BusinessRegistrationModal/BusinessRegistrationModal';
// import { BusinessRegistrationViewModal } from '@components/BusinessRegistrationViewModal/BusinessRegistrationViewModal';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';

import { Input } from '@components/Input/Input';



import { SkeletonCard } from '@components/Skeleton';

import { createUser, getUserById, updateUser } from '@services/userService';

import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { formatPhoneInput, getEmailError, getPhoneError } from '@utils/validation';
import { motion } from 'framer-motion';
import { /* AlertCircle, */ /* Building2, */ /* Edit, Eye */ } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';



export const DealerFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const isEdit = Boolean(id && id !== 'new');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: ['user', 'dealer'] as string[],
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});

  /*
  const [showBusinessRegistrationModal, setShowBusinessRegistrationModal] = useState(false);
  const [showBusinessRegistrationViewModal, setShowBusinessRegistrationViewModal] = useState(false);
  const [hasBusinessRegistration, setHasBusinessRegistration] = useState<boolean | null>(null);
  const [_businessRegistrationId, setBusinessRegistrationId] = useState<string | null>(null);
  const [businessRegistrationData, setBusinessRegistrationData] = useState<{
    id: string;
    businessName: string;
    type: string;
    address: string;
    phone: string;
    gst: string;
    status?: string;
    userId: string;
    createdAt?: string;
    updatedAt?: string;
  } | null>(null);
  */

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    
    const fetchKey = id;
    if (isFetchingRef.current && lastFetchedIdRef.current === fetchKey) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isFetchingRef.current = true;
    lastFetchedIdRef.current = fetchKey;

    const fetchDealer = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(id);
        const userRole = (userData as { role?: string | string[]; roles?: string | string[] }).role || (userData as { role?: string | string[]; roles?: string | string[] }).roles || ['user', 'dealer'];
        
        setUserFormData({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: '',
          role: Array.isArray(userRole) ? userRole : ['user', 'dealer'],
        });

        // Use isBusinessRegistration flag from user data
        if (id) {
          // const isBusinessRegistered = (userData as { isBusinessRegistration?: boolean }).isBusinessRegistration === true;
          // setHasBusinessRegistration(isBusinessRegistered);
          
          // Don't fetch business registration details automatically - only fetch when user clicks view/edit

        }
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          console.error('Error fetching dealer:', error);
          showToast('Failed to load dealer details', 'error');
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchDealer();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, isEdit, showToast]);



  const validateUserForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailError = getEmailError(userFormData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const phoneError = getPhoneError(userFormData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    if (!isEdit && !userFormData.password) {
      newErrors.password = 'Password is required';
    } else if (userFormData.password && userFormData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!userFormData.role || userFormData.role.length === 0) {
      newErrors.role = 'At least one role must be selected';
    }

    setUserFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserSubmit = async () => {
    if (!validateUserForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const cleanPhone = userFormData.phone.replace(/\D/g, '');
      
      if (isEdit && id) {
        await updateUser(id, {
          name: userFormData.name,
          email: userFormData.email,
          phone: cleanPhone,
          role: userFormData.role,
        });
        showToast('Dealer updated successfully', 'success');
      } else {
        await createUser({
          name: userFormData.name,
          email: userFormData.email,
          phone: cleanPhone,
          password: userFormData.password,
          role: userFormData.role,
        });
        showToast('Dealer created successfully', 'success');
        navigate('/dealers');
        return;
      }
      navigate('/dealers');
    } catch (error) {
      console.error('Error saving dealer:', error);
      showToast(isEdit ? 'Failed to update dealer' : 'Failed to create dealer', 'error');
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div>
        <Breadcrumbs />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Breadcrumbs />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          flexWrap: 'wrap',
          gap: theme.spacing.md,
        }}
        className="flex-col sm:flex-row"
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: theme.colors.text,
            margin: 0,
          }}
          className="text-xl sm:text-2xl"
        >
          {isEdit ? 'Edit Dealer' : 'Create New Dealer'}
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-8">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Input
            label="Name"
            value={userFormData.name}
            onChange={(value) => {
              setUserFormData({ ...userFormData, name: value });
              setUserFormErrors({ ...userFormErrors, name: '' });
            }}
            placeholder="Enter dealer name"
            error={userFormErrors.name}
            required
            disabled={isEdit}
          />

          <Input
            label="Email"
            type="email"
            value={userFormData.email}
            onChange={(value) => {
              setUserFormData({ ...userFormData, email: value });
              setUserFormErrors({ ...userFormErrors, email: getEmailError(value) });
            }}
            placeholder="Enter email"
            error={userFormErrors.email}
            required
            disabled={isEdit}
          />

          <Input
            label="Phone"
            type="tel"
            value={userFormData.phone}
            onChange={(value) => {
              const formatted = formatPhoneInput(value);
              setUserFormData({ ...userFormData, phone: formatted });
              setUserFormErrors({ ...userFormErrors, phone: getPhoneError(formatted) });
            }}
            placeholder="Enter 10-digit phone number"
            error={userFormErrors.phone}
            required
            disabled={isEdit}
          />

          {!isEdit && (
            <Input
              label="Password"
              type="password"
              value={userFormData.password}
              onChange={(value) => {
                setUserFormData({ ...userFormData, password: value });
                setUserFormErrors({ ...userFormErrors, password: '' });
              }}
              placeholder="Enter password"
              error={userFormErrors.password}
              required
            />
          )}

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Roles
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
              }}
            >
              {['user', 'dealer', 'admin'].map((role) => {
                const isDealerRoleDisabled = role === 'dealer';
                const isChecked = userFormData.role.includes(role);
                
                const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                  user: {
                    bg: isChecked ? '#E3F2FD' : theme.colors.surface,
                    border: isChecked ? '#2196F3' : theme.colors.border,
                    text: isChecked ? '#1976D2' : theme.colors.text,
                  },
                  dealer: {
                    bg: isChecked ? '#FFF3E0' : theme.colors.surface,
                    border: isChecked ? '#FF9800' : theme.colors.border,
                    text: isChecked ? '#F57C00' : theme.colors.text,
                  },
                  admin: {
                    bg: isChecked ? '#F3E5F5' : theme.colors.surface,
                    border: isChecked ? '#9C27B0' : theme.colors.border,
                    text: isChecked ? '#7B1FA2' : theme.colors.text,
                  },
                };
                
                const roleColor = roleColors[role] || roleColors.user;
                
                return (
                  <motion.label
                    key={role}
                    whileHover={!isDealerRoleDisabled ? { scale: 1.02 } : {}}
                    whileTap={!isDealerRoleDisabled ? { scale: 0.98 } : {}}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: `${theme.spacing.sm} ${theme.spacing.xs}`,
                      borderRadius: theme.borderRadius.md,
                      border: `2px solid ${roleColor.border}`,
                      backgroundColor: roleColor.bg,
                      cursor: isDealerRoleDisabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: isDealerRoleDisabled ? 0.6 : 1,
                      position: 'relative',
                      minHeight: '70px',
                      boxShadow: isChecked 
                        ? `0 2px 8px ${roleColor.border}40` 
                        : '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDealerRoleDisabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUserFormData({
                            ...userFormData,
                            role: [...userFormData.role, role],
                          });
                        } else {
                          if (role === 'dealer') {
                            return;
                          }
                          if (userFormData.role.length > 1) {
                            setUserFormData({
                              ...userFormData,
                              role: userFormData.role.filter((r) => r !== role),
                            });
                          }
                        }
                      }}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: 0,
                        height: 0,
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: isChecked ? roleColor.border : '#E0E0E0',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        boxShadow: isChecked 
                          ? `0 2px 6px ${roleColor.border}60` 
                          : 'inset 0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <motion.div
                        animate={{
                          x: isChecked ? 18 : 2,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isChecked && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={roleColor.border}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </motion.svg>
                        )}
                      </motion.div>
                    </div>
                    <span
                      style={{
                        color: roleColor.text,
                        textTransform: 'capitalize',
                        fontSize: '0.875rem',
                        fontWeight: isChecked ? '600' : '500',
                        letterSpacing: '0.3px',
                        textAlign: 'center',
                      }}
                    >
                      {role}
                    </span>
                    {isDealerRoleDisabled && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: theme.colors.text,
                          opacity: 0.7,
                          fontStyle: 'italic',
                          marginTop: '-2px',
                        }}
                      >
                        Required
                      </span>
                    )}
                  </motion.label>
                );
              })}
            </div>
            {userFormErrors.role && (
              <div style={{ marginTop: theme.spacing.xs, color: theme.colors.error, fontSize: '0.875rem' }}>
                {userFormErrors.role}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'flex-end',
              marginTop: theme.spacing.xl,
            }}
          >
            <Button variant="outline" onClick={() => navigate('/dealers')} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUserSubmit} loading={submitting}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
        </Card>
      </motion.div>

      {/* Business Registration Status */}
      {/*
      {isEdit && id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <Card 
            title="Business Registration" 
            icon={Building2}
            className="shadow-lg"
          >
          {hasBusinessRegistration === null ? (
            <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
              <LoadingSpinner />
            </div>
          ) : hasBusinessRegistration ? (
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: theme.spacing.md,
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.success + '10',
                borderRadius: theme.borderRadius.lg,
                border: `2px solid ${theme.colors.success}40`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.success,
                  boxShadow: `0 0 0 4px ${theme.colors.success}20`,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <span style={{ color: theme.colors.text, fontWeight: '600', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                    Business registration completed
                  </span>
                  <span style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                    This dealer can now add and manage vehicles
                  </span>
                </div>
                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (id) {
                        try {
                          // Fetch business registration using the admin endpoint with userId
                          const { getBusinessRegistrationByUserId } = await import('@services/dealerService');
                          const response = await getBusinessRegistrationByUserId(id);
                          if (response.Response) {
                            setBusinessRegistrationData(response.Response);
                            if (response.Response.id) {
                              setBusinessRegistrationId(response.Response.id);
                            }
                            setShowBusinessRegistrationViewModal(true);
                          } else {
                            showToast('Business registration not found', 'error');
                          }
                        } catch (error) {
                          console.error('Error fetching business registration:', error);
                          showToast('Failed to load business registration details', 'error');
                        }
                      }
                    }}
                    icon={Eye}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBusinessRegistrationModal(true)}
                    icon={Edit}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: theme.spacing.xl, 
              backgroundColor: theme.colors.warning + '10',
              borderRadius: theme.borderRadius.lg,
              border: `2px solid ${theme.colors.warning}40`,
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.warning + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertCircle size={24} style={{ color: theme.colors.warning }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, marginBottom: theme.spacing.xs, color: theme.colors.text, fontWeight: '600', fontSize: '1.125rem' }}>
                    Business Registration Required
                  </h4>
                  <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Please complete business registration before adding vehicles to this dealer. This is a required step to manage vehicle inventory.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowBusinessRegistrationModal(true)} 
                icon={Building2}
              >
                Register Business Now
              </Button>
            </div>
          )}
          </Card>
        </motion.div>
      )}
      */}



      {/* Business Registration Modal */}
      {/*
      {isEdit && id && (
        <BusinessRegistrationModal
          isOpen={showBusinessRegistrationModal}
          hasExistingRegistration={hasBusinessRegistration === true}
          onClose={async () => {
            setShowBusinessRegistrationModal(false);
            // Refresh user data to get updated isBusinessRegistration flag
            if (id) {
              try {
                const userData = await getUserById(id);
                const isBusinessRegistered = (userData as { isBusinessRegistration?: boolean }).isBusinessRegistration === true;
                setHasBusinessRegistration(isBusinessRegistered);
                if (isBusinessRegistered) {
                  fetchVehicles(id);
                }
              } catch (error) {
                console.error('Error refreshing user data:', error);
                setHasBusinessRegistration(false);
              }
            }
          }}
          dealerId={id || ''}
          onSuccess={async () => {
            setShowBusinessRegistrationModal(false);
            // Refresh user data to get updated isBusinessRegistration flag
            if (id) {
              try {
                const userData = await getUserById(id);
                const isBusinessRegistered = (userData as { isBusinessRegistration?: boolean }).isBusinessRegistration === true;
                setHasBusinessRegistration(isBusinessRegistered);
                // Fetch vehicles if business registration is now complete
                if (isBusinessRegistered) {
                  fetchVehicles(id);
                }
                // Success toast is already shown in the modal component, no need to show it again
              } catch (error) {
                console.error('Error refreshing user data:', error);
                showToast('Business registration completed, but failed to refresh status', 'warning');
              }
            }
          }}
        />
      )}
      */}

      {/* Business Registration View Modal */}
      {/*
      {isEdit && id && (
        <BusinessRegistrationViewModal
          isOpen={showBusinessRegistrationViewModal}
          onClose={() => setShowBusinessRegistrationViewModal(false)}
          data={businessRegistrationData}
        />
      )}
      */}
    </motion.div>
  );
};

