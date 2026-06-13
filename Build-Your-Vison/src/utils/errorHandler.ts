/**
 * Error Handler Utility
 * Extracts error messages from API error responses
 */

/**
 * Extracts error message from API error response
 * Handles different error response formats:
 * - { success: false, Response: { ReturnMessage: "..." } }
 * - { success: false, ReturnMessage: "..." }
 * - { message: "..." }
 * - { error: { message: "..." } }
 * - { error: "..." }
 */
export const extractErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (!error) {
    return defaultMessage;
  }

  // Check for response data
  if (error?.response?.data) {
    const responseData = error.response.data;

    // Check for ReturnMessage in Response object (primary format)
    if (responseData.Response?.ReturnMessage) {
      return responseData.Response.ReturnMessage;
    }

    // Check for ReturnMessage directly
    if (responseData.ReturnMessage) {
      return responseData.ReturnMessage;
    }

    // Check for message in Response object
    if (responseData.Response?.message) {
      return responseData.Response.message;
    }

    // Check for message directly
    if (responseData.message) {
      return responseData.message;
    }

    // Check for error object with message
    if (responseData.error?.message) {
      return responseData.error.message;
    }

    // Check for error string
    if (typeof responseData.error === 'string') {
      return responseData.error;
    }
  }

  // Check for direct error message
  if (error?.message) {
    return error.message;
  }

  // Return default message if no error message found
  return defaultMessage;
};

