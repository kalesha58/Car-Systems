import { Chat, IChatDocument } from '../../models/Chat';
import { Message, IMessageDocument } from '../../models/Message';
import { LiveLocation, ILiveLocationDocument } from '../../models/LiveLocation';
import { GroupMember } from '../../models/GroupMember';
import { SignUp } from '../../models/SignUp';
import {
  ICreateDirectChatRequest,
  ICreateMessageRequest,
  IStartLiveLocationRequest,
  IChat,
  IChatResponse,
  IChatsResponse,
  IMessage,
  IMessageResponse,
  IMessagesResponse,
  ILiveLocation,
  ILiveLocationsResponse,
} from '../../types/chat';
import { AppError, NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Convert chat document to IChat interface
 */
const chatToIChat = async (chatDoc: IChatDocument, userId?: string): Promise<IChat> => {
  const participantIds = chatDoc.participants;
  const users = await SignUp.find({ _id: { $in: participantIds } }).select('_id name profileImage');

  const userMap = new Map<string, { name: string; profileImage?: string }>();
  users.forEach((user) => {
    userMap.set((user._id as any).toString(), {
      name: user.name,
      profileImage: user.profileImage,
    });
  });

  const participantNames = participantIds.map((id) => userMap.get(id)?.name || 'Unknown');
  const participantAvatars = participantIds
    .map((id) => userMap.get(id)?.profileImage)
    .filter((avatar): avatar is string => avatar !== undefined);

  // Get last message
  const lastMessageDoc = await Message.findOne({ chatId: chatDoc.id })
    .sort({ createdAt: -1 })
    .limit(1);

  let lastMessage: IMessage | undefined;
  if (lastMessageDoc) {
    const fromUser = userMap.get(lastMessageDoc.from);
    lastMessage = {
      id: lastMessageDoc.id,
      chatId: lastMessageDoc.chatId,
      from: lastMessageDoc.from,
      fromUserName: fromUser?.name,
      fromUserAvatar: fromUser?.profileImage,
      to: lastMessageDoc.to,
      groupId: lastMessageDoc.groupId,
      text: lastMessageDoc.text,
      messageType: lastMessageDoc.messageType,
      location: lastMessageDoc.location,
      isLiveLocation: lastMessageDoc.isLiveLocation,
      createdAt: lastMessageDoc.createdAt.toISOString(),
    };
  }

  // Get unread count (if userId provided)
  let unreadCount = 0;
  if (userId) {
    // This is a simplified version - in production, you'd track read receipts
    unreadCount = 0;
  }

  return {
    id: chatDoc.id,
    type: chatDoc.type,
    participants: chatDoc.participants,
    participantNames,
    participantAvatars,
    groupId: chatDoc.groupId,
    lastMessage,
    unreadCount,
    createdAt: chatDoc.createdAt.toISOString(),
    updatedAt: chatDoc.updatedAt.toISOString(),
  };
};

/**
 * Convert message document to IMessage interface
 */
const messageToIMessage = async (messageDoc: IMessageDocument): Promise<IMessage> => {
  const fromUser = await SignUp.findById(messageDoc.from).select('name profileImage');

  return {
    id: messageDoc.id,
    chatId: messageDoc.chatId,
    from: messageDoc.from,
    fromUserName: fromUser?.name,
    fromUserAvatar: fromUser?.profileImage,
    to: messageDoc.to,
    groupId: messageDoc.groupId,
    text: messageDoc.text,
    messageType: messageDoc.messageType,
    location: messageDoc.location,
    isLiveLocation: messageDoc.isLiveLocation,
    createdAt: messageDoc.createdAt.toISOString(),
  };
};

/**
 * Get or create direct chat between two users
 */
export const getOrCreateDirectChat = async (
  userId: string,
  data: ICreateDirectChatRequest,
): Promise<IChatResponse> => {
  const { userId: otherUserId } = data;

  if (userId === otherUserId) {
    throw new AppError('Cannot create chat with yourself', 400);
  }

  // Check if direct chat already exists
  const existingChat = await Chat.findOne({
    type: 'direct',
    participants: { $all: [userId, otherUserId], $size: 2 },
  });

  if (existingChat) {
    return {
      Response: await chatToIChat(existingChat, userId),
    };
  }

  // Create new direct chat
  const chat = new Chat({
    type: 'direct',
    participants: [userId, otherUserId],
  });

  await chat.save();

  logger.info(`Direct chat created: ${chat.id} between ${userId} and ${otherUserId}`);

  return {
    Response: await chatToIChat(chat, userId),
  };
};

/**
 * Get user's chats (direct + group)
 */
export const getUserChats = async (userId: string): Promise<IChatsResponse> => {
  // Get direct chats
  const directChats = await Chat.find({
    type: 'direct',
    participants: userId,
  }).sort({ updatedAt: -1 });

  // Get group chats (user must be a member)
  const groupMemberships = await GroupMember.find({ userId, status: 'active' });
  const groupIds = groupMemberships.map((m) => m.groupId);

  const groupChats = await Chat.find({
    type: 'group',
    groupId: { $in: groupIds },
  }).sort({ updatedAt: -1 });

  const allChats = [...directChats, ...groupChats].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

  const chatsWithData = await Promise.all(allChats.map((chat) => chatToIChat(chat, userId)));

  return {
    Response: chatsWithData,
  };
};

/**
 * Get chat by ID
 */
export const getChatById = async (chatId: string, userId: string): Promise<IChatResponse> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  // Verify user is a participant
  if (!chat.participants.includes(userId)) {
    if (chat.type === 'group') {
      // For group chats, check if user is a member
      const member = await GroupMember.findOne({ groupId: chat.groupId, userId, status: 'active' });
      if (!member) {
        throw new AppError('You are not a member of this group chat', 403);
      }
    } else {
      throw new AppError('You are not a participant of this chat', 403);
    }
  }

  return {
    Response: await chatToIChat(chat, userId),
  };
};

