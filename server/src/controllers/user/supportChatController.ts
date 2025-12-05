import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import {
  processMessage,
  getQuickActions,
  handleQuickAction,
  getChatHistory,
  clearChatHistory,
} from '../../services/supportChat/chatBotService';
import { IProcessMessageRequest, IQuickActionRequest } from '../../types/supportChat';

/**
 * Send message and get bot response
 */
export const sendMessageController = async (
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

    const { message, sessionId } = req.body as IProcessMessageRequest;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Message is required',
        },
      });
      return;
    }

    const result = await processMessage(userId, { message: message.trim(), sessionId });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in sendMessageController:', error);
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get quick actions
 */
export const getQuickActionsController = async (
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

    const quickActions = await getQuickActions(userId);

    res.status(200).json({
      success: true,
      data: quickActions,
    });
  } catch (error) {
    logger.error('Error in getQuickActionsController:', error);
    errorHandler(error as IAppError, res);
  }
};

/**
 * Handle quick action
 */
export const handleQuickActionController = async (
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

    const { actionType, actionData } = req.body as IQuickActionRequest;

    if (!actionType || typeof actionType !== 'string') {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Action type is required',
        },
      });
      return;
    }

    const response = await handleQuickAction(userId, actionType, actionData);

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error in handleQuickActionController:', error);
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get chat history
 */
export const getChatHistoryController = async (
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

    const sessionId = req.query.sessionId as string | undefined;
    const messages = await getChatHistory(userId, sessionId);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Error in getChatHistoryController:', error);
    errorHandler(error as IAppError, res);
  }
};

/**
 * Clear chat history
 */
export const clearChatHistoryController = async (
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

    const sessionId = req.query.sessionId as string | undefined;
    await clearChatHistory(userId, sessionId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Chat history cleared successfully',
      },
    });
  } catch (error) {
    logger.error('Error in clearChatHistoryController:', error);
    errorHandler(error as IAppError, res);
  }
};

