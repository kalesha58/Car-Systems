import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errorHandler';

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (exactly 10 digits)
 */
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
};

/**
 * Validate signup request
 */
export const validateSignup = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new ValidationError('Name is required'));
    }

    if (name.trim().length < 2) {
      return next(new ValidationError('Name must be at least 2 characters'));
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return next(new ValidationError('Email is required'));
    }

    if (!isValidEmail(email)) {
      return next(new ValidationError('Invalid email format'));
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return next(new ValidationError('Phone number is required'));
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!isValidPhone(cleanPhone)) {
      return next(new ValidationError('Phone number must be exactly 10 digits'));
    }

    if (!password || typeof password !== 'string') {
      return next(new ValidationError('Password is required'));
    }

    if (password.length < 8) {
      return next(new ValidationError('Password must be at least 6 characters'));
    }

    // Normalize phone number
    req.body.phone = cleanPhone;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate login request
 */
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return next(new ValidationError(' email is required'));
    }


    if (email && !isValidEmail(email)) {
      return next(new ValidationError('Invalid email format'));
    }

    if (!password || typeof password !== 'string') {
      return next(new ValidationError('Password is required'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate number plate format (basic validation)
 */
const isValidNumberPlate = (numberPlate: string): boolean => {
  // Basic validation - alphanumeric, 6-15 characters
  const plateRegex = /^[A-Z0-9]{6,15}$/i;
  return plateRegex.test(numberPlate.trim());
};

/**
 * Validate create vehicle request
 */
export const validateCreateVehicle = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { brand, model, numberPlate, images } = req.body;

    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      return next(new ValidationError('Brand is required'));
    }

    if (!model || typeof model !== 'string' || !model.trim()) {
      return next(new ValidationError('Model is required'));
    }

    if (!numberPlate || typeof numberPlate !== 'string' || !numberPlate.trim()) {
      return next(new ValidationError('Number plate is required'));
    }

    if (!isValidNumberPlate(numberPlate)) {
      return next(new ValidationError('Invalid number plate format'));
    }

    // Validate images
    if (!images || !Array.isArray(images)) {
      return next(new ValidationError('Images are required and must be an array'));
    }

    if (images.length < 1 || images.length > 3) {
      return next(new ValidationError('Vehicle must have between 1 and 3 images'));
    }

    // Validate each image URL is a string
    for (const image of images) {
      if (typeof image !== 'string' || !image.trim()) {
        return next(new ValidationError('Each image must be a valid URL string'));
      }
    }

    // Normalize number plate to uppercase
    req.body.numberPlate = numberPlate.trim().toUpperCase();

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate update vehicle request
 */
export const validateUpdateVehicle = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { numberPlate, images } = req.body;

    if (numberPlate !== undefined) {
      if (typeof numberPlate !== 'string' || !numberPlate.trim()) {
        return next(new ValidationError('Number plate must be a valid string'));
      }

      if (!isValidNumberPlate(numberPlate)) {
        return next(new ValidationError('Invalid number plate format'));
      }

      // Normalize number plate to uppercase
      req.body.numberPlate = numberPlate.trim().toUpperCase();
    }

    // Validate images if provided
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return next(new ValidationError('Images must be an array'));
      }

      if (images.length < 1 || images.length > 3) {
        return next(new ValidationError('Vehicle must have between 1 and 3 images'));
      }

      // Validate each image URL is a string
      for (const image of images) {
        if (typeof image !== 'string' || !image.trim()) {
          return next(new ValidationError('Each image must be a valid URL string'));
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate create post request
 */
export const validateCreatePost = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { text, images } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return next(new ValidationError('Post text is required'));
    }

    if (text.trim().length > 5000) {
      return next(new ValidationError('Post text must be less than 5000 characters'));
    }

    // Validate images - now required
    if (!images || !Array.isArray(images)) {
      return next(new ValidationError('Images are required and must be an array'));
    }

    if (images.length === 0) {
      return next(new ValidationError('At least one image is required to create a post'));
    }

    // Validate each image URL is a string
    for (const image of images) {
      if (typeof image !== 'string' || !image.trim()) {
        return next(new ValidationError('Each image must be a valid URL string'));
      }
    }

    if (req.body.location) {
      const { latitude, longitude } = req.body.location;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return next(new ValidationError('Invalid location coordinates'));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate forgot password request
 */
export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return next(new ValidationError('Email is required'));
    }

    if (!isValidEmail(email)) {
      return next(new ValidationError('Invalid email format'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate reset password request
 */
export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { email, code, password, confirmPassword } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return next(new ValidationError('Email is required'));
    }

    if (!isValidEmail(email)) {
      return next(new ValidationError('Invalid email format'));
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      return next(new ValidationError('Reset code is required'));
    }

    // Validate code is 6 digits
    if (!/^\d{6}$/.test(code.trim())) {
      return next(new ValidationError('Reset code must be 6 digits'));
    }

    if (!password || typeof password !== 'string') {
      return next(new ValidationError('Password is required'));
    }

    if (password.length < 8) {
      return next(new ValidationError('Password must be at least 8 characters long'));
    }

    if (!confirmPassword || typeof confirmPassword !== 'string') {
      return next(new ValidationError('Confirm password is required'));
    }

    if (password !== confirmPassword) {
      return next(new ValidationError('Passwords do not match'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate Google authentication request
 */
export const validateGoogleAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { idToken, phone, isRegistration } = req.body;

    if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
      return next(new ValidationError('Google ID token is required'));
    }

    if (isRegistration === undefined || typeof isRegistration !== 'boolean') {
      return next(new ValidationError('isRegistration flag is required'));
    }

    if (isRegistration) {
      if (!phone || typeof phone !== 'string' || !phone.trim()) {
        return next(new ValidationError('Phone number is required for registration'));
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (!isValidPhone(cleanPhone)) {
        return next(new ValidationError('Phone number must be exactly 10 digits'));
      }

      // Normalize phone number
      req.body.phone = cleanPhone;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate time format (HH:mm)
 */
const isValidTime = (time: string): boolean => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate create test drive request
 */
export const validateCreateTestDrive = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { vehicleId, preferredDate, preferredTime } = req.body;

    if (!vehicleId || typeof vehicleId !== 'string' || !vehicleId.trim()) {
      return next(new ValidationError('Vehicle ID is required'));
    }

    if (!preferredDate) {
      return next(new ValidationError('Preferred date is required'));
    }    const date = new Date(preferredDate);
    if (isNaN(date.getTime())) {
      return next(new ValidationError('Invalid date format'));
    }

    // Check if date is in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < now) {
      return next(new ValidationError('Preferred date must be in the future'));
    }

    if (!preferredTime || typeof preferredTime !== 'string') {
      return next(new ValidationError('Preferred time is required'));
    }

    if (!isValidTime(preferredTime)) {
      return next(new ValidationError('Time must be in HH:mm format (e.g., 14:30)'));
    }

    // Normalize time format
    req.body.preferredTime = preferredTime.trim();

    next();
  } catch (error) {
    next(error);
  }
};/**
 * Validate create pre-booking request
 */
export const validateCreatePreBooking = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { vehicleId, bookingDate } = req.body;

    if (!vehicleId || typeof vehicleId !== 'string' || !vehicleId.trim()) {
      return next(new ValidationError('Vehicle ID is required'));
    }    if (!bookingDate) {
      return next(new ValidationError('Booking date is required'));
    }    const date = new Date(bookingDate);
    if (isNaN(date.getTime())) {
      return next(new ValidationError('Invalid date format'));
    }

    // Check if date is in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < now) {
      return next(new ValidationError('Booking date must be in the future'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate update test drive status request
 */
export const validateUpdateTestDriveStatus = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      return next(new ValidationError('Status is required'));
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate update pre-booking status request
 */
export const validateUpdatePreBookingStatus = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      return next(new ValidationError('Status is required'));
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`));
    }

    next();
  } catch (error) {
    next(error);
  }
};