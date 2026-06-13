import { useAuthStore } from '@store/authStore';
import { type ColorScheme,colorSchemes } from '@theme/colorSchemes';
import { useTheme } from '@theme/ThemeContext';
import { AnimatePresence,motion } from 'framer-motion';
import { Check,Monitor, Moon, Palette, Sun, User } from 'lucide-react';
import React, { useEffect,useRef, useState } from 'react';

export const ProfileDropdown: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, themeMode, colorScheme, setThemeMode, setColorScheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const themeOptions: Array<{ value: 'light' | 'dark' | 'auto'; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }> = [
    { value: 'auto', label: 'Auto', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  const colorOptions: ColorScheme[] = ['blue', 'purple', 'pink', 'green', 'orange'];

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="
          p-2.5
          rounded-xl
          bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700
          text-slate-700 dark:text-slate-300
          border border-slate-200/50 dark:border-slate-700/50
          cursor-pointer
          hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600
          transition-all duration-200
          flex items-center justify-center
          shadow-sm
        "
        aria-label="Profile settings"
      >
        <User size={18} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 z-[999] overflow-hidden"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: theme.spacing.lg,
                borderBottom: `1px solid ${theme.colors.border}`,
                background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: theme.colors.text,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {user?.name || 'Admin'}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
              </div>
            </div>

            {/* Theme Mode Section */}
            <div style={{ padding: theme.spacing.lg }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.md,
                }}
              >
                <Monitor size={18} style={{ color: theme.colors.primary }} />
                <h4
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: theme.colors.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Theme Mode
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = themeMode === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setThemeMode(option.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                        background: isSelected ? `${theme.colors.primary}10` : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: '100%',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = theme.colors.surface;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ color: isSelected ? theme.colors.primary : theme.colors.textSecondary }}>
                        <Icon size={18} />
                      </div>
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? '600' : '500',
                          color: isSelected ? theme.colors.primary : theme.colors.text,
                        }}
                      >
                        {option.label}
                      </span>
                      {isSelected && (
                        <div style={{ color: theme.colors.primary }}>
                          <Check size={18} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Scheme Section */}
            <div
              style={{
                padding: theme.spacing.lg,
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.md,
                }}
              >
                <Palette size={18} style={{ color: theme.colors.primary }} />
                <h4
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: theme.colors.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Color Scheme
                </h4>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: theme.spacing.sm,
                }}
              >
                {colorOptions.map((scheme) => {
                  const schemeConfig = colorSchemes[scheme];
                  const isSelected = colorScheme === scheme;
                  return (
                    <button
                      key={scheme}
                      onClick={() => setColorScheme(scheme)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: theme.borderRadius.md,
                        background: `linear-gradient(135deg, ${schemeConfig.primary}, ${schemeConfig.secondary})`,
                        border: `2px solid ${isSelected ? theme.colors.primary : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isSelected ? `0 0 0 2px ${theme.colors.surface}` : 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${schemeConfig.primary}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = isSelected ? `0 0 0 2px ${theme.colors.surface}` : 'none';
                      }}
                      title={schemeConfig.name}
                      aria-label={`Select ${schemeConfig.name} color scheme`}
                    >
                      {isSelected && (
                        <Check
                          size={16}
                          style={{
                            color: '#ffffff',
                            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p
                style={{
                  margin: 0,
                  marginTop: theme.spacing.sm,
                  fontSize: '0.75rem',
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                {colorSchemes[colorScheme].name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

