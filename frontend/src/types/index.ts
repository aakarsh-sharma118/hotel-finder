/**
 * @fileoverview Domain and API type definitions for the Hotel Rate Comparator application.
 * Centralized types for hotels, supplier rates, search workflows, reservations, and pagination.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module types
 */

// Basic hotel rate offer from an individual supplier
export interface HotelOffer {
  hotelId: string;
  name: string;
  price: number;
  city?: string;
  supplier?: 'Supplier A' | 'Supplier B';
  stars?: number;
  location?: string;
  image?: string;
}

// Execution status returned for an individual supplier in a workflow
export interface SupplierExecutionStatus {
  status: 'SUCCESS' | 'FAILED' | 'TIMED_OUT' | 'EMPTY';
  count: number;
  error?: string;
}

// Complete card data rendered for each hotel in search results and catalog
export interface HotelCardData {
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
  roomType?: string;
  rating?: number;
  reviewsCount?: number;
}

// Result payload returned by the rate comparison workflow
export interface SearchWorkflowResult {
  success: boolean;
  status: 'SUCCESS' | 'ERROR' | 'NO_HOTELS_FOUND' | 'CANCELLED';
  bestDeal: HotelOffer | null;
  allOffers: HotelOffer[];
  supplierA: SupplierExecutionStatus;
  supplierB: SupplierExecutionStatus;
  workflowId: string;
  city: string;
  checkIn: string;
  checkOut: string;
  message?: string;
  error?: string;
  hotels?: HotelCardData[];
}

// Fault simulation parameters for testing supplier resilience
export interface SupplierSimulation {
  delay?: number;
  status?: number;
  empty?: boolean;
  failCount?: number;
  failKey?: string;
  abort?: boolean;
  priceOverride?: number;
}

// Multi-supplier simulation options
export interface SimulationOptions {
  supplierA?: SupplierSimulation;
  supplierB?: SupplierSimulation;
}

// Parameters supplied to start a rate comparison search
export interface SearchHotelsParams {
  city: string;
  checkIn: string;
  checkOut: string;
  guests?: string;
  workflowId?: string;
  simulations?: SimulationOptions;
  minPrice?: number;
  maxPrice?: number;
}

// Response payload for workflow cancellation request
export interface CancelResponse {
  workflowId: string;
  status: string;
  message: string;
}

// Verified reservation record stored in the backend
export interface BookingRecord {
  id: string;
  hotelId: string;
  hotelName: string;
  city: string;
  supplier: 'SupplierA' | 'SupplierB';
  price: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  specialRequests?: string;
}

// Paginated hotel catalog API response format
export interface HotelCatalogResponse {
  city: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  hotels: HotelCardData[];
}

// Paginated bookings API response format
export interface BookingsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  bookings: BookingRecord[];
}

// Payload submitted when creating a new hotel reservation
export interface CreateBookingPayload {
  hotelId: string;
  hotelName: string;
  city: string;
  supplier: 'SupplierA' | 'SupplierB' | 'Supplier A' | 'Supplier B';
  price: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  specialRequests?: string;
}

// Payload submitted when updating an existing reservation
export interface UpdateBookingPayload {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  specialRequests?: string;
}

// Client-side filtering options
export interface HotelFilterOptions {
  supplierFilter: 'ALL' | 'Supplier A' | 'Supplier B';
  amenityFilter: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  limit: number;
}

// Metadata describing a destination city returned from the backend catalog
export interface DestinationSummary {
  // Name of the destination city
  city: string;
  // Total available hotels in destination
  hotelCount: number;
  // Lowest starting nightly rate in INR
  minPrice: number;
  // Representative hero image URL
  image: string;
  // Flag indicating whether destination is a highlighted popular hub
  popular: boolean;
}

// API response structure when fetching all valid destinations
export interface DestinationsResponse {
  // Array of available destination city objects
  destinations: DestinationSummary[];
  // Total number of destination cities returned
  total: number;
}

