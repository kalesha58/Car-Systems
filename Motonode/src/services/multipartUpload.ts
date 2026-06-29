import { API_BASE_URL } from '@config/env';
import { getString } from '@storage/index';
import { StorageKeys } from '@storage/keys';

import { refreshAccessToken } from './api';

export type MultipartUploadError = Error & {
  response?: { status: number; data: unknown };
  code?: string;
};

function buildUploadUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const route = path.startsWith('/') ? path : `/${path}`;
  return `${base}${route}`;
}

async function parseUploadResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`Upload failed (${response.status}): invalid server response`), {
      response: { status: response.status, data: { message: text.slice(0, 200) } },
    }) as MultipartUploadError;
  }
}

/** POST multipart/form-data via fetch (reliable on React Native Android). */
export async function postMultipart<T = unknown>(
  path: string,
  buildFormData: () => FormData,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 60000;
  const url = buildUploadUrl(path);

  const send = async (accessToken?: string): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = accessToken ?? (await getString(StorageKeys.ACCESS_TOKEN));
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
        const timeoutErr = new Error(
          'Upload timeout. Please check your connection and try again.',
        ) as MultipartUploadError;
        timeoutErr.code = 'ECONNABORTED';
        throw timeoutErr;
      }
      const networkErr = new Error(
        error instanceof Error ? error.message : 'Network error during upload',
      ) as MultipartUploadError;
      networkErr.code = 'ERR_NETWORK';
      throw networkErr;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let response = await send();

  if (response.status === 401 && (await getString(StorageKeys.REFRESH_TOKEN))) {
    try {
      const newToken = await refreshAccessToken();
      response = await send(newToken);
    } catch {
      // propagate below
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
    ) as MultipartUploadError;
    err.response = { status: response.status, data };
    throw err;
  }

  return data as T;
}
