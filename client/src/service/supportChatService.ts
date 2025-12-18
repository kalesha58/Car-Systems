import { appAxios } from './apiInterceptors';

export interface ISupportChatMessage {
  id: string;
  role: 'user' | 'bot' | 'assistant';
  message: string;
  createdAt: string;
}

export interface IQuickAction {
  actionType: string;
  title: string;
  description?: string;
  actionData?: any;
}

const extractReply = (payload: any): { reply: string; sessionId?: string } => {
  // Server returns { success: true, data: { response: { text }, sessionId } }
  const data = payload?.data ?? payload?.Response ?? payload;

  const reply =
    data?.response?.text ||
    data?.response?.message ||
    data?.text ||
    data?.reply ||
    data?.message ||
    '';

  const sessionId = data?.sessionId;
  return { reply, sessionId };
};

export const sendSupportChatMessage = async (
  message: string,
  sessionId?: string,
): Promise<{ reply: string; sessionId?: string }> => {
  const response = await appAxios.post('/support/chat', { message, sessionId });
  const extracted = extractReply(response.data);
  return { reply: extracted.reply, sessionId: extracted.sessionId || sessionId };
};

export const getSupportQuickActions = async (): Promise<IQuickAction[]> => {
  const response = await appAxios.get('/support/quick-actions');
  const payload = response.data;
  const list = payload?.data ?? payload?.Response ?? payload?.actions ?? [];
  // Server quick action shape: { id, label, actionType }
  return (Array.isArray(list) ? list : []).map((a: any) => ({
    actionType: a?.actionType,
    title: a?.title || a?.label || a?.name || 'Action',
    description: a?.description,
    actionData: a?.actionData,
  }));
};

export const handleSupportQuickAction = async (
  actionType: string,
  actionData?: any,
  sessionId?: string,
): Promise<{ reply: string; sessionId?: string }> => {
  const response = await appAxios.post('/support/quick-action', { actionType, actionData, sessionId });
  const extracted = extractReply(response.data);
  return { reply: extracted.reply, sessionId: extracted.sessionId || sessionId };
};

export const getSupportChatHistory = async (sessionId?: string): Promise<ISupportChatMessage[]> => {
  const response = await appAxios.get('/support/history', { params: sessionId ? { sessionId } : {} });
  const payload = response.data;
  const list = payload?.data ?? payload?.Response ?? payload?.history ?? [];
  return Array.isArray(list)
    ? list.map((m: any, idx: number) => ({
        id: m?.id || `${m?.role || 'msg'}_${m?.timestamp || m?.createdAt || idx}`,
        role: m?.role,
        message: m?.message || m?.text || '',
        createdAt: (m?.createdAt || m?.timestamp || new Date().toISOString()) as string,
      }))
    : [];
};

export const clearSupportChatHistory = async (sessionId?: string): Promise<void> => {
  await appAxios.delete('/support/history', { params: sessionId ? { sessionId } : {} });
};

