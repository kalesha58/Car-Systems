import { api } from './api';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendAiMessage(message: string): Promise<AiMessage> {
  const { data } = await api.post<AiMessage>('/ai/chat', { message });
  return data;
}
