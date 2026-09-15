/**
 * @fileoverview Supplier response generator based on mock hotels dataset.
 * Produces realistic rate offers for Supplier A and Supplier B for any requested city.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module mockData/suppliers
 */

import { getAllMockHotels, MockHotel } from './hotels';

// Standard hotel offer object format returned by suppliers
export interface SupplierHotelOffer {
  hotelId: string;
  name: string;
  price: number;
  city?: string;
  stars?: number;
  location?: string;
  image?: string;
}

/**
 * Generate Supplier A hotel offers for a target city.
 *
 * @param city - Target city name
 * @param priceOverride - Optional price override for testing
 * @returns Array of hotel offers from Supplier A
 */
export function getSupplierAHotels(city: string, priceOverride?: number): SupplierHotelOffer[] {
  // Normalize destination name
  const targetCity = (city || '').trim().toLowerCase();
  const allHotels = getAllMockHotels();

  // Find hotels in requested city
  const matched = allHotels.filter((h) => {
    const c = h.city.toLowerCase();
    return c === targetCity || c.includes(targetCity) || targetCity.includes(c);
  });

  // Map to supplier A offers
  return matched.map((h: MockHotel) => ({
    hotelId: h.hotelId,
    name: h.name,
    price: priceOverride !== undefined ? priceOverride : h.rateA,
    city: h.city,
    stars: h.stars,
    location: h.location,
    image: h.image,
  }));
}

/**
 * Generate Supplier B hotel offers for a target city.
 *
 * @param city - Target city name
 * @param priceOverride - Optional price override for testing
 * @returns Array of hotel offers from Supplier B
 */
export function getSupplierBHotels(city: string, priceOverride?: number): SupplierHotelOffer[] {
  // Normalize destination name
  const targetCity = (city || '').trim().toLowerCase();
  const allHotels = getAllMockHotels();

  // Find hotels in requested city
  const matched = allHotels.filter((h) => {
    const c = h.city.toLowerCase();
    return c === targetCity || c.includes(targetCity) || targetCity.includes(c);
  });

  // Map to supplier B offers
  return matched.map((h: MockHotel) => ({
    hotelId: h.hotelId,
    name: h.name,
    price: priceOverride !== undefined ? priceOverride : h.rateB,
    city: h.city,
    stars: h.stars,
    location: h.location,
    image: h.image,
  }));
}
