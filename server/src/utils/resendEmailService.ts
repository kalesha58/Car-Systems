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

/**
 * Send the signup email-verification OTP via Resend
 */
export const sendEmailVerificationOtp = async (
  email: string,
  name: string,
  otp: string,
  expiresInMinutes: number,
): Promise<void> => {
  const from = process.env.RESEND_FROM || 'Motonode <onboarding@resend.dev>';
  const subject = `${otp} is your Motonode verification code`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
      <h2 style="margin: 0 0 16px;">Verify your email</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Use the code below to verify your email and finish creating your Motonode account.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${otp}</p>
      <p style="color: #6B7280;">This code expires in ${expiresInMinutes} minutes. If you didn't sign up, you can ignore this email.</p>
    </div>
  `;
  const text = `Your Motonode verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`;

  const { error } = await getResendClient().emails.send({ from, to: email, subject, html, text });

  if (error) {
    logger.error(`Resend failed to send verification OTP to ${email}:`, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  logger.info(`Verification OTP email sent to ${email}`);
};
