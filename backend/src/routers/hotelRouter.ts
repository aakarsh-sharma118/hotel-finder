/**
 * @fileoverview Hotel catalog and inventory routes.
 * Defines REST endpoints for hotel search, catalog browsing, destination validation, and CRUD operations.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module routers/hotelRouter
 */

import { Router } from 'express';
import {
  getCatalogHandler,
  getDestinationsHandler,
  validateDestinationHandler,
  createHotelHandler,
  updateHotelHandler,
  deleteHotelHandler,
} from '../handlers/hotelHandler';

export const hotelRouter = Router();

// Hotel catalog with pagination & price filtering
hotelRouter.get('/api/v1/hotels/catalog', getCatalogHandler);

// Destination discovery endpoints
hotelRouter.get(['/api/v1/hotels/destinations', '/api/v1/destinations'], getDestinationsHandler);

// Destination validation endpoint
hotelRouter.get('/api/v1/destinations/validate', validateDestinationHandler);

// Hotel CRUD operations
hotelRouter.post('/api/v1/hotels', createHotelHandler);
hotelRouter.put('/api/v1/hotels/:hotelId', updateHotelHandler);
hotelRouter.delete('/api/v1/hotels/:hotelId', deleteHotelHandler);
