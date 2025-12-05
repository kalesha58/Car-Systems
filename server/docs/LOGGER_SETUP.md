# Winston Logger Setup Guide

## Overview

The application uses Winston logger for all logging operations. All existing `logger.info()`, `logger.error()`, `logger.warn()`, and `logger.debug()` calls throughout the codebase are automatically using Winston.

## Environment Variables

Add these to your `.env` file:

```env
# Logging Configuration
LOG_LEVEL=info                    # Options: error, warn, info, debug (default: info)
ENABLE_FILE_LOGGING=false         # Enable file logging in development (default: false in dev, true in production)
NODE_ENV=development              # Set to 'production' for production mode
```

### Environment Variable Details

#### `LOG_LEVEL`
- **Default**: `info`
- **Options**: `error`, `warn`, `info`, `debug`
- **Description**: Sets the minimum log level. Only logs at or above this level will be displayed.
  - `error`: Only error messages
  - `warn`: Errors and warnings
  - `info`: Errors, warnings, and info messages (recommended)
  - `debug`: All log levels including debug messages

#### `ENABLE_FILE_LOGGING`
- **Default**: `false` in development, `true` in production
- **Options**: `true`, `false`
- **Description**: 
  - In **development**: Set to `true` if you want log files (optional)
  - In **production**: Automatically enabled (always logs to files)

#### `NODE_ENV`
- **Default**: `development`
- **Options**: `development`, `production`
- **Description**: 
  - `development`: Colorized console output, no file logging by default
  - `production`: JSON console output, file logging enabled automatically

## How It Works

### Development Mode (NODE_ENV=development)
- ✅ **Console logging**: Always enabled with colorized, readable format
- ⚠️ **File logging**: Disabled by default (set `ENABLE_FILE_LOGGING=true` to enable)
- ✅ **Exception/Rejection handling**: Logged to console
- ✅ **All logger calls work**: `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`

### Production Mode (NODE_ENV=production)
- ✅ **Console logging**: Enabled with JSON format
- ✅ **File logging**: Automatically enabled
- ✅ **Exception/Rejection handling**: Logged to both console and files
- ✅ **Log rotation**: Automatic (5MB max, 5 files)

## Log Files

When file logging is enabled, logs are stored in `backend/logs/`:

- `error.log` - Only error level logs
- `combined.log` - All log levels
- `exceptions.log` - Unhandled exceptions
- `rejections.log` - Unhandled promise rejections

## Usage Examples

All existing logger calls work automatically:

```typescript
import { logger } from './utils/logger';

// Info logging
logger.info('Server started');
logger.info('User logged in', { userId: '123' });

// Error logging
logger.error('Database connection failed', error);
logger.error('Error message', { context: 'additional data' });

// Warning logging
logger.warn('SMTP credentials not configured');

// Debug logging (only shown if LOG_LEVEL=debug)
logger.debug('Debug information');
```

## Verification

To verify logging is working:

1. **Start the server**: `npm run dev`
2. **Check console output**: You should see colorized logs in development
3. **Make an API request**: Logs should appear in console
4. **Check log files** (if enabled): `backend/logs/combined.log`

## Example .env Configuration

### Development (Console Only)
```env
NODE_ENV=development
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false
```

### Development (With File Logging)
```env
NODE_ENV=development
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=info
# ENABLE_FILE_LOGGING is automatically true in production
```

## Troubleshooting

### Logs not appearing in console
- Check `LOG_LEVEL` - it might be set too high (e.g., `error` won't show `info` logs)
- Verify `NODE_ENV` is set correctly

### File logs not being created
- In development: Set `ENABLE_FILE_LOGGING=true`
- In production: File logging is automatic
- Check that `backend/logs/` directory exists and is writable

### Too many logs
- Set `LOG_LEVEL=warn` or `LOG_LEVEL=error` to reduce verbosity
- In development, disable file logging: `ENABLE_FILE_LOGGING=false`

## All Logger Calls in Codebase

The logger is used in:
- ✅ `src/index.ts` - Server startup and errors
- ✅ `src/utils/errorHandler.ts` - Error handling
- ✅ `src/controllers/**/*.ts` - All controllers
- ✅ `src/services/**/*.ts` - All services
- ✅ `src/config/**/*.ts` - Configuration files
- ✅ `src/routes/**/*.ts` - Route handlers

All 120+ logger calls throughout the codebase are automatically using Winston.

