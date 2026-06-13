import axios, { AxiosError } from 'axios';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const MSG91_SEND_URL = 'https://control.msg91.com/api/v5/otp';
const MSG91_VERIFY_URL = 'https://control.msg91.com/api/v5/otp/verify';

type Msg91ErrorBody = {
  message?: string;
  type?: string;
  code?: number | string;
};



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

export const parseMsg91ErrorCode = (body: unknown): number | undefined => {
  if (!body || typeof body !== 'object') {
    return undefined;
  }
  const code = (body as Msg91ErrorBody).code;
  if (typeof code === 'number') {
    return code;
  }
  if (typeof code === 'string' && /^\d+$/.test(code)) {
    return parseInt(code, 10);
  }
  return undefined;
};

export const mapMsg91ErrorToAppError = (
  body: unknown,
  fallbackMessage: string,
): AppError => {
  const data = (body && typeof body === 'object' ? body : {}) as Msg91ErrorBody;
  const code = parseMsg91ErrorCode(data);
  const message = data.message || fallbackMessage;

  if (code === 418) {
    return new AppError(
      'MSG91 rejected request: IP not whitelisted. Use a Vercel auth key without IP security.',
      502,
    );
  }

  if (code === 207) {
    return new AppError('MSG91 authentication failed. Check MSG91_API_KEY.', 502);
  }

  if (code === 301) {
    return new AppError('MSG91 account has insufficient SMS balance.', 502);
  }

  return new AppError(message, 502);
};

const throwIfMsg91PayloadError = (data: Record<string, unknown>, action: string): void => {
  if (data.type !== 'error') {
    return;
  }

  const code = parseMsg91ErrorCode(data);
  logger.error(`MSG91 ${action} returned error payload`, { code, data });
  throw mapMsg91ErrorToAppError(data, `Failed to ${action}`);
};

const handleMsg91AxiosError = (error: unknown, action: string): never => {
  const axiosErr = error as AxiosError<Msg91ErrorBody>;
  const responseData = axiosErr.response?.data;
  const code = parseMsg91ErrorCode(responseData);
  const msg = responseData?.message || axiosErr.message || `Failed to ${action}`;

  logger.error(`MSG91 ${action} error`, {
    status: axiosErr.response?.status,
    code,
    message: msg,
    data: responseData,
  });

  if (code !== undefined) {
    throw mapMsg91ErrorToAppError(responseData, msg);
  }

  throw new AppError(msg, axiosErr.response?.status === 429 ? 429 : 502);
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
    throwIfMsg91PayloadError(data, 'send OTP');

    if (data.type && data.type !== 'success') {
      logger.error('MSG91 send OTP: unexpected response type', { data });
      throw mapMsg91ErrorToAppError(data, 'Failed to send OTP');
    }

    // v5 uses request_id; legacy SendOTP puts the id in message (hex string).
    const requestId =
      (data.request_id as string) ||
      (data.requestId as string) ||
      (data.type === 'success' && typeof data.message === 'string' ? data.message : '');

    if (!requestId) {
      logger.error('MSG91 send OTP: missing request_id', { data });
      throw new AppError('Failed to send OTP. Please try again.', 502);
    }

    logger.info('MSG91 send OTP accepted', {
      requestId,
      mobileSuffix: mobileWithCountryCode.slice(-4),
      type: data.type,
    });

    return {
      requestId: String(requestId),
      message: data.message as string | undefined,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    return handleMsg91AxiosError(error, 'send OTP');
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
    throwIfMsg91PayloadError(data, 'verify OTP');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const axiosErr = error as AxiosError<Msg91ErrorBody>;
    const status = axiosErr.response?.status;
    if (status === 400 || status === 401 || status === 404) {
      throw new AppError('Invalid or expired OTP', 401);
    }
    handleMsg91AxiosError(error, 'verify OTP');
  }
};
