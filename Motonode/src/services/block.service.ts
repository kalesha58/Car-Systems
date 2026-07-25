import { api } from './api';

export interface BlockedUser {
  id: string;
  name: string;
  avatar?: string;
  isDealer: boolean;
  blockedAt: string;
}

/**
 * The list endpoint returns detailed objects, but older deployments returned
 * plain ID strings, so both shapes are accepted here.
 */
type BlockedUsersPayload = Array<BlockedUser | string> | undefined;

function normalizeBlockedUser(entry: BlockedUser | string): BlockedUser {
  if (typeof entry === 'string') {
    return { id: entry, name: 'Unknown user', isDealer: false, blockedAt: '' };
  }
  return entry;
}

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const response = await api.get<{ success: boolean; Response: BlockedUsersPayload }>(
    '/user/blocks',
  );
  return (response.data?.Response ?? []).map(normalizeBlockedUser);
}

export async function blockUser(targetUserId: string): Promise<void> {
  await api.post(`/user/blocks/${targetUserId}`);
}

export async function unblockUser(targetUserId: string): Promise<void> {
  await api.delete(`/user/blocks/${targetUserId}`);
}
