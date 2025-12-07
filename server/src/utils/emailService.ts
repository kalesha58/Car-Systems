import nodemailer from 'nodemailer';
import { logger } from './logger';

/**
 * Create reusable transporter object using SMTP transport
 */
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpSecure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

  if (!smtpUser || !smtpPass) {
    logger.warn('SMTP credentials not configured. Email sending will fail.');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

/**
 * Send email using nodemailer
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<void> => {
  try {
    const transporter = createTransporter();
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'swarooptheja809@gmail.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Car Connect';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send password reset code (OTP) email
 */
export const sendPasswordResetCodeEmail = async (email: string, resetCode: string): Promise<void> => {
  const subject = 'Password Reset Code - Car Connect';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Password Reset Code</h2>
        <p>Hello,</p>
        <p>You have requested to reset your password for your Car Connect account.</p>
        <p>Use the following code to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #3498db; color: white; padding: 20px; border-radius: 10px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${resetCode}
          </div>
        </div>
        <p><strong>This code will expire in 10 minutes.</strong></p>
        <p>Enter this code along with your new password in the app to complete the password reset.</p>
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
          This is an automated message, please do not reply to this email.
        </p>
        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Car Connect. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

/**
 * Send password reset success email
 */
export const sendPasswordResetSuccessEmail = async (email: string): Promise<void> => {
  const subject = 'Password Reset Successful - Car Connect';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #27ae60; margin-top: 0;">Password Reset Successful</h2>
        <p>Hello,</p>
        <p>Your password has been successfully reset for your Car Connect account.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
          This is an automated message, please do not reply to this email.
        </p>
        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Car Connect. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

/**
 * Send group join request email to group owner
 */
export const sendGroupJoinRequestEmail = async (
  ownerEmail: string,
  requesterName: string,
  requesterEmail: string,
  groupName: string,
): Promise<void> => {
  const subject = `New Join Request for Group: ${groupName} - Car Connect`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Group Join Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">New Group Join Request</h2>
        <p>Hello,</p>
        <p>You have received a new join request for your group <strong>"${groupName}"</strong>.</p>
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
          <p style="margin: 0;"><strong>Requester Name:</strong> ${requesterName}</p>
          <p style="margin: 5px 0;"><strong>Requester Email:</strong> ${requesterEmail}</p>
          <p style="margin: 5px 0;"><strong>Group:</strong> ${groupName}</p>
        </div>
        <p>Please open the Car Connect app to review and respond to this join request.</p>
        <p>You can accept or reject the request from the group chat screen.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
          This is an automated message, please do not reply to this email.
        </p>
        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Car Connect. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(ownerEmail, subject, html);
};
