import rateLimit from 'express-rate-limit';

/** Per-IP limit for OTP send/verify endpoints (abuse protection). */
export const otpIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    Response: { ReturnMessage: 'Too many requests from this IP. Please try again later.' },
  },
});

/**
 * Per-IP limit for endpoints that verify a credential or destroy account state,
 * so a stolen access token cannot be used to brute-force the current password.
 */
export const sensitiveAccountRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
    Response: { ReturnMessage: 'Too many attempts. Please try again later.' },
  },
});
