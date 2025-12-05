import { Response, NextFunction } from 'express';
import {
  getOrCreateDirectChat,
  getUserChats,
  getChatById,
  getOrCreateGroupChat,
  getChatMessages,
  sendMessage,
  startLiveLocation,
  stopLiveLocation,
  getLiveLocations,
} from '../../services/user/chatService';
import {
  ICreateDirectChatRequest,
  ICreateMessageRequest,
  IStartLiveLocationRequest,
} from '../../types/chat';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { logger } from '../../utils/logger';

/**
 * Create or get direct chat controller
 */
export const createDirectChatController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const chatData: ICreateDirectChatRequest = req.body;
    const result = await getOrCreateDirectChat(userId, chatData);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user's chats controller
 */
export const getUserChatsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getUserChats(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get chat by ID controller
 */
export const getChatByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const chatId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getChatById(chatId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get or create group chat controller
 */
export const getOrCreateGroupChatController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getOrCreateGroupChat(groupId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get chat messages controller
 */
export const getChatMessagesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const chatId = req.params.chatId;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string | undefined;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getChatMessages(chatId, userId, limit, before);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Send message controller
 */
export const sendMessageController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const chatId = req.params.chatId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const messageData: ICreateMessageRequest = req.body;
    const result = await sendMessage(chatId, userId, messageData);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Start live location controller
 */
export const startLiveLocationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const chatId = req.params.chatId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const locationData: IStartLiveLocationRequest = req.body;
    await startLiveLocation(chatId, userId, locationData);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Live location started',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Stop live location controller
 */
export const stopLiveLocationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const chatId = req.params.chatId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await stopLiveLocation(chatId, userId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Live location stopped',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get live locations controller
 */
export const getLiveLocationsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getLiveLocations(groupId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};


