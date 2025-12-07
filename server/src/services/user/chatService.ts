import { Chat, IChatDocument } from '../../models/Chat';
import { Message, IMessageDocument } from '../../models/Message';
import { LiveLocation, ILiveLocationDocument } from '../../models/LiveLocation';
import { GroupMember } from '../../models/GroupMember';
import { SignUp } from '../../models/SignUp';
import {
  ICreateDirectChatRequest,
  ICreateMessageRequest,
  IStartLiveLocationRequest,
  ICreateGroupChatRequest,
  IEditGroupChatRequest,
  IChat,
  IChatResponse,
  IChatsResponse,
  IMessage,
  IMessageResponse,
  IMessagesResponse,
  ILiveLocation,
  ILiveLocationsResponse,
} from '../../types/chat';
import { Group } from '../../models/Group';
import { AppError, NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { emitToChatRoom } from '../socket/socketService';

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

  // Get group information if it's a group chat
  let groupName: string | undefined;
  let isMember: boolean | undefined;
  let canFollow: boolean | undefined;

  if (chatDoc.type === 'group' && chatDoc.groupId) {
    const group = await Group.findById(chatDoc.groupId);
    if (group) {
      groupName = group.name;
      
      if (userId) {
        const member = await GroupMember.findOne({ 
          groupId: group.id, 
          userId, 
          status: 'active' 
        });
        isMember = !!member;
        
        // Can follow if group is public and user is not a member
        canFollow = group.privacy === 'public' && !isMember;
      }
    }
  }

  return {
    id: chatDoc.id,
    type: chatDoc.type,
    participants: chatDoc.participants,
    participantNames,
    participantAvatars,
    groupId: chatDoc.groupId,
    groupName,
    lastMessage,
    unreadCount,
    isMember,
    canFollow,
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
    imageUrl: messageDoc.imageUrl,
    imagePublicId: messageDoc.imagePublicId,
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

  // Get group chats where user is a member
  const groupMemberships = await GroupMember.find({ userId, status: 'active' });
  const memberGroupIds = groupMemberships.map((m) => m.groupId);

  const memberGroupChats = await Chat.find({
    type: 'group',
    groupId: { $in: memberGroupIds },
  }).sort({ updatedAt: -1 });

  // Get all public group chats (even if user is not a member)
  const publicGroups = await Group.find({ privacy: 'public' });
  const publicGroupIds = publicGroups.map((g) => g.id);

  const publicGroupChats = await Chat.find({
    type: 'group',
    groupId: { $in: publicGroupIds },
  }).sort({ updatedAt: -1 });

  // Combine all chats, removing duplicates
  const allChatsMap = new Map<string, IChatDocument>();
  
  [...directChats, ...memberGroupChats, ...publicGroupChats].forEach((chat) => {
    allChatsMap.set(chat.id, chat);
  });

  const allChats = Array.from(allChatsMap.values()).sort(
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
 * Create group chat with multiple users
 */
export const createGroupChat = async (
  userId: string,
  data: ICreateGroupChatRequest,
): Promise<IChatResponse> => {
  const { name, userIds, privacy } = data;

  if (!name || !name.trim()) {
    throw new AppError('Group name is required', 400);
  }

  if (!userIds || userIds.length === 0) {
    throw new AppError('At least one user must be selected', 400);
  }

  // Ensure creator is included in participants
  const allUserIds = [...new Set([userId, ...userIds])];

  // Create Group document
  const group = new Group({
    name: name.trim(),
    type: 'bikeCarDrive', // Default type for chat groups
    ownerId: userId,
    privacy: privacy || 'private',
    chatEnabled: true,
    liveLocationEnabled: true,
  });

  await group.save();

  // Create GroupMember entries for all participants
  const memberPromises = allUserIds.map((uid) => {
    return GroupMember.findOneAndUpdate(
      { groupId: group.id, userId: uid },
      {
        groupId: group.id,
        userId: uid,
        role: uid === userId ? 'admin' : 'member',
        status: 'active',
      },
      { upsert: true, new: true },
    );
  });

  await Promise.all(memberPromises);

  // Create Chat document for the group
  const chat = new Chat({
    type: 'group',
    participants: allUserIds,
    groupId: group.id,
  });

  await chat.save();

  logger.info(`Group chat created: ${chat.id} for group: ${group.id} by user: ${userId}`);

  return {
    Response: await chatToIChat(chat, userId),
  };
};

/**
 * Edit group chat (rename, add/remove members, change privacy)
 */
export const editGroupChat = async (
  chatId: string,
  userId: string,
  data: IEditGroupChatRequest,
): Promise<IChatResponse> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (chat.type !== 'group' || !chat.groupId) {
    throw new AppError('This endpoint is only for group chats', 400);
  }

  // Get group and verify user is owner
  const group = await Group.findById(chat.groupId);
  if (!group) {
    throw new NotFoundError('Group not found');
  }

  if (group.ownerId !== userId) {
    throw new AppError('Only group owner can edit the group', 403);
  }

  // Update group name if provided
  if (data.name !== undefined) {
    group.name = data.name.trim();
  }

  // Update privacy if provided
  if (data.privacy !== undefined) {
    group.privacy = data.privacy;
  }

  await group.save();

  // Add members if provided
  if (data.userIdsToAdd && data.userIdsToAdd.length > 0) {
    const addPromises = data.userIdsToAdd.map((uid) => {
      return GroupMember.findOneAndUpdate(
        { groupId: group.id, userId: uid },
        {
          groupId: group.id,
          userId: uid,
          role: 'member',
          status: 'active',
        },
        { upsert: true, new: true },
      );
    });

    await Promise.all(addPromises);

    // Update chat participants
    const newMembers = await GroupMember.find({ groupId: group.id, status: 'active' });
    chat.participants = newMembers.map((m) => m.userId);
  }

  // Remove members if provided
  if (data.userIdsToRemove && data.userIdsToRemove.length > 0) {
    // Don't allow removing the owner
    const filteredRemoveIds = data.userIdsToRemove.filter((uid) => uid !== userId);

    await GroupMember.updateMany(
      { groupId: group.id, userId: { $in: filteredRemoveIds } },
      { status: 'pending' },
    );

    // Update chat participants
    const remainingMembers = await GroupMember.find({ groupId: group.id, status: 'active' });
    chat.participants = remainingMembers.map((m) => m.userId);
  }

  await chat.save();

  logger.info(`Group chat edited: ${chat.id} by user: ${userId}`);

  return {
    Response: await chatToIChat(chat, userId),
  };
};

/**
 * Follow/join public group chat
 */
export const followGroupChat = async (chatId: string, userId: string): Promise<IChatResponse> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (chat.type !== 'group' || !chat.groupId) {
    throw new AppError('This endpoint is only for group chats', 400);
  }

  // Get group and verify it's public
  const group = await Group.findById(chat.groupId);
  if (!group) {
    throw new NotFoundError('Group not found');
  }

  if (group.privacy !== 'public') {
    throw new AppError('This group is private. You cannot follow it directly.', 403);
  }

  // Check if user is already a member
  const existingMember = await GroupMember.findOne({ groupId: group.id, userId });

  if (!existingMember || existingMember.status !== 'active') {
    // Create or update GroupMember entry
    await GroupMember.findOneAndUpdate(
      { groupId: group.id, userId },
      {
        groupId: group.id,
        userId,
        role: 'member',
        status: 'active',
      },
      { upsert: true, new: true },
    );

    // Add user to chat participants if not already there
    if (!chat.participants.includes(userId)) {
      chat.participants.push(userId);
      await chat.save();
    }
  }

  logger.info(`User ${userId} followed public group chat: ${chat.id}`);

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
    imageUrl: data.image?.url,
    imagePublicId: data.image?.publicId,
  });

  await message.save();

  // Update chat's updatedAt
  chat.updatedAt = new Date();
  await chat.save();

  // Emit socket event for new message
  const messageData = await messageToIMessage(message);
  emitToChatRoom(chatId, 'newMessage', messageData);

  logger.info(`Message sent: ${message.id} in chat: ${chatId} by user: ${userId}`);

  return {
    Response: messageData,
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

