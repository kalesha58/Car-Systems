import { Button } from '@components/Button/Button';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    // Log 404 for analytics if needed
    console.warn('404 - Page not found:', location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            fontSize: '8rem',
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: theme.spacing.lg,
            lineHeight: 1,
          }}
        >
          404
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.md,
            margin: 0,
          }}
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '1.125rem',
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.xl,
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          <br />
          <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Path: <code style={{ padding: '2px 6px', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.sm }}>{location.pathname}</code>
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            gap: theme.spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={() => navigate('/dashboard')}
            icon={Home}
            style={{
              minWidth: '150px',
            }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            icon={Search}
            style={{
              minWidth: '150px',
            }}
          >
            Go Back
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: theme.spacing.xl,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
            Quick Links:
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              justifyContent: 'center',
            }}
          >
            {[
              { path: '/dashboard', label: 'Dashboard' },
              { path: '/users', label: 'Users' },
              { path: '/dealers', label: 'Dealers' },
              { path: '/products', label: 'Products' },
              { path: '/orders', label: 'Orders' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

