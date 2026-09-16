/**
 * @fileoverview Hotel catalog and inventory request handlers.
 * Provides endpoints for hotel catalog retrieval, price filtering, pagination, destination validation, and hotel CRUD.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module handlers/hotelHandler
 */

import { Request, Response } from 'express';
import { sanitizeInput } from '../utils/utilityManager';
import {
  getHotelsByCity,
  addCustomHotel,
  updateHotel,
  deleteHotel,
  getDestinationsList,
  validateDestination,
} from '../mockData/hotels';

/**
 * Handles GET /api/v1/hotels/catalog
 * Returns paginated hotel inventory with optional city and price range filtering.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getCatalogHandler = (req: Request, res: Response): void => {
  // Extract destination city or allow empty string to return all destinations
  const rawCity = sanitizeInput(String(req.query.city || ''));
  const sanitizedCity = rawCity.substring(0, 80);

  // Extract optional price range and pagination parameters
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
  const page = req.query.page !== undefined ? Number(req.query.page) : 1;
  const limit = req.query.limit !== undefined ? Number(req.query.limit) : 200;

  // Retrieve matching hotels from mock database (all hotels if city is empty)
  const result = getHotelsByCity(sanitizedCity, {
    minPrice,
    maxPrice,
    page,
    limit,
  });

  res.status(200).json({
    city: result.city,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    count: result.hotels.length,
    hotels: result.hotels,
  });
};

/**
 * Handles GET /api/v1/hotels/destinations and GET /api/v1/destinations
 * Returns aggregated list of all destinations with hotel counts and starting rates.
 *
 * @param _req - Express request
 * @param res - Express response
 */
export const getDestinationsHandler = (_req: Request, res: Response): void => {
  // Retrieve aggregated destination list from in-memory catalog
  const destinations = getDestinationsList();

  // Return list with total destination count
  res.status(200).json({
    destinations,
    total: destinations.length,
  });
};

/**
 * Handles GET /api/v1/destinations/validate
 * Validates whether a given destination city exists in the catalog and returns its canonical name.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const validateDestinationHandler = (req: Request, res: Response): void => {
  // Extract and sanitize query city parameter
  const rawCity = sanitizeInput(String(req.query.city || ''));

  // Validate destination against available catalog
  const result = validateDestination(rawCity);

  res.status(200).json({
    city: rawCity,
    valid: result.valid,
    normalizedCity: result.normalizedCity,
  });
};

/**
 * Handles POST /api/v1/hotels
 * Creates a new custom hotel in the in-memory catalog.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const createHotelHandler = (req: Request, res: Response): void => {
  const { name, city, stars, location, rateA, rateB, amenities, roomType, image } = req.body;

  // Basic validation
  if (!name || !city || !location || !rateA || !rateB) {
    res.status(400).json({ error: 'Name, city, location, rateA, and rateB are required' });
    return;
  }

  const newHotel = addCustomHotel({
    name: sanitizeInput(String(name)),
    city: sanitizeInput(String(city)),
    stars: Number(stars) || 4,
    location: sanitizeInput(String(location)),
    rateA: Number(rateA),
    rateB: Number(rateB),
    amenities: Array.isArray(amenities) ? amenities : ['Free High-Speed WiFi'],
    roomType: sanitizeInput(String(roomType || 'Standard Deluxe')),
    image: image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    rating: 4.5,
    reviewsCount: 1,
  });

  res.status(201).json({ message: 'Hotel added successfully', hotel: newHotel });
};

/**
 * Handles PUT /api/v1/hotels/:hotelId
 * Updates an existing hotel's rates or details.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const updateHotelHandler = (req: Request, res: Response): void => {
  const hotelId = String(req.params.hotelId);
  const updated = updateHotel(hotelId, req.body);
  if (!updated) {
    res.status(404).json({ error: `Hotel ${hotelId} not found` });
    return;
  }
  res.status(200).json({ message: 'Hotel updated successfully', hotel: updated });
};

/**
 * Handles DELETE /api/v1/hotels/:hotelId
 * Removes a hotel from the catalog.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const deleteHotelHandler = (req: Request, res: Response): void => {
  const hotelId = String(req.params.hotelId);
  const deleted = deleteHotel(hotelId);
  if (!deleted) {
    res.status(404).json({ error: `Hotel ${hotelId} not found` });
    return;
  }
  res.status(200).json({ message: `Hotel ${hotelId} removed successfully` });
};
