import { Resend } from 'resend';
import { logger } from './logger';

let resendClient: Resend | null = null;

const getResendClient = (): Resend => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

const getFromAddress = (): string => process.env.RESEND_FROM || 'Motonode <onboarding@resend.dev>';

const sendViaResend = async (to: string, subject: string, html: string, text: string): Promise<void> => {
  const { error } = await getResendClient().emails.send({ from: getFromAddress(), to, subject, html, text });

  if (error) {
    logger.error(`Resend failed to send "${subject}" to ${to}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const codeEmailHtml = (heading: string, intro: string, code: string, footer: string): string => `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
      <h2 style="margin: 0 0 16px;">${heading}</h2>
      <p>${intro}</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${code}</p>
      <p style="color: #6B7280;">${footer}</p>
    </div>
  `;

/**
 * Send the signup email-verification OTP via Resend
 */
export const sendEmailVerificationOtp = async (
  email: string,
  name: string,
  otp: string,
  expiresInMinutes: number,
): Promise<void> => {
  await sendViaResend(
    email,
    `${otp} is your Motonode verification code`,
    codeEmailHtml(
      'Verify your email',
      `Hi ${escapeHtml(name || 'there')}, use the code below to verify your email and finish creating your Motonode account.`,
      otp,
      `This code expires in ${expiresInMinutes} minutes. If you didn't sign up, you can ignore this email.`,
    ),
    `Your Motonode verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
  );

  logger.info(`Verification OTP email sent to ${email}`);
};

/**
 * Send the forgot-password reset code via Resend
 */
export const sendPasswordResetCodeEmail = async (email: string, resetCode: string): Promise<void> => {
  await sendViaResend(
    email,
    `${resetCode} is your Motonode password reset code`,
    codeEmailHtml(
      'Reset your password',
      'Use the code below in the Motonode app to set a new password.',
      resetCode,
      "This code expires in 10 minutes. If you didn't request a reset, you can ignore this email and your password will stay the same.",
    ),
    `Your Motonode password reset code is ${resetCode}. It expires in 10 minutes.`,
  );
};

/**
 * Confirm a completed password reset via Resend
 */
export const sendPasswordResetSuccessEmail = async (email: string): Promise<void> => {
  await sendViaResend(
    email,
    'Your Motonode password was changed',
    `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
      <h2 style="margin: 0 0 16px;">Password changed</h2>
      <p>Your Motonode password was just reset. If this wasn't you, contact support immediately.</p>
    </div>
  `,
    'Your Motonode password was just reset. If this was not you, contact support immediately.',
  );
};
