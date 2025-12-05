// CRITICAL: Load environment variables FIRST
import '../config/env';

import { connectDatabase } from '../config/database';
import { SignUp } from '../models/SignUp';
import { Group } from '../models/Group';
import { GroupMember } from '../models/GroupMember';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { LiveLocation } from '../models/LiveLocation';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

interface ISeedUser {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const seedUsers: ISeedUser[] = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '9876543210',
    password: 'Password123!',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '9876543211',
    password: 'Password123!',
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '9876543212',
    password: 'Password123!',
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    phone: '9876543213',
    password: 'Password123!',
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '9876543214',
    password: 'Password123!',
  },
];

const sampleMessages = [
  'Hey! How are you?',
  'I am doing great, thanks!',
  'Are we still on for the weekend trip?',
  'Yes, absolutely! Looking forward to it.',
  'What time should we meet?',
  'Let\'s meet at 8 AM at the usual spot.',
  'Perfect! See you then.',
  'Don\'t forget to bring your camera.',
  'I won\'t! Excited for the drive.',
  'The weather looks great for tomorrow.',
  'Yes, it should be a beautiful day.',
  'I\'ll bring some snacks for the journey.',
  'Great idea! I\'ll bring drinks.',
  'Thanks for organizing this!',
  'My pleasure! It\'s going to be fun.',
];

const locationMessages = [
  {
    text: 'Here is my current location',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'MG Road, Bangalore',
    },
  },
  {
    text: 'Meeting point',
    location: {
      latitude: 12.9352,
      longitude: 77.6245,
      address: 'Cubbon Park, Bangalore',
    },
  },
];

/**
 * Create or find users
 */
const seedUsersData = async (): Promise<string[]> => {
  logger.info('Seeding users...');
  const userIds: string[] = [];

  for (const userData of seedUsers) {
    let user = await SignUp.findOne({ email: userData.email });

    if (!user) {
      user = new SignUp({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: ['user'],
        status: 'active',
      });
      await user.save();
      logger.info(`Created user: ${userData.name}`);
    } else {
      logger.info(`User already exists: ${userData.name}`);
    }

    userIds.push((user._id as any).toString());
  }

  logger.info(`Seeded ${userIds.length} users`);
  return userIds;
};

/**
 * Create groups
 */
const seedGroups = async (userIds: string[]): Promise<string[]> => {
  logger.info('Seeding groups...');
  const groupIds: string[] = [];

  const groupsData = [
    {
      name: 'Weekend Riders',
      description: 'A group for weekend bike and car rides',
      type: 'bikeCarDrive' as const,
      ownerId: userIds[0],
      privacy: 'public' as const,
      chatEnabled: true,
      liveLocationEnabled: true,
    },
    {
      name: 'Bangalore Transport Group',
      description: 'Van transportation group for Bangalore area',
      type: 'vanTransportation' as const,
      ownerId: userIds[1],
      privacy: 'private' as const,
      joinCode: 'BANG001',
      chatEnabled: true,
      liveLocationEnabled: true,
    },
    {
      name: 'Road Trip Enthusiasts',
      description: 'Long distance road trip planning and execution',
      type: 'bikeCarDrive' as const,
      ownerId: userIds[2],
      privacy: 'public' as const,
      chatEnabled: true,
      liveLocationEnabled: true,
    },
  ];

  for (const groupData of groupsData) {
    let group = await Group.findOne({ name: groupData.name });

    if (!group) {
      group = new Group(groupData);
      await group.save();
      logger.info(`Created group: ${groupData.name}`);
    } else {
      logger.info(`Group already exists: ${groupData.name}`);
    }

    groupIds.push((group._id as any).toString());
  }

  logger.info(`Seeded ${groupIds.length} groups`);
  return groupIds;
};

/**
 * Add users as group members
 */
