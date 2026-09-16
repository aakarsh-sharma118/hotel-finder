/**
 * @fileoverview Booking management request handlers.
 * Provides endpoints for booking creation, listing, status query, update, and cancellation.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module handlers/bookingHandler
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { VALIDATION_MESSAGES } from '../constants/validation';
import { BACKEND_MESSAGES, VALIDATION_REGEX } from '../constants/appConsts';
import { sanitizeInput, decodeHtmlEntities } from '../utils/utilityManager';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
} from '../mockData/bookings';

/**
 * Handles GET /api/v1/bookings
 * Returns paginated list of all verified reservations.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getBookingsHandler = (req: Request, res: Response): void => {
  // Extract pagination parameters
  const page = req.query.page !== undefined ? Number(req.query.page) : 1;
  const limit = req.query.limit !== undefined ? Number(req.query.limit) : 20;

  const result = getAllBookings({ page, limit });
  res.status(200).json({
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    count: result.bookings.length,
    bookings: result.bookings,
  });
};

/**
 * Handles GET /api/v1/bookings/:bookingId
 * Returns single reservation details by its ID.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getBookingByIdHandler = (req: Request, res: Response): void => {
  const bookingId = String(req.params.bookingId);
  const booking = getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ error: BACKEND_MESSAGES.bookingNotFound(bookingId) });
    return;
  }
  res.status(200).json({ booking });
};

/**
 * Handles POST /api/v1/bookings
 * Validates guest contact details and confirms a new hotel reservation.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const createBookingHandler = (req: Request, res: Response): void => {
  const {
    hotelId,
    hotelName,
    city,
    supplier,
    price,
    guestName,
    guestEmail,
    guestPhone,
    checkIn,
    checkOut,
    guests,
    specialRequests,
  } = req.body;

  // Sanitize input values
  const cleanName = sanitizeInput(String(guestName || ''));
  const cleanEmail = sanitizeInput(String(guestEmail || ''));
  const cleanPhone = sanitizeInput(String(guestPhone || ''));
  const cleanCity = sanitizeInput(String(city || ''));

  // Validate user contact fields
  if (!cleanName || !VALIDATION_REGEX.name.test(cleanName)) {
    res.status(400).json({ error: VALIDATION_MESSAGES.nameInvalid });
    return;
  }
  if (!cleanEmail || !VALIDATION_REGEX.email.test(cleanEmail)) {
    res.status(400).json({ error: VALIDATION_MESSAGES.emailInvalid });
    return;
  }
  if (!cleanPhone || !VALIDATION_REGEX.phone.test(cleanPhone)) {
    res.status(400).json({ error: VALIDATION_MESSAGES.phoneInvalid });
    return;
  }

  // Create new reservation record
  const newBooking = createBooking({
    hotelId: sanitizeInput(String(hotelId || 'HTL-GEN')),
    hotelName: decodeHtmlEntities(String(hotelName || 'Verified Hotel')),
    city: cleanCity || 'Meerut',
    supplier: supplier === 'SupplierB' ? 'SupplierB' : 'SupplierA',
    price: Number(price) || 2500,
    guestName: cleanName,
    guestEmail: cleanEmail,
    guestPhone: cleanPhone,
    checkIn: sanitizeInput(String(checkIn || '')),
    checkOut: sanitizeInput(String(checkOut || '')),
    guests: sanitizeInput(String(guests || '2 Adults')),
    specialRequests: specialRequests ? sanitizeInput(String(specialRequests)) : undefined,
  });

  logger.info(`Confirmed new booking: ${newBooking.id} for ${newBooking.guestName}`);
  res.status(201).json({
    message: BACKEND_MESSAGES.bookingConfirmed,
    booking: newBooking,
  });
};

/**
 * Handles PUT /api/v1/bookings/:bookingId
 * Updates guest information or stay dates on an existing reservation.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const updateBookingHandler = (req: Request, res: Response): void => {
  const bookingId = String(req.params.bookingId);
  const updated = updateBooking(bookingId, req.body);
  if (!updated) {
    res.status(404).json({ error: BACKEND_MESSAGES.bookingNotFound(bookingId) });
    return;
  }
  res.status(200).json({ message: 'Reservation updated successfully', booking: updated });
};

/**
 * Handles DELETE /api/v1/bookings/:bookingId
 * Cancels an existing reservation.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const cancelBookingHandler = (req: Request, res: Response): void => {
  const bookingId = String(req.params.bookingId);
  const cancelled = cancelBooking(bookingId);
  if (!cancelled) {
    res.status(404).json({ error: BACKEND_MESSAGES.bookingNotFound(bookingId) });
    return;
  }
  logger.info(`Cancelled booking: ${bookingId}`);
  res.status(200).json({ message: BACKEND_MESSAGES.bookingCancelled(bookingId), booking: cancelled });
};
