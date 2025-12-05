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


