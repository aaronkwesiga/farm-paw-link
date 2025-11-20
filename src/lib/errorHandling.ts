/**
 * Centralized error handling utility for the VetConnect application.
 * Maps error codes to user-friendly messages while logging full details for debugging.
 */

// Common Supabase PostgreSQL error codes
const ERROR_CODE_MAP: Record<string, string> = {
  // PostgreSQL constraint violations
  '23503': 'Related information not found. Please check your selection.',
  '23505': 'This entry already exists. Please use a different value.',
  '23514': 'Invalid data provided. Please check your input.',
  
  // Supabase-specific errors
  'PGRST116': 'No matching records found.',
  'PGRST301': 'Invalid request format.',
  
  // Auth errors
  'invalid_grant': 'Invalid credentials. Please check your email and password.',
  'invalid_credentials': 'Invalid credentials. Please check your email and password.',
  'email_exists': 'An account with this email already exists.',
  'weak_password': 'Password is too weak. Please use a stronger password.',
  'user_not_found': 'No account found with this email.',
  'invalid_otp': 'Invalid verification code. Please try again.',
  'otp_expired': 'Verification code has expired. Please request a new one.',
  'email_not_confirmed': 'Please verify your email address before logging in.',
  
  // Storage errors
  'storage/object-not-found': 'File not found.',
  'storage/unauthorized': 'You do not have permission to access this file.',
  'storage/invalid-argument': 'Invalid file format or size.',
};

// Generic error messages by category
const GENERIC_MESSAGES: Record<string, string> = {
  auth: 'Authentication failed. Please try again or contact support.',
  database: 'Unable to process your request. Please try again.',
  storage: 'File operation failed. Please try again.',
  network: 'Connection error. Please check your internet connection.',
  validation: 'Invalid input. Please check your information.',
  default: 'An unexpected error occurred. Please try again or contact support.',
};

/**
 * Determines the error category from the error object
 */
function getErrorCategory(error: any): keyof typeof GENERIC_MESSAGES {
  // Check for auth-related errors
  if (error?.name === 'AuthError' || error?.status === 401 || error?.status === 403) {
    return 'auth';
  }
  
  // Check for storage errors
  if (error?.message?.includes('storage') || error?.code?.includes('storage')) {
    return 'storage';
  }
  
  // Check for network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return 'network';
  }
  
  // Check for validation errors
  if (error?.name === 'ZodError' || error?.code?.includes('validation')) {
    return 'validation';
  }
  
  // Check for database errors (PostgreSQL error codes start with numbers)
  if (error?.code && /^\d{5}$/.test(error.code)) {
    return 'database';
  }
  
  return 'default';
}

/**
 * Converts an error into a user-friendly message.
 * Logs the full error details for server-side debugging.
 * 
 * @param error - The error object from a try-catch block
 * @param context - Optional context about where the error occurred (e.g., 'login', 'profile update')
 * @returns A user-friendly error message
 */
export function getUserFriendlyError(error: any, context?: string): string {
  // Log the full error for debugging (in production, this should go to a logging service)
  const errorLog = {
    timestamp: new Date().toISOString(),
    context: context || 'unknown',
    error: {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      status: error?.status,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    },
  };
  
  console.error('Application error:', errorLog);
  
  // Return early for null/undefined
  if (!error) {
    return GENERIC_MESSAGES.default;
  }
  
  // Check if we have a specific mapping for the error code
  if (error.code && ERROR_CODE_MAP[error.code]) {
    return ERROR_CODE_MAP[error.code];
  }
  
  // Check if the error message itself contains a known error code
  const errorMessage = error.message?.toLowerCase() || '';
  for (const [code, message] of Object.entries(ERROR_CODE_MAP)) {
    if (errorMessage.includes(code.toLowerCase())) {
      return message;
    }
  }
  
  // Return a generic message based on error category
  const category = getErrorCategory(error);
  return GENERIC_MESSAGES[category];
}

/**
 * Helper function for handling validation errors from Zod
 */
export function getValidationError(error: any): string {
  if (error?.issues && Array.isArray(error.issues)) {
    // Return the first validation error message
    return error.issues[0]?.message || GENERIC_MESSAGES.validation;
  }
  return GENERIC_MESSAGES.validation;
}
