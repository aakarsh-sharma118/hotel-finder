/**
 * @fileoverview System and administrative routes.
 * Defines endpoints for service landing, health checks, discovery metadata, and test mock state resets.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module routers/systemRouter
 */

import { Router } from 'express';
import {
  rootLandingHandler,
  healthHandler,
  apiCatalogHandler,
  resetMockStateHandler,
  adminResetMockStateHandler,
} from '../handlers/systemHandler';

export const systemRouter = Router();

// Root visual landing dashboard and service discovery
systemRouter.get('/', rootLandingHandler);

// Health check endpoint
systemRouter.get('/health', healthHandler);

// API v1 discovery catalog
systemRouter.get('/api/v1', apiCatalogHandler);

// Reset mock state endpoints
systemRouter.post('/api/reset-mock-state', resetMockStateHandler);
systemRouter.post('/api/v1/admin/reset-mock-state', adminResetMockStateHandler);
