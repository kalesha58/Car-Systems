import { useTheme } from '@theme/ThemeContext';
import { AnimatePresence,motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useEffect,useRef, useState } from 'react';

export interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ISelectProps {
  options: ISelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Select: React.FC<ISelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  required = false,
  disabled = false,
  searchable = false,
  className = '',
  style,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    if (options.find((opt) => opt.value === optionValue)?.disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={selectRef}
      className={`relative ${className}`}
      style={{ marginBottom: label || error ? theme.spacing.md : 0, ...style }}
    >
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.xs,
            color: theme.colors.text,
            fontWeight: '500',
            fontSize: '0.875rem',
          }}
        >
          {label}
          {required && <span style={{ color: theme.colors.error, marginLeft: '4px' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <motion.button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.01 } : {}}
          whileTap={!disabled ? { scale: 0.99 } : {}}
          style={{
            width: '100%',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            paddingRight: theme.spacing.xl,
            border: `1.5px solid ${error ? theme.colors.error : isOpen ? theme.colors.primary : theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            backgroundColor: disabled ? `${theme.colors.surface}80` : theme.colors.surface,
            color: selectedOption ? theme.colors.text : theme.colors.textSecondary,
            fontSize: '1rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '44px',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isOpen
              ? `0 0 0 3px ${theme.colors.primary}20`
              : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isOpen) {
              e.currentTarget.style.borderColor = theme.colors.primary;
              e.currentTarget.style.boxShadow = `0 2px 4px 0 ${theme.colors.primary}15`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = error ? theme.colors.error : theme.colors.border;
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
            }
          }}
        >
          <span
            style={{
              flex: 1,
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              right: theme.spacing.md,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <ChevronDown size={20} style={{ color: theme.colors.textSecondary }} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="select-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: 'max-content',
                minWidth: '220px',
                marginTop: theme.spacing.xs,
                backgroundColor: '#ffffff',
                border: `2px solid ${isOpen ? theme.colors.primary : '#e2e8f0'}`,
                borderRadius: theme.borderRadius.md,
                zIndex: 9999,
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                maxHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {searchable && (
                <div
                  style={{
                    padding: theme.spacing.sm,
                    borderBottom: `1px solid ${theme.colors.border}`,
                    position: 'sticky',
                    top: 0,
                    backgroundColor: theme.colors.surface,
                    zIndex: 1,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={18}
                      style={{
                        position: 'absolute',
                        left: theme.spacing.sm,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: theme.colors.textSecondary,
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: `${theme.spacing.xs} ${theme.spacing.sm} ${theme.spacing.xs} ${theme.spacing.xl}`,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.border;
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  maxHeight: searchable ? '240px' : '280px',
                  overflowY: 'auto',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: '#ffffff',
                  minWidth: '220px',
                }}
                className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
              >
                {filteredOptions.length === 0 ? (
                  <div
                    style={{
                      padding: theme.spacing.md,
                      textAlign: 'center',
                      color: theme.colors.textSecondary,
                      fontSize: '0.875rem',
                    }}
                  >
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = option.value === value;
                    const isDisabled = option.disabled;

                    return (
                      <motion.div
                        key={option.value}
                        onClick={() => !isDisabled && handleSelect(option.value)}
                        className={`select-option ${isSelected ? 'select-option--selected' : ''} ${isDisabled ? 'select-option--disabled' : ''}`}
                        whileHover={!isDisabled ? { backgroundColor: `${theme.colors.primary}10` } : {}}
                        style={{
                          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                          borderRadius: theme.borderRadius.sm,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: typeof theme.spacing.xs === 'number' ? theme.spacing.xs / 2 : 0,
                          backgroundColor: isSelected
                            ? '#eff6ff'
                            : 'transparent',
                          color: isDisabled
                            ? '#94a3b8'
                            : isSelected
                            ? '#1e40af'
                            : '#1e293b',
                          fontWeight: isSelected ? '600' : '500',
                          fontSize: '0.95rem',
                          opacity: isDisabled ? 0.5 : 1,
                          transition: 'all 0.15s ease',
                          border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                          minWidth: '200px',
                        }}
                        onMouseEnter={(e) => {
                          if (!isDisabled) {
                            e.currentTarget.style.backgroundColor = isSelected
                              ? '#dbeafe'
                              : '#f1f5f9';
                            e.currentTarget.style.borderColor = isSelected
                              ? '#93c5fd'
                              : '#e2e8f0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isSelected
                            ? '#eff6ff'
                            : 'transparent';
                          e.currentTarget.style.borderColor = isSelected
                            ? '#bfdbfe'
                            : 'transparent';
                        }}
                      >
                        <span style={{ flex: 1, textAlign: 'left' }}>{option.label}</span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <Check size={18} style={{ color: '#1e40af', fontWeight: 'bold' }} />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: theme.spacing.xs,
            color: theme.colors.error,
            fontSize: '0.75rem',
            fontWeight: '500',
          }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

