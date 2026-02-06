import { appAxios } from './apiInterceptors';
import { IGroup, ICreateGroupRequest, IGroupMember } from '../types/group';

export const createGroup = async (data: ICreateGroupRequest): Promise<IGroup> => {
  try {
    const response = await appAxios.post('/groups', data);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const getUserGroups = async (): Promise<IGroup[]> => {
  try {
    const response = await appAxios.get('/groups');
    return response.data.Response || [];
  } catch (error) {
    throw error;
  }
};

export const getGroupById = async (groupId: string): Promise<IGroup> => {
  try {
    const response = await appAxios.get(`/groups/${groupId}`);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const updateGroup = async (groupId: string, data: Partial<ICreateGroupRequest>): Promise<IGroup> => {
  try {
    const response = await appAxios.put(`/groups/${groupId}`, data);
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    await appAxios.delete(`/groups/${groupId}`);
  } catch (error) {
    throw error;
  }
};

export const joinGroup = async (groupId: string, joinCode?: string): Promise<IGroup> => {
  try {
    const response = await appAxios.post(`/groups/${groupId}/join`, { joinCode });
    return response.data.Response;
  } catch (error) {
    throw error;
  }
};

export const getGroupMembers = async (groupId: string): Promise<IGroupMember[]> => {
  try {
    const response = await appAxios.get(`/groups/${groupId}/members`);
    return response.data.Response || [];
  } catch (error) {
    throw error;
  }
};

export const addGroupMembers = async (groupId: string, userIds: string[]): Promise<void> => {
  try {
    await appAxios.post(`/groups/${groupId}/members`, { userIds });
  } catch (error) {
    throw error;
  }
};

export const removeGroupMember = async (groupId: string, memberUserId: string): Promise<void> => {
  try {
    await appAxios.delete(`/groups/${groupId}/members/${memberUserId}`);
  } catch (error) {
    throw error;
  }
};