const seedGroupMembers = async (userIds: string[], groupIds: string[]): Promise<void> => {
  logger.info('Seeding group members...');

  // Group 1: Weekend Riders - all users
  for (let i = 0; i < userIds.length; i++) {
    const existingMember = await GroupMember.findOne({
      groupId: groupIds[0],
      userId: userIds[i],
    });

    if (!existingMember) {
      const member = new GroupMember({
        groupId: groupIds[0],
        userId: userIds[i],
        role: i === 0 ? 'admin' : 'member',
        status: 'active',
      });
      await member.save();
    }
  }

  // Group 2: Bangalore Transport - first 3 users
  for (let i = 0; i < 3; i++) {
    const existingMember = await GroupMember.findOne({
      groupId: groupIds[1],
      userId: userIds[i],
    });

    if (!existingMember) {
      const member = new GroupMember({
        groupId: groupIds[1],
        userId: userIds[i],
        role: i === 1 ? 'admin' : 'member',
        status: 'active',
      });
      await member.save();
    }
  }

  // Group 3: Road Trip Enthusiasts - last 3 users
  for (let i = 2; i < userIds.length; i++) {
    const existingMember = await GroupMember.findOne({
      groupId: groupIds[2],
      userId: userIds[i],
    });

    if (!existingMember) {
      const member = new GroupMember({
        groupId: groupIds[2],
        userId: userIds[i],
        role: i === 2 ? 'admin' : 'member',
        status: 'active',
      });
      await member.save();
    }
  }

  logger.info('Group members seeded');
};

/**
 * Create direct chats
 */
const seedDirectChats = async (userIds: string[]): Promise<string[]> => {
  logger.info('Seeding direct chats...');
  const chatIds: string[] = [];

  // Create direct chats between pairs
  const pairs = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
  ];

  for (const [idx1, idx2] of pairs) {
    const user1Id = userIds[idx1];
    const user2Id = userIds[idx2];

    let chat = await Chat.findOne({
      type: 'direct',
      participants: { $all: [user1Id, user2Id], $size: 2 },
    });

    if (!chat) {
      chat = new Chat({
        type: 'direct',
        participants: [user1Id, user2Id],
      });
      await chat.save();
      logger.info(`Created direct chat between user ${idx1 + 1} and user ${idx2 + 1}`);
    } else {
      logger.info(`Direct chat already exists between user ${idx1 + 1} and user ${idx2 + 1}`);
    }

    chatIds.push((chat._id as any).toString());
  }

  logger.info(`Seeded ${chatIds.length} direct chats`);
  return chatIds;
};

/**
 * Create group chats
 */
const seedGroupChats = async (groupIds: string[]): Promise<string[]> => {
  logger.info('Seeding group chats...');
  const chatIds: string[] = [];

  for (const groupId of groupIds) {
    let chat = await Chat.findOne({
      type: 'group',
      groupId,
    });

    if (!chat) {
      // Get all members for this group
      const members = await GroupMember.find({ groupId, status: 'active' });
      const participantIds = members.map((m) => m.userId);

      chat = new Chat({
        type: 'group',
        participants: participantIds,
        groupId,
      });
      await chat.save();
      logger.info(`Created group chat for group: ${groupId}`);
    } else {
      logger.info(`Group chat already exists for group: ${groupId}`);
    }

    chatIds.push((chat._id as any).toString());
  }

  logger.info(`Seeded ${chatIds.length} group chats`);
  return chatIds;
};

/**
 * Seed messages for chats
 */
