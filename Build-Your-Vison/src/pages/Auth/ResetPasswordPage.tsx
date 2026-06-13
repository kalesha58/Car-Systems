import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { resetPassword as resetPasswordAPI } from '@services/authService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();

  // Get email from location state (from forgot password flow) or query params
  const emailFromState = (location.state as { email?: string })?.email;
  const emailFromParams = searchParams.get('email');
  const initialEmail = emailFromState || emailFromParams || '';

  const [formData, setFormData] = useState({
    email: initialEmail,
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    email?: string;
    code?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; code?: string; password?: string; confirmPassword?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Verification code is required';
    } else if (!/^\d{6}$/.test(formData.code.trim())) {
      newErrors.code = 'Code must be exactly 6 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await resetPasswordAPI({
        email: formData.email.trim(),
        code: formData.code.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      
      if (response.success) {
        showToast(response.message || 'Password reset successfully!', 'success');
        // Redirect to login with email pre-filled
        setTimeout(() => {
          navigate('/login', { state: { email: formData.email.trim() } });
        }, 1500);
      } else {
        showToast(response.message || 'Failed to reset password', 'error');
      }
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message || 'Failed to reset password. Please try again.';
      showToast(errorMessage, 'error');
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('code') || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired')) {
        setErrors({ ...errors, code: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ ...errors, password: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  // No need to check for token - email and code will be entered by user

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.xl,
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.shadows.lg,
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: theme.spacing.xl,
            color: theme.colors.primary,
            fontSize: '2rem',
            fontWeight: 'bold',
          }}
        >
          Reset Password
        </h1>

        <p
          style={{
            marginBottom: theme.spacing.lg,
            color: theme.colors.textSecondary,
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          Enter your email, verification code from your email, and new password to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => {
              setFormData({ ...formData, email: value });
              setErrors({ ...errors, email: undefined });
            }}
            placeholder="Enter your email"
            error={errors.email}
            required
            disabled={loading}
            autoFocus={!initialEmail}
          />

          <Input
            label="Verification Code"
            type="text"
            value={formData.code}
            onChange={(value) => {
              // Only allow digits and limit to 6 digits
              const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
              setFormData({ ...formData, code: digitsOnly });
              setErrors({ ...errors, code: undefined });
            }}
            placeholder="Enter 6-digit code from email"
            error={errors.code}
            required
            disabled={loading}
            autoFocus={!!initialEmail}
          />

          <Input
            label="New Password"
            type="password"
            value={formData.password}
            onChange={(value) => {
              setFormData({ ...formData, password: value });
              setErrors({ ...errors, password: undefined });
            }}
            placeholder="Enter new password (min 8 characters)"
            error={errors.password}
            required
            disabled={loading}
          />

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => {
              setFormData({ ...formData, confirmPassword: value });
              setErrors({ ...errors, confirmPassword: undefined });
            }}
            placeholder="Confirm new password"
            error={errors.confirmPassword}
            required
            disabled={loading}
          />

          <Button type="submit" fullWidth loading={loading}>
            Reset Password
          </Button>

          <div
            style={{
              textAlign: 'center',
              marginTop: theme.spacing.md,
            }}
          >
            <Link
              to="/login"
              style={{
                color: theme.colors.primary,
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

