/**
 * @fileoverview Main router aggregator for Hotel Finder API.
 * Combines system, search, hotel catalog, and booking routers into a unified router instance.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module routers
 */

import { Router } from 'express';
import { systemRouter } from './systemRouter';
import { searchRouter } from './searchRouter';
import { hotelRouter } from './hotelRouter';
import { bookingRouter } from './bookingRouter';

export const apiRouter = Router();

// Mount constituent domain routers
apiRouter.use(systemRouter);
apiRouter.use(searchRouter);
apiRouter.use(hotelRouter);
apiRouter.use(bookingRouter);

export { systemRouter, searchRouter, hotelRouter, bookingRouter };
export default apiRouter;
