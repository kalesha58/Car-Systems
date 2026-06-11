/** Fallbacks when send-otp response omits fields — mirror server/.env.example defaults */
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const OTP_EXPIRY_SECONDS = 5 * 60;
export const OTP_LENGTH = 6;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
