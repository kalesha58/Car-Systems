/**
 * HTTPS URL for the Motonode logo in login greeting push notifications.
 * Run once: npm run upload:greeting-logo — then set GREETING_NOTIFICATION_IMAGE_URL on Vercel.
 */
export const DEFAULT_GREETING_IMAGE_URL =
  process.env.GREETING_NOTIFICATION_IMAGE_URL ||
  'https://res.cloudinary.com/dzguxkrky/image/upload/v1779389686/motonode/notifications/rcggfm3pp5gpcvgzn9n0.jpg';
