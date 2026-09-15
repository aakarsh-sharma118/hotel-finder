/**
 * @fileoverview Persistent reservations database backed by local JSON file storage.
 * Synchronizes in-memory reservations with disk storage to maintain state across restarts.
 * Provides CRUD functions, PII masking for privacy compliance, and pagination helpers.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module mockData/bookings
 */

import fs from 'fs';
import path from 'path';
import { generateBookingId } from '../utils/utilityManager';
import { logger } from '../utils/logger';

// ─── Storage File Path ────────────────────────────────────────────────────────
// Resolve the data folder relative to module root for deterministic persistence
const DATA_DIR = path.resolve(__dirname, '../../data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// ─── BookingRecord Interface ──────────────────────────────────────────────────

// Data model representing a confirmed hotel reservation record
export interface BookingRecord {
  // Unique booking reference identifier
  id: string;
  // Associated hotel identifier
  hotelId: string;
  // Full hotel property name
  hotelName: string;
  // Destination city name
  city: string;
  // Supplier from which rate was secured
  supplier: 'SupplierA' | 'SupplierB';
  // Final booked price per night in INR
  price: number;
  // Guest full name
  guestName: string;
  // Guest email address
  guestEmail: string;
  // Guest contact phone number
  guestPhone: string;
  // Check-in date in YYYY-MM-DD format
  checkIn: string;
  // Check-out date in YYYY-MM-DD format
  checkOut: string;
  // Guest occupancy details
  guests: string;
  // Current reservation status
  status: 'CONFIRMED' | 'CANCELLED';
  // ISO timestamp of booking creation
  createdAt: string;
  // Optional special requests or notes from the guest
  specialRequests?: string;
}

// ─── File I/O Helpers ─────────────────────────────────────────────────────────

/**
 * Read the bookings array from disk.
 * If the file doesn't exist yet it returns an empty array.
 */
function readFromDisk(): BookingRecord[] {
  try {
    // Create the data directory if it is missing
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // If the file doesn't exist yet, treat it as empty
    if (!fs.existsSync(BOOKINGS_FILE)) {
      return [];
    }
    // Parse and return the stored JSON
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(raw) as BookingRecord[];
  } catch {
    // If anything goes wrong (corrupt file, permissions, etc.) start fresh
    return [];
  }
}

/**
 * Write the current in-memory array to disk synchronously.
 * Using sync write so we never return from a mutation before the file is saved.
 */
function writeToDisk(records: BookingRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Pretty-print JSON so the file is human-readable
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    // Log error without interrupting in-memory execution
    logger.error('[bookings] Failed to write bookings to disk:', err);
  }
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// Load from file when the module is first imported.
// Every mutation also writes back to disk so they stay in sync.
let bookingsDatabase: BookingRecord[] = readFromDisk();

// ─── PII Masking ─────────────────────────────────────────────────────────────

// Helper to mask personally identifiable information (PII) for public API responses
export function maskBookingPII(booking: BookingRecord): BookingRecord {
  return {
    ...booking,
    // Mask email username leaving first 2 chars
    guestEmail: booking.guestEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    // Mask phone number keeping last 4 digits visible
    guestPhone: booking.guestPhone.replace(/\d(?=\d{4})/g, '*'),
  };
}

// ─── CRUD Functions ──────────────────────────────────────────────────────────

/**
 * Retrieve bookings with pagination and masked PII.
 *
 * @param options - Pagination options (page and limit)
 * @returns Paginated list of bookings and total metadata
 */
export function getAllBookings(options?: { page?: number; limit?: number }): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  bookings: BookingRecord[];
} {
  // Total reservations in store
  const total = bookingsDatabase.length;

  // Pagination parameters
  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.max(1, Number(options?.limit) || 20);
  const totalPages = Math.ceil(total / limit) || 1;

  // Calculate slice range for current page
  const startIndex = (page - 1) * limit;
  const sliced = bookingsDatabase.slice(startIndex, startIndex + limit);

  // Apply privacy masking to guest email and phone
  const maskedBookings = sliced.map(maskBookingPII);

  return {
    total,
    page,
    limit,
    totalPages,
    bookings: maskedBookings,
  };
}

/**
 * Find single booking by ID.
 *
 * @param bookingId - Unique reservation ID
 * @returns Found booking record with masked PII or null
 */
export function getBookingById(bookingId: string): BookingRecord | null {
  // Locate booking by ID
  const found = bookingsDatabase.find((b) => b.id === bookingId);
  if (!found) return null;
  // Return with masked PII
  return maskBookingPII(found);
}

/**
 * Create a new booking and immediately persist it to disk.
 *
 * @param data - Booking details submitted by guest
 * @returns Newly created booking record
 */
export function createBooking(data: Omit<BookingRecord, 'id' | 'status' | 'createdAt'>): BookingRecord {
  // Generate unique booking ID
  const id = generateBookingId();
  // Build booking object with confirmed status and current timestamp
  const newBooking: BookingRecord = {
    ...data,
    id,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };

  // Add to top of list (newest first)
  bookingsDatabase.unshift(newBooking);

  // Persist the updated list to disk immediately
  writeToDisk(bookingsDatabase);

  return newBooking;
}

/**
 * Update an existing booking record and persist to disk.
 *
 * @param bookingId - Unique reservation ID
 * @param updates - Partial properties to update (dates, guests, special requests)
 * @returns Updated booking record or null if not found
 */
export function updateBooking(bookingId: string, updates: Partial<BookingRecord>): BookingRecord | null {
  // Find index of target booking
  const index = bookingsDatabase.findIndex((b) => b.id === bookingId);
  if (index === -1) return null;

  // Prevent modifying immutable ID and creation timestamp
  const existing = bookingsDatabase[index];
  const updated: BookingRecord = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  bookingsDatabase[index] = updated;

  // Flush change to disk
  writeToDisk(bookingsDatabase);

  return maskBookingPII(updated);
}

/**
 * Cancel a booking by ID and persist the status change to disk.
 *
 * @param bookingId - Unique reservation ID
 * @returns Updated booking record or null if not found
 */
export function cancelBooking(bookingId: string): BookingRecord | null {
  // Find index of target booking
  const index = bookingsDatabase.findIndex((b) => b.id === bookingId);
  if (index === -1) return null;

  // Update status to CANCELLED
  bookingsDatabase[index].status = 'CANCELLED';

  // Flush change to disk
  writeToDisk(bookingsDatabase);

  return maskBookingPII(bookingsDatabase[index]);
}

/**
 * Permanently delete a booking by ID and persist to disk.
 *
 * @param bookingId - Unique reservation ID
 * @returns True if deleted, false if not found
 */
export function deleteBooking(bookingId: string): boolean {
  const initialCount = bookingsDatabase.length;
  bookingsDatabase = bookingsDatabase.filter((b) => b.id !== bookingId);
  const deleted = bookingsDatabase.length < initialCount;

  // Flush to disk only if something actually changed
  if (deleted) writeToDisk(bookingsDatabase);

  return deleted;
}

/**
 * Reset bookings database to an empty state and persist the empty collection to disk.
 */
export function resetBookings(): void {
  // Clear reservations collection
  bookingsDatabase = [];
  writeToDisk(bookingsDatabase);
}

/**
 * Clear all bookings completely and persist the empty state to disk.
 */
export function clearAllBookings(): void {
  bookingsDatabase = [];
  writeToDisk(bookingsDatabase);
}
