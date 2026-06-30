export function resolveEntityId(item: { id?: string; _id?: string } | null | undefined): string {
  if (!item) return '';
  return item.id || item._id || '';
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const err = error as {
    response?: { data?: { Response?: { ReturnMessage?: unknown }; message?: unknown } };
    message?: unknown;
  };
  
  const candidate =
    err?.response?.data?.Response?.ReturnMessage ||
    err?.response?.data?.message ||
    err?.message;

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (candidate && typeof candidate === 'object') {
    const obj = candidate as { message?: unknown; error?: unknown; code?: unknown };
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.code === 'string') return obj.code;
  }

  return fallback;
}

export interface ApiEnvelope<T> {
  success: boolean;
  Response: T;
}

export function unwrapResponse<T>(data: ApiEnvelope<T> | null | undefined): T | null {
  if (!data?.success || !data.Response) return null;
  return data.Response;
}

export function isApiForbiddenError(error: unknown): boolean {
  const err = error as { response?: { status?: number } };
  return err?.response?.status === 403;
}
