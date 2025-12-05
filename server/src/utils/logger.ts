import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Helper function to get env vars (reads them dynamically)
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// Function to check if we're in a serverless environment
const isServerlessEnvironment = (): boolean => {
  // Check for common serverless environment indicators
  return (
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.VERCEL ||
    !!process.env.NETLIFY ||
    process.cwd() === '/var/task' ||
    process.cwd().startsWith('/var/task')
  );
};

// Function to get the logs directory path
const getLogsDirectory = (): string => {
  if (isServerlessEnvironment()) {
    // In serverless environments, use /tmp (the only writable directory)
    return '/tmp/logs';
  }
  // In regular environments, use logs directory in project root
  return path.join(process.cwd(), 'logs');
};

// Function to safely create logs directory
const ensureLogsDirectory = (logsDir: string): boolean => {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    // Verify the directory is writable
    fs.accessSync(logsDir, fs.constants.W_OK);
    return true;
  } catch (error) {
    // If directory creation fails, log to console and continue without file logging
    console.warn(`Failed to create logs directory at ${logsDir}:`, error);
    return false;
  }
};

// Function to check if file logging should be enabled (reads env vars dynamically)
const shouldEnableFileLogging = (): boolean => {
  const nodeEnv = getEnvVar('NODE_ENV');
  const enableFileLogging = getEnvVar('ENABLE_FILE_LOGGING');
  // In development, file logging is disabled by default unless explicitly enabled
  // In production, file logging is always enabled
  return enableFileLogging === 'true' || nodeEnv === 'production';
};

// Get logs directory and ensure it exists (only if file logging will be enabled)
const logsDir = getLogsDirectory();
const fileLoggingEnabled = shouldEnableFileLogging();
const logsDirAvailable = fileLoggingEnabled ? ensureLogsDirectory(logsDir) : false;

// These will be evaluated when the logger is created
// Reading env vars dynamically to ensure they're loaded
const isDevelopment = getEnvVar('NODE_ENV') !== 'production';

// Define log format for files
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Define console format for development (colorized and readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(), // This handles %s, %d, %j placeholders and multiple arguments
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Handle error stack traces
    if (stack) {
      msg += `\n${stack}`;
    }
    
    // Handle additional metadata (from extra arguments passed to logger)
    // splat formatter should have already combined multiple string arguments into message
    // but we still need to handle objects and errors
    if (Object.keys(meta).length > 0) {
      // Filter out internal winston properties
      const cleanMeta = Object.keys(meta)
        .filter(key => !['service', 'timestamp', 'level', 'message', 'splat', 'Symbol(level)', 'Symbol(message)'].includes(key))
        .reduce((obj, key) => {
          obj[key] = meta[key];
          return obj;
        }, {} as Record<string, any>);
      
      if (Object.keys(cleanMeta).length > 0) {
        // Format additional arguments nicely
        const additionalData = Object.values(cleanMeta);
        if (additionalData.length > 0) {
          additionalData.forEach((data) => {
            if (data instanceof Error) {
              msg += `\n${data.message}`;
              if (data.stack) {
                msg += `\n${data.stack}`;
              }
            } else if (typeof data === 'object' && data !== null) {
              try {
                msg += ` ${JSON.stringify(data)}`;
              } catch (e) {
                msg += ` ${String(data)}`;
              }
            } else if (data !== undefined && data !== null) {
              msg += ` ${String(data)}`;
            }
          });
        }
      }
    }
    
    return msg;
  }),
);

// Define transports array
const transports: winston.transport[] = [];

// Always add console transport (works in both dev and production)
transports.push(
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : logFormat,
    level: getEnvVar('LOG_LEVEL', 'info'),
    handleExceptions: true,
    handleRejections: true,
  }),
);

// Add file transports if enabled and logs directory is available
if (fileLoggingEnabled && logsDirAvailable) {
  // Error log file (only errors)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true,
    }),
  );

  // Combined log file (all levels)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

// Always create exception/rejection log files (even in dev if file logging is enabled)
const exceptionHandlers: winston.transport[] = [];
const rejectionHandlers: winston.transport[] = [];

if (fileLoggingEnabled && logsDirAvailable) {
  exceptionHandlers.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat,
    }),
  );
  
  rejectionHandlers.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat,
    }),
  );
}

// Also log exceptions/rejections to console in development
if (isDevelopment) {
  exceptionHandlers.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
  
  rejectionHandlers.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// Create Winston logger instance
const logger = winston.createLogger({
  level: getEnvVar('LOG_LEVEL', 'info'),
  format: logFormat,
  defaultMeta: { service: 'car-connect-backend' },
  transports,
  exceptionHandlers: exceptionHandlers.length > 0 ? exceptionHandlers : undefined,
  rejectionHandlers: rejectionHandlers.length > 0 ? rejectionHandlers : undefined,
  // Exit on error only in production
  exitOnError: !isDevelopment,
});

export { logger };
