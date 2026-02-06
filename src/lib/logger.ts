/**
 * Environment-aware logging utility.
 * In production, detailed error logging is suppressed to prevent information leakage.
 * In development, full error details are logged to the console for debugging.
 */
export const logger = {
  error: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.error(message, data);
    }
    // In production, could send to an external logging service
  },
  warn: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.warn(message, data);
    }
  },
  info: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.info(message, data);
    }
  },
};
