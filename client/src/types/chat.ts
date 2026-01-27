export type ChatType = 'direct' | 'group';
export type MessageType = 'text' | 'location' | 'liveLocation' | 'image';

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
  groupImage?: string;
  privacy?: 'public' | 'private';
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
  groupImage?: string;
}

export interface IUserListItem {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
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

export interface IPendingRequestCount {
  count: number;
}
