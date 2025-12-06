import i18n from '../config/i18n';

/**
 * Format date with locale
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'te' ? 'te-IN' : 'en-US';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

/**
 * Format number with locale
 */
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'te' ? 'te-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, options).format(value);
};

/**
 * Format currency with locale
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'te' ? 'te-IN' : 'en-IN';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