/**
 * Get or create group chat
 */
export const getOrCreateGroupChat = async (groupId: string, userId: string): Promise<IChatResponse> => {
  // Verify user is a member
  const member = await GroupMember.findOne({ groupId, userId, status: 'active' });
  if (!member) {
    throw new AppError('You are not a member of this group', 403);
  }

  // Check if group chat already exists
  const existingChat = await Chat.findOne({ type: 'group', groupId });

  if (existingChat) {
    return {
      Response: await chatToIChat(existingChat, userId),
    };
  }

  // Get all group members
  const members = await GroupMember.find({ groupId, status: 'active' });
  const participantIds = members.map((m) => m.userId);

  // Create new group chat
  const chat = new Chat({
    type: 'group',
    participants: participantIds,
    groupId,
  });

  await chat.save();

  logger.info(`Group chat created: ${chat.id} for group: ${groupId}`);

  return {
    Response: await chatToIChat(chat, userId),
  };
};

/**
 * Get messages for a chat
 */
export const getChatMessages = async (
  chatId: string,
  userId: string,
  limit: number = 50,
  before?: string,
): Promise<IMessagesResponse> => {
  // Verify chat exists and user has access
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (!chat.participants.includes(userId)) {
    if (chat.type === 'group') {
      const member = await GroupMember.findOne({ groupId: chat.groupId, userId, status: 'active' });
      if (!member) {
        throw new AppError('You are not a member of this group chat', 403);
      }
    } else {
      throw new AppError('You are not a participant of this chat', 403);
    }
  }

  const query: any = { chatId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  const messagesWithUser = await Promise.all(
    messages.reverse().map((msg) => messageToIMessage(msg)),
  );

  return {
    Response: messagesWithUser,
  };
};

/**
 * Send message
 */
export const sendMessage = async (
  chatId: string,
  userId: string,
  data: ICreateMessageRequest,
): Promise<IMessageResponse> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  // Verify user is a participant
  if (!chat.participants.includes(userId)) {
    if (chat.type === 'group') {
      const member = await GroupMember.findOne({ groupId: chat.groupId, userId, status: 'active' });
      if (!member) {
        throw new AppError('You are not a member of this group chat', 403);
      }
    } else {
      throw new AppError('You are not a participant of this chat', 403);
    }
  }

  // Check if chat is enabled for group chats
  if (chat.type === 'group' && chat.groupId) {
    // This would require fetching the group - simplified for now
    // In production, you'd check group.chatEnabled
  }

  const message = new Message({
    chatId,
    from: userId,
    to: chat.type === 'direct' ? chat.participants.find((p) => p !== userId) : undefined,
    groupId: chat.groupId,
    text: data.text.trim(),
    messageType: data.messageType || 'text',
    location: data.location,
    isLiveLocation: data.isLiveLocation || false,
  });

  await message.save();

  // Update chat's updatedAt
  chat.updatedAt = new Date();
  await chat.save();

  logger.info(`Message sent: ${message.id} in chat: ${chatId} by user: ${userId}`);

  return {
    Response: await messageToIMessage(message),
  };
};

