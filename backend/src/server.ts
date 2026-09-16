/**
 * @fileoverview Main Express HTTP server for Hotel Finder backend.
 * Configures security middleware, Swagger UI docs, mock suppliers, and mounts application routers.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PORT, ALLOWED_ORIGINS } from './config/env';
import { logger } from './utils/logger';
import { SERVER_CONFIG } from './constants/appConsts';
import { swaggerRouter } from './docs/swaggerRouter';
import { supplierARouter } from './mockSuppliers/supplierA';
import { supplierBRouter } from './mockSuppliers/supplierB';
import { apiRouter } from './routers';
import { rateLimiter } from './middlewares/rateLimiter';
import { BookingRecord } from './mockData/bookings';

// Export BookingRecord interface for existing consumers
export { BookingRecord };

// Initialize Express application instance
const app = express();

// ── Security Middleware ───────────────────────────────────────────────────
// Configure HTTP security headers using Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'http://localhost:3001',
          'http://localhost:3000',
          'http://localhost:5173',
          'https://*.onrender.com',
          'ws:',
        ],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Configure Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: SERVER_CONFIG.CORS_ALLOWED_METHODS,
    allowedHeaders: SERVER_CONFIG.CORS_ALLOWED_HEADERS,
  })
);

// Enable JSON body parsing middleware
app.use(express.json());

// ── Rate Limiting ─────────────────────────────────────────────────────────
app.use(rateLimiter);

// ── Mount Swagger UI Documentation ────────────────────────────────────────
// Mounts /api-docs, /docs, /swagger, /api-docs.json, and /api/v1/swagger.json
app.use(swaggerRouter);

// ── Mock Supplier Routers ─────────────────────────────────────────────────
app.use('/supplierA', supplierARouter);
app.use('/supplierB', supplierBRouter);

// ── Mount Domain API Routers ──────────────────────────────────────────────
app.use(apiRouter);

// ── Server Startup ────────────────────────────────────────────────────────
if (require.main === module || process.argv[1]?.includes('server.ts')) {
  app.listen(PORT, () => {
    logger.info(`Hotel Finder API listening on http://localhost:${PORT}`);
    logger.info(`Swagger UI documentation available at http://localhost:${PORT}/api-docs`);
    logger.info(`Mock Supplier A available at http://localhost:${PORT}/supplierA/hotels`);
    logger.info(`Mock Supplier B available at http://localhost:${PORT}/supplierB/hotels`);
  });
}

export default app;
