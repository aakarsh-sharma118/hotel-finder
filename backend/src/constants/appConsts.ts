/**
 * @fileoverview Backend constants, regular expressions, and configuration values.
 * Centralized constant definitions used across controllers, routes, and workflows.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module constants/appConsts
 */

import { PORT, ALLOWED_ORIGINS } from '../config/env';
import { getHotelsByCity, MockHotel } from '../mockData/hotels';

// Hotel catalog item structure shared across backend and frontend
export interface HotelCatalogItem {
  hotelId: string;
  name: string;
  stars: number;
  location: string;
  rateA: number;
  rateB: number;
  cheaperSupplier: 'Supplier A' | 'Supplier B';
  price: number;
  savings: number;
  image: string;
  amenities: string[];
  rating?: number;
  reviewsCount?: number;
}

// Server configuration settings and network constraints
export const SERVER_CONFIG = {
  // Default HTTP port
  DEFAULT_PORT: PORT,
  // Time window for rate limiting in milliseconds (1 minute)
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  // Maximum requests permitted per IP inside the rate limit window
  MAX_REQUESTS_PER_WINDOW: 150,
  // Activity timeout SLA limit in milliseconds (5 seconds)
  DEFAULT_ACTIVITY_TIMEOUT_MS: 5000,
  // Connection timeout when reaching Temporal server
  TEMPORAL_CONNECT_TIMEOUT: '1500ms' as const,
  // Default local Temporal server address
  DEFAULT_TEMPORAL_ADDRESS: '127.0.0.1:7233',
  // Maximum retry attempts when connecting to Temporal
  MAX_TEMPORAL_CONNECT_ATTEMPTS: 5,
  // Task queue name for rate comparator workflows
  TASK_QUEUE_NAME: 'hotel-finder',
  // Permitted origins for CORS middleware
  CORS_ALLOWED_ORIGINS: ALLOWED_ORIGINS,
  // Permitted HTTP methods
  CORS_ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as string[],
  // Permitted request headers
  CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
};

// API catalog metadata describing all available endpoints
export const API_CATALOG_DATA = {
  service: 'Hotel Finder API',
  version: 'v1',
  description: 'Hotel rate aggregation and verified reservations engine',
  author: 'Aakarsh Sharma',
  endpoints: {
    swaggerDocs: 'GET /api-docs',
    swaggerJson: 'GET /api-docs.json',
    health: 'GET /health',
    catalog: 'GET /api/v1/hotels/catalog?city=...&page=...&limit=...&minPrice=...&maxPrice=...',
    createHotel: 'POST /api/v1/hotels',
    updateHotel: 'PUT /api/v1/hotels/:hotelId',
    deleteHotel: 'DELETE /api/v1/hotels/:hotelId',
    searchHotelsQuery: 'GET /api/v1/hotels/search?city=...&checkIn=...&checkOut=...',
    searchHotelsBody: 'POST /api/v1/hotels/search',
    searchStatus: 'GET /api/v1/hotels/search/:workflowId',
    cancelSearch: 'POST /api/v1/hotels/search/:workflowId/cancel',
    listBookings: 'GET /api/v1/bookings?page=...&limit=...',
    getBooking: 'GET /api/v1/bookings/:bookingId',
    createBooking: 'POST /api/v1/bookings',
    updateBooking: 'PUT /api/v1/bookings/:bookingId',
    cancelBooking: 'DELETE /api/v1/bookings/:bookingId',
    resetState: 'POST /api/v1/admin/reset-mock-state',
    supplierA: 'GET /supplierA/hotels?city=...',
    supplierB: 'GET /supplierB/hotels?city=...',
  },
};

// Standardized response and error messages
export const BACKEND_MESSAGES = {
  rateLimitExceeded: 'Too many requests. Please try again later.',
  missingParameters:
    'Missing or invalid required parameters: valid city, checkIn, and checkOut are mandatory.',
  searchStarted: 'Hotel comparison workflow triggered successfully',
  searchCancelled: 'Search workflow was cancelled by user',
  searchFailed: 'Failed to complete hotel rate comparison workflow',
  supplierResetSuccess:
    'All supplier transient state counters and reservations reset successfully',
  mockStateResetSuccess: 'All supplier transient state counters reset successfully',
  bookingConfirmed: 'Booking confirmed successfully',
  bookingCancelled: (id: string) => `Reservation ${id} cancelled successfully`,
  bookingNotFound: (id: string) => `Reservation ${id} not found`,
};

// Regular expression patterns for input validation and sanitization
export const VALIDATION_REGEX = {
  // Destination city validation pattern
  city: /^[a-zA-Z\s,.-]{2,80}$/,
  // Guest name validation pattern
  name: /^[a-zA-Z\u00C0-\u024F\s.'-]{2,60}$/,
  // Standard email format validation pattern
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Phone number format validation pattern
  phone: /^[0-9+\s()-]{7,20}$/,
  // YYYY-MM-DD date format validation pattern
  date: /^\d{4}-\d{2}-\d{2}$/,
};

// List of recognized cities across Indian destinations
export const RECOGNIZED_CITIES = [
  'meerut',
  'goa',
  'mumbai',
  'delhi',
  'new delhi',
  'bengaluru',
  'bangalore',
  'jaipur',
  'udaipur',
  'agra',
  'manali',
  'kochi',
  'cochin',
  'kerala',
  'varanasi',
  'amritsar',
  'kolkata',
  'chennai',
  'hyderabad',
  'pune',
  'chandigarh',
  'shimla',
  'rishikesh',
  'lucknow',
  'paris',
  'london',
  'new york',
  'tokyo',
  'dubai',
];

/**
 * Check if a city is recognized by the system.
 *
 * @param city - City name string
 * @returns True if city is in recognized list
 */
export function isCityRecognized(city: string): boolean {
  if (!city) return false;
  const lower = city.trim().toLowerCase();
  return RECOGNIZED_CITIES.some((c) => lower === c || lower.includes(c) || c.includes(lower));
}

/**
 * Retrieve hotels for destination city with price modifiers.
 * Compatible with existing workflow and router implementations.
 *
 * @param city - Destination city name
 * @param priceModifier - Optional price overrides from search workflow
 * @returns Array of hotel catalog items
 */
export function getBackendHotelsForCity(
  city: string,
  priceModifier?: { bestPrice?: number; isSupplierACheaper?: boolean; winningHotelName?: string }
): HotelCatalogItem[] {
  const normalizedCity = city.trim();
  const lowerCity = normalizedCity.toLowerCase();

  // Return empty list if explicitly unknown or test empty destination
  if (
    lowerCity === 'atlantiscity' ||
    lowerCity === 'emptycity' ||
    lowerCity === 'nowhere' ||
    !isCityRecognized(normalizedCity)
  ) {
    return [];
  }

  // Retrieve matching hotels from mock database
  const result = getHotelsByCity(normalizedCity, {
    limit: 50,
    priceModifier,
  });

  return result.hotels.map((h: MockHotel) => ({
    hotelId: h.hotelId,
    name: h.name,
    stars: h.stars,
    location: h.location,
    rateA: h.rateA,
    rateB: h.rateB,
    cheaperSupplier: h.cheaperSupplier,
    price: h.price,
    savings: h.savings,
    image: h.image,
    amenities: h.amenities,
    rating: h.rating,
    reviewsCount: h.reviewsCount,
  }));
}
