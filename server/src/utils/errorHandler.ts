import { Response } from 'express';
import { logger } from './logger';

export interface IAppError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (err: IAppError, res: Response): void => {
  try {
    logger.error('Error occurred', err);

    const statusCode = err?.statusCode || 500;
    let message = 'Internal server error';
    
    if (err) {
      if (typeof err === 'string') {
        message = err;
      } else if (err.message) {
        message = err.message;
      } else if (typeof err === 'object' && err.toString) {
        message = err.toString();
      }
    }

    const Response = {
      ReturnMessage: message
    };

    // Ensure we always send JSON response
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: message, // Add message field for better client compatibility
        Response: Response
      });
    }
  } catch (handlerError) {
    // If error handler itself fails, try to send a basic response
    logger.error('Error handler failed', handlerError);
    if (!res.headersSent) {
      try {
        res.status(500).json({
          success: false,
          Response: {
            ReturnMessage: 'Internal server error'
          }
        });
      } catch (finalError) {
        logger.error('Failed to send error response', finalError);
      }
    }
  }
};

export class AppError extends Error implements IAppError {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}



