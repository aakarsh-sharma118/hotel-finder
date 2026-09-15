/**
 * @fileoverview HTTP API client wrapping REST endpoints for hotel rate comparisons.
 * Provides client methods for fetching catalogs, comparing rates, and managing reservations.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module api/hotelApi
 */

import axios from 'axios';
import {
  SearchHotelsParams,
  SearchWorkflowResult,
  CancelResponse,
  HotelCatalogResponse,
  BookingsResponse,
  BookingRecord,
  CreateBookingPayload,
  UpdateBookingPayload,
  DestinationsResponse,
} from '../types';

/**
 * Dynamically resolves the backend API base URL from environment variables:
 * - VITE_API_BASE_URL (standard)
 * - VITE_API_URL (alias)
 * - Defaults to empty string for relative proxying in dev or same-origin deployment
 */
export const getApiBaseUrl = (): string => {
  const env = (import.meta as any).env;
  const configured = env?.VITE_API_BASE_URL || env?.VITE_API_URL;
  if (configured && typeof configured === 'string') {
    return configured.trim().replace(/\/+$/, '');
  }
  return '';
};

export const API_BASE = getApiBaseUrl();

/**
 * Dynamically resolves the Swagger API documentation URL.
 * Appends /api-docs/ to configured backend base URL in production,
 * or defaults to relative /api-docs in local development.
 */
export const getApiDocsUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}/api-docs/` : '/api-docs';
};

// Axios client instance with standard configuration
export const hotelApiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const hotelApi = {
  /**
   * Fetch hotel catalog for a destination city with optional pagination and price filtering.
   *
   * @param city - Target city name
   * @param options - Pagination and price range parameters
   * @returns Paginated catalog response with hotel cards
   */
  getHotelCatalog: async (
    city: string = '',
    options?: { page?: number; limit?: number; minPrice?: number; maxPrice?: number }
  ): Promise<HotelCatalogResponse> => {
    const response = await hotelApiClient.get<HotelCatalogResponse>('/api/v1/hotels/catalog', {
      params: {
        city: city.trim(),
        page: options?.page || 1,
        limit: options?.limit || 200,
        minPrice: options?.minPrice,
        maxPrice: options?.maxPrice,
      },
    });
    return response.data;
  },

  /**
   * Execute real-time multi-supplier rate comparison search.
   *
   * @param params - Search parameters including city, dates, and optional simulations
   * @returns Completed rate comparison result
   */
  searchHotels: async (params: SearchHotelsParams): Promise<SearchWorkflowResult> => {
    // If simulations requested, submit via POST
    if (params.simulations) {
      const response = await hotelApiClient.post<SearchWorkflowResult>('/api/v1/hotels/search', params);
      return response.data;
    }

    // Otherwise submit via GET query parameters
    const response = await hotelApiClient.get<SearchWorkflowResult>('/api/v1/hotels/search', {
      params: {
        city: params.city,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
      },
    });
    return response.data;
  },

  /**
   * Cancel an in-progress rate comparison search workflow.
   *
   * @param workflowId - Workflow execution identifier
   * @returns Cancellation response status
   */
  cancelSearch: async (workflowId: string): Promise<CancelResponse> => {
    const response = await hotelApiClient.post<CancelResponse>(`/api/v1/hotels/search/${workflowId}/cancel`);
    return response.data;
  },

  /**
   * Query status of an in-progress workflow.
   *
   * @param workflowId - Workflow execution identifier
   */
  getSearchStatus: async (workflowId: string) => {
    const response = await hotelApiClient.get(`/api/v1/hotels/search/${workflowId}`);
    return response.data;
  },

  /**
   * Retrieve all confirmed bookings with pagination.
   *
   * @param options - Optional page and limit parameters
   * @returns Paginated bookings list
   */
  getBookings: async (options?: { page?: number; limit?: number }): Promise<BookingsResponse> => {
    const response = await hotelApiClient.get<BookingsResponse>('/api/v1/bookings', {
      params: options,
    });
    return response.data;
  },

  /**
   * Retrieve a single booking by ID.
   *
   * @param bookingId - Reservation reference code
   * @returns Booking record
   */
  getBookingById: async (bookingId: string): Promise<{ booking: BookingRecord }> => {
    const response = await hotelApiClient.get<{ booking: BookingRecord }>(`/api/v1/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Create a new confirmed hotel reservation.
   *
   * @param bookingData - Guest and hotel reservation details
   */
  createBooking: async (bookingData: CreateBookingPayload): Promise<{ message: string; booking: BookingRecord }> => {
    const response = await hotelApiClient.post<{ message: string; booking: BookingRecord }>(
      '/api/v1/bookings',
      bookingData
    );
    return response.data;
  },

  /**
   * Update an existing hotel reservation.
   *
   * @param bookingId - Reservation reference code
   * @param updates - Updates to dates, guests, or special requests
   */
  updateBooking: async (
    bookingId: string,
    updates: UpdateBookingPayload
  ): Promise<{ message: string; booking: BookingRecord }> => {
    const response = await hotelApiClient.put<{ message: string; booking: BookingRecord }>(
      `/api/v1/bookings/${bookingId}`,
      updates
    );
    return response.data;
  },

  /**
   * Cancel an existing reservation.
   *
   * @param bookingId - Reservation reference code
   */
  cancelBooking: async (bookingId: string): Promise<{ message: string; booking: BookingRecord }> => {
    const response = await hotelApiClient.delete<{ message: string; booking: BookingRecord }>(
      `/api/v1/bookings/${bookingId}`
    );
    return response.data;
  },

  /**
   * Fetch all valid destination cities supported by the backend catalog.
   *
   * @returns Array of destination summaries with hotel counts and min prices
   */
  getDestinations: async (): Promise<DestinationsResponse> => {
    const response = await hotelApiClient.get<DestinationsResponse>('/api/v1/hotels/destinations');
    return response.data;
  },

  /**
   * Validate destination name against available catalog inventory.
   *
   * @param city - City search term or name
   * @returns Validation outcome with normalized city
   */
  validateDestination: async (
    city: string
  ): Promise<{ city: string; valid: boolean; normalizedCity?: string }> => {
    const response = await hotelApiClient.get<{
      city: string;
      valid: boolean;
      normalizedCity?: string;
    }>('/api/v1/destinations/validate', { params: { city } });
    return response.data;
  },
};
