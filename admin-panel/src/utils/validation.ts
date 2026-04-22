/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address
 * @param email - The email address to validate
 * @returns true if valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  if (!email || !email.trim()) {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates a phone number (must be exactly 10 digits)
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) {
    return false;
  }
  const phoneDigits = phone.replace(/\D/g, '');
  return phoneDigits.length === 10;
};

/**
 * Formats phone number input to only allow digits and limit to 10 digits
 * @param value - The input value
 * @returns Formatted phone number (digits only, max 10)
 */
export const formatPhoneInput = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.slice(0, 10);
};

/**
 * Gets email validation error message
 * @param email - The email to validate
 * @returns Error message if invalid, empty string if valid
 */
export const getEmailError = (email: string): string => {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  if (!validateEmail(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

/**
 * Gets phone validation error message
 * @param phone - The phone number to validate
 * @returns Error message if invalid, empty string if valid
 */
export const getPhoneError = (phone: string): string => {
  if (!phone || !phone.trim()) {
    return 'Phone number is required';
  }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return 'Phone number must be exactly 10 digits';
  }
  return '';
};




