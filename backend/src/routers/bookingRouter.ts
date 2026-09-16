/**
 * @fileoverview Booking management routes.
 * Defines REST endpoints for booking creation, listing, status query, update, and cancellation.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module routers/bookingRouter
 */

import { Router } from 'express';
import {
  getBookingsHandler,
  getBookingByIdHandler,
  createBookingHandler,
  updateBookingHandler,
  cancelBookingHandler,
} from '../handlers/bookingHandler';

export const bookingRouter = Router();

// Bookings endpoints with pagination & CRUD
bookingRouter.get('/api/v1/bookings', getBookingsHandler);
bookingRouter.get('/api/v1/bookings/:bookingId', getBookingByIdHandler);
bookingRouter.post('/api/v1/bookings', createBookingHandler);
bookingRouter.put('/api/v1/bookings/:bookingId', updateBookingHandler);
bookingRouter.delete('/api/v1/bookings/:bookingId', cancelBookingHandler);
