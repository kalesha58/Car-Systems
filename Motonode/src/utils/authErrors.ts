export function extractAuthErrorMessage(error: unknown): string {
  const err = error as {
    response?: {
      data?: {
        Response?: { ReturnMessage?: unknown };
        message?: unknown;
        error?: unknown;
      };
    };
    message?: unknown;
  };

  const candidate =
    err?.response?.data?.Response?.ReturnMessage ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
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

  return 'Something went wrong. Please try again.';
}
