/**
 * @fileoverview TanStack Query custom hooks for managing server state.
 * Handles data fetching, caching, deduplication, and cache invalidation for hotels and bookings.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module hooks/useHotelQueries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelApi } from '../api/hotelApi';
import {
  HotelCatalogResponse,
  BookingsResponse,
  BookingRecord,
  CreateBookingPayload,
  UpdateBookingPayload,
  SearchHotelsParams,
  SearchWorkflowResult,
  DestinationsResponse,
} from '../types';

/**
 * Custom hook to fetch all valid destination cities from the backend catalog.
 *
 * @returns TanStack Query result object with destination summary data
 */
export function useDestinationsQuery() {
  return useQuery<DestinationsResponse, Error>({
    queryKey: ['destinations'],
    queryFn: () => hotelApi.getDestinations(),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

/**
 * Custom hook to fetch and cache destination hotel catalog with pagination and price filtering.
 *
 * @param city - Destination city name
 * @param options - Pagination and price range parameters
 * @returns TanStack Query result object with catalog data
 */
export function useHotelCatalogQuery(
  city: string = '',
  options?: { page?: number; limit?: number; minPrice?: number; maxPrice?: number }
) {
  // Allow empty city string to query all destinations across India
  const targetCity = city.trim();
  const page = options?.page || 1;
  const limit = options?.limit || 200;
  const minPrice = options?.minPrice;
  const maxPrice = options?.maxPrice;

  return useQuery<HotelCatalogResponse, Error>({
    queryKey: ['hotelCatalog', targetCity, page, limit, minPrice, maxPrice],
    queryFn: () => hotelApi.getHotelCatalog(targetCity, { page, limit, minPrice, maxPrice }),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Custom hook to fetch confirmed reservations with pagination.
 *
 * @param options - Optional page and limit parameters
 * @returns TanStack Query result object with bookings data
 */
export function useBookingsQuery(options?: { page?: number; limit?: number }) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  return useQuery<BookingsResponse, Error>({
    queryKey: ['bookings', page, limit],
    queryFn: () => hotelApi.getBookings({ page, limit }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Custom mutation hook to submit and confirm a new hotel booking.
 * Automatically invalidates the bookings cache on success.
 */
export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; booking: BookingRecord }, Error, CreateBookingPayload>({
    mutationFn: (payload: CreateBookingPayload) => hotelApi.createBooking(payload),
    onSuccess: () => {
      // Invalidate bookings query cache so lists refresh with fresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Custom mutation hook to update an existing reservation.
 * Automatically invalidates the bookings cache on success.
 */
export function useUpdateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; booking: BookingRecord },
    Error,
    { bookingId: string; updates: UpdateBookingPayload }
  >({
    mutationFn: ({ bookingId, updates }) => hotelApi.updateBooking(bookingId, updates),
    onSuccess: () => {
      // Refresh active bookings list
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Custom mutation hook to cancel an existing reservation.
 * Automatically invalidates the bookings cache on success.
 */
export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; booking: BookingRecord }, Error, string>({
    mutationFn: (bookingId: string) => hotelApi.cancelBooking(bookingId),
    onSuccess: () => {
      // Refresh active bookings list
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Custom mutation hook to execute a multi-supplier rate comparison search.
 */
export function useHotelSearchMutation() {
  return useMutation<SearchWorkflowResult, Error, SearchHotelsParams>({
    mutationFn: (params: SearchHotelsParams) => hotelApi.searchHotels(params),
  });
}