const seedMessages = async (
  directChatIds: string[],
  groupChatIds: string[],
  userIds: string[],
): Promise<void> => {
  logger.info('Seeding messages...');

  // Seed messages for direct chats
  for (const chatId of directChatIds) {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'direct') continue;

    const [user1Id, user2Id] = chat.participants;
    const existingMessages = await Message.countDocuments({ chatId });

    
    if (existingMessages === 0) {
      const messagesToCreate = 12;
      const baseTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago

      for (let i = 0; i < messagesToCreate; i++) {
        const isUser1 = i % 2 === 0;
        const senderId = isUser1 ? user1Id : user2Id;
        const messageIndex = i % sampleMessages.length;
        const isLocationMessage = i === 3 || i === 8;

        let messageData: any = {
          chatId,
          from: senderId,
          to: isUser1 ? user2Id : user1Id,
          text: isLocationMessage
            ? locationMessages[i === 3 ? 0 : 1].text
            : sampleMessages[messageIndex],
          messageType: isLocationMessage ? 'location' : 'text',
          createdAt: new Date(baseTime + i * 2 * 60 * 60 * 1000), // 2 hours apart
        };

        if (isLocationMessage) {
          messageData.location = locationMessages[i === 3 ? 0 : 1].location;
        }

        const message = new Message(messageData);
        await message.save();
      }

      logger.info(`Seeded ${messagesToCreate} messages for direct chat: ${chatId}`);
    }
  }

  // Seed messages for group chats
  for (const chatId of groupChatIds) {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') continue;

    const existingMessages = await Message.countDocuments({ chatId });

    if (existingMessages === 0) {
      const messagesToCreate = 15;
      const baseTime = Date.now() - 5 * 24 * 60 * 60 * 1000; // 5 days ago
      const participants = chat.participants;

      for (let i = 0; i < messagesToCreate; i++) {
        const senderId = participants[i % participants.length];
        const messageIndex = i % sampleMessages.length;
        const isLocationMessage = i === 5 || i === 12;

        let messageData: any = {
          chatId,
          from: senderId,
          groupId: chat.groupId,
          text: isLocationMessage
            ? locationMessages[i === 5 ? 0 : 1].text
            : sampleMessages[messageIndex],
          messageType: isLocationMessage ? 'location' : 'text',
          createdAt: new Date(baseTime + i * 3 * 60 * 60 * 1000), // 3 hours apart
        };

        if (isLocationMessage) {
          messageData.location = locationMessages[i === 5 ? 0 : 1].location;
        }

        const message = new Message(messageData);
        await message.save();
      }

      logger.info(`Seeded ${messagesToCreate} messages for group chat: ${chatId}`);
    }
  }

  logger.info('Messages seeded');
};

/**
 * Seed live locations
 */
const seedLiveLocations = async (groupIds: string[], userIds: string[]): Promise<void> => {
  logger.info('Seeding live locations...');

  // Create 2 active live locations
  const liveLocationData = [
    {
      userId: userIds[0],
      groupId: groupIds[0],
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road, Bangalore',
      },
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      userId: userIds[1],
      groupId: groupIds[0],
      coordinates: {
        latitude: 12.9352,
        longitude: 77.6245,
        address: 'Cubbon Park, Bangalore',
      },
      isActive: true,
      lastUpdated: new Date(),
    },
  ];

  for (const locationData of liveLocationData) {
    let liveLocation = await LiveLocation.findOne({
      userId: locationData.userId,
      groupId: locationData.groupId,
    });

    if (!liveLocation) {
      liveLocation = new LiveLocation(locationData);
      await liveLocation.save();
      logger.info(
        `Created live location for user ${locationData.userId} in group ${locationData.groupId}`,
      );
    } else {
      // Update existing live location
      liveLocation.coordinates = locationData.coordinates;
      liveLocation.isActive = true;
      liveLocation.lastUpdated = new Date();
      await liveLocation.save();
      logger.info(
        `Updated live location for user ${locationData.userId} in group ${locationData.groupId}`,
      );
    }
  }

  logger.info('Live locations seeded');
};

/**
 * Main seed function
 */
const seedChatData = async (): Promise<void> => {
  try {
    logger.info('Starting chat data seeding...');

    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Seed users
    const userIds = await seedUsersData();

    // Seed groups
    const groupIds = await seedGroups(userIds);

    // Seed group members
    await seedGroupMembers(userIds, groupIds);

    // Seed direct chats
    const directChatIds = await seedDirectChats(userIds);

    // Seed group chats
    const groupChatIds = await seedGroupChats(groupIds);

    // Seed messages
    await seedMessages(directChatIds, groupChatIds, userIds);

    // Seed live locations
    await seedLiveLocations(groupIds, userIds);

    logger.info('Chat data seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding chat data:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run the seed script
seedChatData().catch((error) => {
  logger.error('Fatal error in seed script:', error);
  process.exit(1);
});

