import axios, { AxiosError } from 'axios';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const MSG91_SEND_URL = 'https://control.msg91.com/api/v5/otp';
const MSG91_VERIFY_URL = 'https://control.msg91.com/api/v5/otp/verify';

const getMsg91ApiKey = (): string => {
  const key = process.env.MSG91_API_KEY?.trim();
  if (!key) {
    throw new AppError('MSG91 is not configured on the server', 503);
  }
  return key;
};

const getTemplateId = (): string => {
  const templateId = process.env.MSG91_TEMPLATE_ID?.trim();
  if (!templateId) {
    throw new AppError('MSG91 template is not configured on the server', 503);
  }
  return templateId;
};

const getOtpLength = (): number => {
  const length = parseInt(process.env.MSG91_OTP_LENGTH || '6', 10);
  return Number.isFinite(length) && length >= 4 && length <= 8 ? length : 6;
};

const getOtpExpiryMinutes = (): number => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
};

export interface IMsg91SendResult {
  requestId: string;
  message?: string;
}

/**
 * Send OTP via MSG91 v5 API. Mobile must include country code (e.g. 919876543210).
 */
export const sendOtpViaMsg91 = async (mobileWithCountryCode: string): Promise<IMsg91SendResult> => {
  try {
    const response = await axios.post(
      MSG91_SEND_URL,
      {
        template_id: getTemplateId(),
        mobile: mobileWithCountryCode,
        otp_length: getOtpLength(),
        otp_expiry: getOtpExpiryMinutes(),
      },
      {
        headers: {
          authkey: getMsg91ApiKey(),
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    const data = response.data as Record<string, unknown>;
    const requestId =
      (data.request_id as string) ||
      (data.requestId as string) ||
      (typeof data.message === 'string' ? data.message : '');

    if (!requestId) {
      logger.error('MSG91 send OTP: missing request_id', { data });
      throw new AppError('Failed to send OTP. Please try again.', 502);
    }

    if (data.type === 'error') {
      const errMsg = (data.message as string) || 'Failed to send OTP';
      throw new AppError(errMsg, 400);
    }

    return {
      requestId: String(requestId),
      message: data.message as string | undefined,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const axiosErr = error as AxiosError<{ message?: string }>;
    const msg =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      'Failed to send OTP';
    logger.error('MSG91 send OTP error', { status: axiosErr.response?.status, msg });
    throw new AppError(msg, axiosErr.response?.status === 429 ? 429 : 502);
  }
};

/**
 * Verify OTP via MSG91 v5 API.
 */
export const verifyOtpViaMsg91 = async (
  mobileWithCountryCode: string,
  otp: string,
): Promise<void> => {
  try {
    const response = await axios.post(
      MSG91_VERIFY_URL,
      {
        mobile: mobileWithCountryCode,
        otp: otp.trim(),
      },
      {
        headers: {
          authkey: getMsg91ApiKey(),
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    const data = response.data as Record<string, unknown>;
    if (data.type === 'error') {
      throw new AppError((data.message as string) || 'Invalid OTP', 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const axiosErr = error as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    if (status === 400 || status === 401 || status === 404) {
      throw new AppError('Invalid or expired OTP', 401);
    }
    logger.error('MSG91 verify OTP error', { status, message: axiosErr.message });
    throw new AppError('OTP verification failed. Please try again.', 502);
  }
};
