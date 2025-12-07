import { appAxios } from './apiInterceptors';
import {
  IChat,
  IMessage,
  ICreateDirectChatRequest,
  ICreateMessageRequest,
  ICreateGroupChatRequest,
  IEditGroupChatRequest,
  IUserListItem,
} from '../types/chat';

export const getChats = async (): Promise<IChat[]> => {
  try {
    const response = await appAxios.get('/chats');
    return response.data.Response || [];
  } catch (error) {
    throw error;
  }
};

export const createDirectChat = async (data: ICreateDirectChatRequest): Promise<IChat> => {
  try {
    const response = await appAxios.post('/chats/direct', data);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const createGroupChat = async (data: ICreateGroupChatRequest): Promise<IChat> => {
  try {
    const response = await appAxios.post('/chats/group', data);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const getChatById = async (chatId: string): Promise<IChat> => {
  try {
    const response = await appAxios.get(`/chats/${chatId}`);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const getChatMessages = async (
  chatId: string,
  limit: number = 50,
  before?: string,
): Promise<IMessage[]> => {
  try {
    const params: any = { limit };
    if (before) {
      params.before = before;
    }
    const response = await appAxios.get(`/chats/${chatId}/messages`, { params });
    return response.data.Response || [];
  } catch (error) {
    throw error;
  }
};

export const sendMessage = async (
  chatId: string,
  data: ICreateMessageRequest,
): Promise<IMessage> => {
  try {
    const response = await appAxios.post(`/chats/${chatId}/messages`, data);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const sendImageMessage = async (
  chatId: string,
  imageUri: string,
  text?: string,
): Promise<IMessage> => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);
    if (text) {
      formData.append('text', text);
    }

    const response = await appAxios.post(`/chats/${chatId}/messages/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const editGroupChat = async (
  chatId: string,
  data: IEditGroupChatRequest,
): Promise<IChat> => {
  try {
    const response = await appAxios.put(`/chats/${chatId}/edit`, data);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const followGroupChat = async (chatId: string): Promise<IChat> => {
  try {
    const response = await appAxios.post(`/chats/${chatId}/follow`);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const getUsers = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
): Promise<{ users: IUserListItem[]; pagination: any }> => {
  try {
    const params: any = { page, limit };
    if (search) {
      params.search = search;
    }
    const response = await appAxios.get('/users', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const startLiveLocation = async (
  chatId: string,
  coordinates: { latitude: number; longitude: number; address?: string },
): Promise<void> => {
  try {
    await appAxios.post(`/chats/${chatId}/live-location`, { coordinates });
  } catch (error) {
    throw error;
  }
};

export const stopLiveLocation = async (chatId: string): Promise<void> => {
  try {
    await appAxios.delete(`/chats/${chatId}/live-location`);
  } catch (error) {
    throw error;
  }
};