/**
 * Start live location sharing
 */
export const startLiveLocation = async (
  chatId: string,
  userId: string,
  data: IStartLiveLocationRequest,
): Promise<void> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (!chat.groupId) {
    throw new AppError('Live location can only be shared in group chats', 400);
  }

  // Verify user is a member
  const member = await GroupMember.findOne({ groupId: chat.groupId, userId, status: 'active' });
  if (!member) {
    throw new AppError('You are not a member of this group', 403);
  }

  // Update or create live location
  const liveLocation = await LiveLocation.findOne({ userId, groupId: chat.groupId });

  if (liveLocation) {
    liveLocation.coordinates = data.coordinates;
    liveLocation.isActive = true;
    liveLocation.lastUpdated = new Date();
    liveLocation.scheduledTimes = data.scheduledTimes;
    await liveLocation.save();
  } else {
    const newLiveLocation = new LiveLocation({
      userId,
      groupId: chat.groupId,
      coordinates: data.coordinates,
      isActive: true,
      scheduledTimes: data.scheduledTimes,
    });
    await newLiveLocation.save();
  }

  logger.info(`Live location started for chat: ${chatId} user: ${userId}`);
};

/**
 * Stop live location sharing
 */
export const stopLiveLocation = async (chatId: string, userId: string): Promise<void> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (!chat.groupId) {
    throw new AppError('Live location can only be stopped in group chats', 400);
  }

  const liveLocation = await LiveLocation.findOne({ userId, groupId: chat.groupId });

  if (liveLocation) {
    liveLocation.isActive = false;
    await liveLocation.save();
  }

  logger.info(`Live location stopped for chat: ${chatId} user: ${userId}`);
};

/**
 * Get active live locations for a group
 */
export const getLiveLocations = async (
  groupId: string,
  userId: string,
): Promise<ILiveLocationsResponse> => {
  // Verify user is a member
  const member = await GroupMember.findOne({ groupId, userId, status: 'active' });
  if (!member) {
    throw new AppError('You are not a member of this group', 403);
  }

  const liveLocations = await LiveLocation.find({ groupId, isActive: true });
  const userIds = liveLocations.map((ll) => ll.userId);

  const users = await SignUp.find({ _id: { $in: userIds } }).select('_id name profileImage');

  const userMap = new Map<string, { name: string; profileImage?: string }>();
  users.forEach((user) => {
    userMap.set((user._id as any).toString(), {
      name: user.name,
      profileImage: user.profileImage,
    });
  });

  const locationsWithUser: ILiveLocation[] = liveLocations.map((ll) => {
    const user = userMap.get(ll.userId);
    return {
      id: ll.id,
      userId: ll.userId,
      userName: user?.name,
      userAvatar: user?.profileImage,
      groupId: ll.groupId,
      coordinates: ll.coordinates,
      isActive: ll.isActive,
      lastUpdated: ll.lastUpdated.toISOString(),
    };
  });

  return {
    Response: locationsWithUser,
  };
};

