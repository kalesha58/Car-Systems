import { api } from './api';

export class ChatGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatGateError';
  }
}

export async function checkBlockBeforeSend(targetUserId: string): Promise<void> {
  try {
    await api.get(`/user/blocks/check/${targetUserId}`);
  } catch (error: any) {
    const message =
      error?.response?.data?.message || 'You cannot message this user';
    if (error?.response?.status === 403) {
      throw new ChatGateError(message);
    }
    throw error;
  }
}

export interface DealerChatVerification {
  userId: string;
  businessName: string;
  status: string;
}

export async function verifyDealerForChat(dealerId: string): Promise<DealerChatVerification> {
  try {
    const response = await api.get<{
      success: boolean;
      Response: DealerChatVerification;
    }>(`/user/dealer/${dealerId}/verify`);

    return response.data.Response;
  } catch (error: any) {
    const message =
      error?.response?.data?.Response?.ReturnMessage ||
      error?.response?.data?.message ||
      'This dealer cannot be contacted right now';
    throw new ChatGateError(message);
  }
}

export async function fetchBlockedUserIds(): Promise<string[]> {
  const response = await api.get<{
    success: boolean;
    // Newer backends return detailed objects; older ones returned plain IDs.
    Response: Array<string | { id: string }>;
  }>('/user/blocks');

  return (response.data.Response || [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.id))
    .filter((id): id is string => Boolean(id));
}
