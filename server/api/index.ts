import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import app from '../src/index';
import { connectDatabase } from '../src/config/database';

// Handle unhandled promise rejections in serverless environment
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Serverless function handler for Vercel
 * This exports the Express app to be used by Vercel's serverless runtime
 * Database connection is initialized on first request (cached for subsequent requests)
 */
export default async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  // Set VERCEL environment variable for serverless mode
  process.env.VERCEL = '1';

  // Initialize database connection (will use cache if already connected)
  try {
    await connectDatabase();
    
    // Ensure connection is ready before proceeding (critical for concurrent requests)
    if (mongoose.connection.readyState !== 1) {
      const errorMessage = `Database connection not ready. Current state: ${mongoose.connection.readyState}`;
      console.error('Database connection not ready in serverless function:', errorMessage);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          Response: {
            ReturnMessage: 'Database connection is not ready. Please try again in a moment.'
          }
        });
      }
      return;
    }
  } catch (dbError) {
    console.error('Database connection error in serverless function:', dbError);
    // If database connection fails, return error response instead of continuing
    // This prevents the app from crashing with undefined errors
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        Response: {
          ReturnMessage: dbError instanceof Error ? dbError.message : 'Database connection failed. Please try again later.'
        }
      });
    }
    return;
  }

  // Handle the request with Express app
  // Express app handles VercelRequest/VercelResponse automatically
  return app(req as any, res as any);
};

