import { BASE_URL } from './config';
import { tokenStorage } from '@state/storage';
import { refresh_tokens } from './authService';

export type IMultipartUploadError = Error & {
  response?: { status: number; data: unknown };
  code?: string;
};

const buildUploadUrl = (path: string): string => {
  const base = BASE_URL.replace(/\/$/, '');
  const route = path.startsWith('/') ? path : `/${path}`;
  return `${base}${route}`;
};

const parseUploadResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`Upload failed (${response.status}): invalid server response`), {
      response: { status: response.status, data: { message: text.slice(0, 200) } },
    }) as IMultipartUploadError;
  }
};

/**
 * POST multipart/form-data via fetch (reliable on React Native Android; axios often ERR_NETWORK).
 * Pass a factory so FormData can be rebuilt on 401 retry.
 */
export const postMultipart = async <T = unknown>(
  path: string,
  buildFormData: () => FormData,
  options?: { timeoutMs?: number },
): Promise<T> => {
  const timeoutMs = options?.timeoutMs ?? 60000;
  const url = buildUploadUrl(path);

  const send = async (accessToken?: string): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
    const token = accessToken ?? tokenStorage.getString('accessToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        method: 'POST',
        headers,
        body: buildFormData(),
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutErr = new Error('Upload timeout. Please check your connection and try again.') as IMultipartUploadError;
        timeoutErr.code = 'ECONNABORTED';
        throw timeoutErr;
      }
      const networkErr = new Error(
        error instanceof Error ? error.message : 'Network error during upload',
      ) as IMultipartUploadError;
      networkErr.code = 'ERR_NETWORK';
      throw networkErr;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let response = await send();

  if (response.status === 401 && tokenStorage.getString('refreshToken')) {
    try {
      const newToken = await refresh_tokens();
      if (newToken) {
        response = await send(newToken);
      }
    } catch {
      // refresh_tokens handles logout; propagate below
    }
  }

  const data = await parseUploadResponse(response);

  if (!response.ok) {
    const payload = data as {
      Response?: { ReturnMessage?: string };
      message?: string;
      error?: string;
    };
    const err = new Error(
      payload?.Response?.ReturnMessage ??
        payload?.message ??
        payload?.error ??
        `Upload failed (${response.status})`,
    ) as IMultipartUploadError;
    err.response = { status: response.status, data };
    throw err;
  }

  return data as T;
};
