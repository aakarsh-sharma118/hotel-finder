/**
 * @fileoverview Search and rate comparison routes.
 * Defines REST endpoints for executing parallel supplier rate comparisons, checking status, and cancellation.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module routers/searchRouter
 */

import { Router } from 'express';
import {
  searchHotelsQueryHandler,
  searchHotelsBodyHandler,
  cancelSearchHandler,
  searchStatusHandler,
} from '../handlers/searchHandler';

export const searchRouter = Router();

// Search endpoints (GET query-based and POST body-based)
searchRouter.get('/api/v1/hotels/search', searchHotelsQueryHandler);
searchRouter.post('/api/v1/hotels/search', searchHotelsBodyHandler);
searchRouter.post('/api/search-hotels', searchHotelsBodyHandler);

// Cancel search workflow endpoints
searchRouter.post('/api/v1/hotels/search/:workflowId/cancel', cancelSearchHandler);
searchRouter.post('/api/cancel-search/:workflowId', cancelSearchHandler);

// Search workflow status query endpoints
searchRouter.get('/api/v1/hotels/search/:workflowId', searchStatusHandler);
searchRouter.get('/api/search-status/:workflowId', searchStatusHandler);
