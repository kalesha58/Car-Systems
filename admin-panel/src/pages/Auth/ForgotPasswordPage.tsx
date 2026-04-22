import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export const ForgotPasswordPage = () => {
  const { theme, themeMode } = useTheme();
  const { showToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      showToast('Password reset link sent to your email', 'success');
    }, 1000);
  };

  const glassmorphismStyle: React.CSSProperties = {
    background: themeMode === 'dark'
      ? 'rgba(30, 41, 59, 0.7)'
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: themeMode === 'dark'
      ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      : '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: themeMode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: theme.spacing.md,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: '400px',
            ...glassmorphismStyle,
            padding: theme.spacing.xl,
            borderRadius: '24px',
            textAlign: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              fontSize: '4rem',
              marginBottom: theme.spacing.md,
            }}
          >
            ✓
          </motion.div>
          <h2
            style={{
              marginBottom: theme.spacing.md,
              color: theme.colors.text,
              fontSize: '1.5rem',
              fontWeight: '700',
            }}
          >
            Check Your Email
          </h2>
          <p
            style={{
              marginBottom: theme.spacing.xl,
              color: theme.colors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            We've sent a password reset link to {email}
          </p>
          <Link to="/login">
            <Button fullWidth>Back to Login</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: themeMode === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: theme.spacing.md,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <motion.div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          filter: 'blur(80px)',
          top: '-200px',
          left: '-200px',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '440px',
          ...glassmorphismStyle,
          padding: theme.spacing.xl,
          borderRadius: '24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1
            style={{
              textAlign: 'center',
              marginBottom: theme.spacing.md,
              color: theme.colors.text,
              fontSize: '2rem',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Forgot Password
          </h1>

          <p
            style={{
              textAlign: 'center',
              marginBottom: theme.spacing.xl,
              color: theme.colors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setError('');
              }}
              placeholder="Enter your email"
              error={error}
              required
              disabled={loading}
            />

            <Button type="submit" fullWidth loading={loading}>
              Send Reset Link
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
                  fontWeight: '500',
                }}
              >
                Back to Login
              </Link>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};
