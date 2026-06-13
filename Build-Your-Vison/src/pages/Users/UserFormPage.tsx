import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { BusinessRegistrationModal } from '@components/BusinessRegistrationModal/BusinessRegistrationModal';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { SkeletonCard } from '@components/Skeleton';
import { createUser, getUserById, updateUser } from '@services/userService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { formatPhoneInput,getEmailError, getPhoneError } from '@utils/validation';
import { motion } from 'framer-motion';
import { useEffect, useRef,useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export const UserFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const isEdit = Boolean(id && id !== 'new');
  const isDealerContext = searchParams.get('type') === 'dealer';
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: isDealerContext ? ['user', 'dealer'] as string[] : ['user'] as string[],
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [showBusinessRegistrationModal, setShowBusinessRegistrationModal] = useState(false);
  const [newDealerId, setNewDealerId] = useState<string | null>(null);
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

    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(id);
        const userRole = (userData as any).role || (userData as any).roles || ['user'];
        // Preserve all roles from API response, ensuring it's an array
        const rolesArray = Array.isArray(userRole) ? userRole : ['user'];
        
        setUserFormData({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: '',
          role: rolesArray,
        });
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          console.error('Error fetching user:', error);
          showToast('Failed to load user details', 'error');
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchUser();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, isEdit, showToast]);

  const validateForm = (): boolean => {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
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
        showToast(isDealerContext ? 'Dealer updated successfully' : 'User updated successfully', 'success');
      } else {
        const newUser = await createUser({
          name: userFormData.name,
          email: userFormData.email,
          phone: cleanPhone,
          password: userFormData.password,
          role: userFormData.role,
        });
        showToast(isDealerContext ? 'Dealer created successfully' : 'User created successfully', 'success');
        
        // If dealer, show business registration modal
        if (isDealerContext && newUser?.id) {
          setNewDealerId(newUser.id);
          setShowBusinessRegistrationModal(true);
          return; // Don't navigate yet, wait for business registration
        }
      }
      navigate(isDealerContext ? '/dealers' : '/users');
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(isEdit ? (isDealerContext ? 'Failed to update dealer' : 'Failed to update user') : (isDealerContext ? 'Failed to create dealer' : 'Failed to create user'), 'error');
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
        }}
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
          {isEdit ? (isDealerContext ? 'Edit Dealer' : 'Edit User') : (isDealerContext ? 'Create New Dealer' : 'Create New User')}
        </h1>
      </div>

      <Card>
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="w-full">
          <Input
            label="Name"
            value={userFormData.name}
            onChange={(value) => {
              setUserFormData({ ...userFormData, name: value });
              setUserFormErrors({ ...userFormErrors, name: '' });
            }}
            placeholder="Enter name"
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
                const isDealerRoleDisabled = role === 'dealer' && isDealerContext;
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
                          if (role === 'dealer' && isDealerContext) {
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
            <Button variant="outline" onClick={() => navigate(isDealerContext ? '/dealers' : '/users')} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Business Registration Modal */}
      {showBusinessRegistrationModal && newDealerId && (
        <BusinessRegistrationModal
          isOpen={showBusinessRegistrationModal}
          onClose={() => {
            setShowBusinessRegistrationModal(false);
            navigate('/dealers');
          }}
          dealerId={newDealerId}
          onSuccess={() => {
            setShowBusinessRegistrationModal(false);
            navigate('/dealers');
          }}
        />
      )}
    </motion.div>
  );
};

