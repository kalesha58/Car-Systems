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
