export type ConversationType = 'private' | 'dealer' | 'group' | 'ai';

export interface Conversation {
  id: string;
  type: ConversationType;
  participants: string[]; // User IDs (includes dealers)
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Date;
    messageType: string;
  };
  updatedAt: Date;
  createdAt: Date;
  unreadCounts: Record<string, number>; // key: userId, value: count
  pinned?: Record<string, boolean>; // key: userId, value: boolean
  muted?: Record<string, boolean>; // key: userId, value: boolean
  archived?: Record<string, boolean>; // key: userId, value: boolean
  dealerId?: string; // business registration ID for dealer threads
  name?: string;
  image?: string;
  admins?: string[];
  participantNames?: Record<string, string>;
  otherParticipantName?: string;
  otherParticipantAvatar?: string;
  isOtherParticipantOnline?: boolean;
  isOtherParticipantTyping?: boolean;
  otherParticipantLastSeen?: Date;
  isVerifiedDealer?: boolean;
}

export type MessageType = 'text' | 'image' | 'voice' | 'pdf' | 'location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Attachment {
  url: string;
  type: MessageType;
  name?: string;
  size?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string; // only for private chats
  messageType: MessageType;
  text?: string;
  image?: string; // image download URL
  voice?: string; // voice download URL
  pdf?: string; // PDF download URL
  location?: LocationData;
  createdAt: Date;
  editedAt?: Date;
  status: 'sent' | 'delivered' | 'seen';
  replyTo?: {
    messageId: string;
    senderName: string;
    messageType: MessageType;
    text: string;
  };
  attachments?: Attachment[];
}

export interface Group {
  groupId: string;
  name: string;
  image?: string;
  admins: string[];
  members: string[];
  description?: string;
  createdAt: Date;
}

export interface Presence {
  userId: string;
  online: boolean;
  lastSeen: Date;
  typing?: Record<string, boolean>; // key: conversationId, value: isTyping
}
