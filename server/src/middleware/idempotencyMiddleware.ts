import { Request, Response, NextFunction } from 'express';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const IDEMPOTENCY_KEY_EXPIRY_HOURS = parseInt(
  process.env.IDEMPOTENCY_KEY_EXPIRY_HOURS || '24',
  10,
);

/**
 * Generate hash from request body
 */
const generateRequestHash = (body: any, userId: string): string => {
  const payload = JSON.stringify({ body, userId });
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Idempotency middleware
 * Checks for Idempotency-Key header and returns cached response if key exists
 */
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Only apply to POST, PUT, PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;
  const userId = (req as any).user?.userId || 'anonymous';

  if (!idempotencyKey) {
    return next();
  }

  try {
    // Generate request hash
    const requestHash = generateRequestHash(req.body, userId);

    // Check if key exists
    const existingKey = await IdempotencyKey.findOne({ key: idempotencyKey });

    if (existingKey) {
      // Check if request matches
      if (existingKey.requestHash === requestHash && existingKey.userId === userId) {
        // Return cached response
        logger.info(`Idempotent request detected: ${idempotencyKey}`, {
          userId,
          path: req.path,
        });

        // Check if expired
        if (existingKey.expiresAt < new Date()) {
          logger.warn(`Idempotency key expired: ${idempotencyKey}`);
          // Delete expired key and continue
          await IdempotencyKey.deleteOne({ key: idempotencyKey });
          return next();
        }

        // Return cached response
        const cachedResponse = existingKey.responsePayload;
        res.status(cachedResponse.statusCode || 200).json(cachedResponse.body);
        return;
      } else {
        // Same key but different request - conflict
        logger.warn(`Idempotency key conflict: ${idempotencyKey}`, {
          userId,
          path: req.path,
        });
        res.status(409).json({
          success: false,
          message: 'Idempotency key conflict: same key used for different request',
        });
        return;
      }
    }

    // Key doesn't exist - intercept response to cache it
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode = 200;
    let responseBody: any = null;

    res.status = function (code: number) {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = function (body: any) {
      responseBody = body;

      // Store idempotency key
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_KEY_EXPIRY_HOURS);

      IdempotencyKey.create({
        key: idempotencyKey,
        userId,
        requestHash,
        responsePayload: {
          statusCode,
          body: responseBody,
        },
        expiresAt,
      }).catch((error) => {
        logger.error('Error storing idempotency key:', error);
      });

      return originalJson(body);
    };

    next();
  } catch (error) {
    logger.error('Error in idempotency middleware:', error);
    // Continue on error - don't block request
    next();
  }
};




