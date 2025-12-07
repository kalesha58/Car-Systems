import { ChatType } from '../models/Chat';
import { MessageType } from '../models/Message';

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IMessage {
  id: string;
  chatId: string;
  from: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  to?: string;
  groupId?: string;
  text: string;
  messageType: MessageType;
  location?: ILocation;
  isLiveLocation?: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: string;
}

export interface IChat {
  id: string;
  type: ChatType;
  participants: string[];
  participantNames?: string[];
  participantAvatars?: string[];
  groupId?: string;
  groupName?: string;
  lastMessage?: IMessage;
  unreadCount?: number;
  isMember?: boolean;
  canFollow?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateDirectChatRequest {
  userId: string;
}

export interface ICreateMessageRequest {
  text: string;
  messageType?: MessageType;
  location?: ILocation;
  isLiveLocation?: boolean;
  image?: {
    url: string;
    publicId: string;
  };
}

export interface IStartLiveLocationRequest {
  coordinates: ILocation;
  scheduledTimes?: {
    startTime: string;
    endTime: string;
    days?: string[];
  };
}

export interface IChatResponse {
  Response: IChat;
}

export interface IChatsResponse {
  Response: IChat[];
}

export interface IMessageResponse {
  Response: IMessage;
}

export interface IMessagesResponse {
  Response: IMessage[];
}

export interface ILiveLocation {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  groupId: string;
  coordinates: ILocation;
  isActive: boolean;
  lastUpdated: string;
}

export interface ILiveLocationsResponse {
  Response: ILiveLocation[];
}

export interface ICreateGroupChatRequest {
  name: string;
  userIds: string[];
  privacy: 'public' | 'private';
}

export interface IEditGroupChatRequest {
  name?: string;
  userIdsToAdd?: string[];
  userIdsToRemove?: string[];
  privacy?: 'public' | 'private';
}

export interface IGroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface IJoinRequestResponse {
  Response: IGroupJoinRequest;
}

export interface IJoinRequestsResponse {
  Response: IGroupJoinRequest[];
}

export interface IPendingRequestCountResponse {
  Response: {
    count: number;
  };
}


