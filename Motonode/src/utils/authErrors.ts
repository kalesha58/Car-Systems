export function extractAuthErrorMessage(error: unknown): string {
  const err = error as {
    response?: {
      data?: {
        Response?: { ReturnMessage?: string };
        message?: string;
        error?: string;
      };
    };
    message?: string;
  };

  return (
    err?.response?.data?.Response?.ReturnMessage ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}
