/**
 * @fileoverview Structured logging utility for backend services.
 * Formats log messages with timestamps and log levels.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module utils/logger
 */

import { IS_PRODUCTION } from '../config/env';

// Type definition for arbitrary metadata passed to log functions
export type LogMeta = Record<string, unknown> | Error | unknown;

// Helper to format ISO timestamp string
const getTimestamp = (): string => new Date().toISOString();

// Helper to format metadata into string
const formatMeta = (meta?: LogMeta): string => {
  // Return empty string if no metadata provided
  if (!meta) return '';
  // If error instance, format stack or message
  if (meta instanceof Error) {
    return `\n${meta.stack || meta.message}`;
  }
  // Otherwise serialize object to JSON string
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` [Circular or Non-serializable Metadata]`;
  }
};

export const logger = {
  /**
   * Log informational message.
   * Used for normal operations such as server start, workflow start, or booking created.
   *
   * @param message - Main log message text
   * @param meta - Optional extra data or object
   */
  info: (message: string, meta?: LogMeta): void => {
    // Print timestamp, level badge, message, and metadata
    console.log(`[${getTimestamp()}] [INFO] ${message}${formatMeta(meta)}`);
  },

  /**
   * Log warning message.
   * Used for non-critical issues like fallback triggering or retries.
   *
   * @param message - Main log message text
   * @param meta - Optional extra data or object
   */
  warn: (message: string, meta?: LogMeta): void => {
    // Print timestamp, warning badge, message, and metadata
    console.warn(`[${getTimestamp()}] [WARN] ${message}${formatMeta(meta)}`);
  },

  /**
   * Log error message.
   * Used when an operation fails, an exception occurs, or a route errors.
   *
   * @param message - Main log message text
   * @param meta - Optional error object or context data
   */
  error: (message: string, meta?: LogMeta): void => {
    // Print timestamp, error badge, message, and error details
    console.error(`[${getTimestamp()}] [ERROR] ${message}${formatMeta(meta)}`);
  },

  /**
   * Log debug message.
   * Only active during local development to inspect detailed parameters.
   *
   * @param message - Main log message text
   * @param meta - Optional debug data
   */
  debug: (message: string, meta?: LogMeta): void => {
    // Skip debug output when running in production mode
    if (IS_PRODUCTION) return;
    // Print timestamp, debug badge, message, and metadata
    console.log(`[${getTimestamp()}] [DEBUG] ${message}${formatMeta(meta)}`);
  },
};
