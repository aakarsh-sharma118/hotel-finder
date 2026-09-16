/**
 * @fileoverview Rate limiting middleware for Hotel Finder Express backend.
 * Provides in-memory sliding window rate limiting based on client IP addresses.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module middlewares/rateLimiter
 */

import { Request, Response, NextFunction } from 'express';
import { SERVER_CONFIG, BACKEND_MESSAGES } from '../constants/appConsts';

// Map tracking request counts and reset timestamps per client IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Sliding window rate limiting middleware.
 * Inspects incoming client IP address and enforces request quotas defined in SERVER_CONFIG.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // Extract client IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + SERVER_CONFIG.RATE_LIMIT_WINDOW_MS };

  // Check if rate limiting window has expired
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + SERVER_CONFIG.RATE_LIMIT_WINDOW_MS;
  } else {
    entry.count += 1;
  }

  rateLimitMap.set(ip, entry);

  // Return 429 if rate limit exceeded
  if (entry.count > SERVER_CONFIG.MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: BACKEND_MESSAGES.rateLimitExceeded });
    return;
  }

  next();
};
