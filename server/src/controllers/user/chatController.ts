import { Response, NextFunction } from 'express';
import {
  getOrCreateDirectChat,
  getUserChats,
  getChatById,
  createGroupChat,
  editGroupChat,
  followGroupChat,
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
  ICreateGroupChatRequest,
  IEditGroupChatRequest,
} from '../../types/chat';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { IAuthRequest, IMulterFile } from '../../middleware/authMiddleware';
import { logger } from '../../utils/logger';
import { uploadSingle } from '../../middleware/uploadMiddleware';
import { uploadToCloudinary } from '../../config/cloudinary';
import fs from 'fs';

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
 * Create group chat controller
 */
export const createGroupChatController = async (
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

    const groupData: ICreateGroupChatRequest = req.body;
    const result = await createGroupChat(userId, groupData);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Edit group chat controller
 */
export const editGroupChatController = async (
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

    const editData: IEditGroupChatRequest = req.body;
    const result = await editGroupChat(chatId, userId, editData);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Follow/join public group chat controller
 */
export const followGroupChatController = async (
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

    const result = await followGroupChat(chatId, userId);

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
 * Send image message controller
 */
export const sendImageMessageController = async (
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

    const file = req.file as IMulterFile;
    if (!file) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Image file is required',
        },
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file.path, 'chat-images');
    
    // Clean up temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const messageData: ICreateMessageRequest = {
      text: req.body.text || 'Image',
      messageType: 'image',
      image: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
    };

    const result = await sendMessage(chatId, userId, messageData);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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


