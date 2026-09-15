/**
 * @fileoverview Mock Supplier B HTTP router.
 * Simulates external hotel rate supplier with fault injection features (delay, errors, abort).
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module mockSuppliers/supplierB
 */

import { Router, Request, Response } from 'express';
import { HotelOffer } from './supplierA';
import { isCityRecognized } from '../constants/appConsts';
import { getSupplierBHotels } from '../mockData/suppliers';

// In-memory counter tracking transient failures per test key
const failCountersB: Record<string, number> = {};

/**
 * Reset fail counter for a given test key in Supplier B.
 *
 * @param key - Identifier for test case counter
 */
export function resetSupplierBFailCounter(key: string = 'default'): void {
  delete failCountersB[key];
}

/**
 * Clear all registered fail counters for Supplier B.
 */
export function clearAllSupplierBFailCounters(): void {
  for (const key in failCountersB) {
    delete failCountersB[key];
  }
}

export const supplierBRouter = Router();

// Handle GET /hotels request for Supplier B
supplierBRouter.get('/hotels', async (req: Request, res: Response): Promise<void> => {
  // Extract query parameters for city and fault simulations
  const {
    city = 'Meerut',
    delay,
    status,
    empty,
    failCount,
    failKey = 'default',
    abort,
    priceOverride,
  } = req.query;

  // Simulate network abort by immediately closing the socket connection
  if (abort === 'true') {
    req.socket.destroy();
    return;
  }

  // Simulate latency delay if specified in query
  if (delay) {
    const delayMs = parseInt(delay as string, 10);
    if (!isNaN(delayMs) && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Simulate HTTP status code failure (e.g. 500, 502, 504)
  if (status) {
    const statusCode = parseInt(status as string, 10);
    if (!isNaN(statusCode) && statusCode >= 400) {
      res.status(statusCode).json({
        error: `Simulated error from Supplier B with status ${statusCode}`,
        supplier: 'Supplier B',
      });
      return;
    }
  }

  // Simulate transient failure sequence before eventual success
  if (failCount !== undefined) {
    const maxFailures = parseInt(failCount as string, 10);
    const key = (failKey as string) || 'default';
    const currentCount = failCountersB[key] || 0;

    if (currentCount < maxFailures) {
      failCountersB[key] = currentCount + 1;
      res.status(500).json({
        error: `Transient failure ${currentCount + 1}/${maxFailures} from Supplier B`,
        supplier: 'Supplier B',
        attempt: currentCount + 1,
      });
      return;
    }
    // Clean up counter once the required failure count has passed
    delete failCountersB[key];
  }

  // Simulate empty inventory response
  if (empty === 'true') {
    res.status(200).json([]);
    return;
  }

  // Normalize city input
  const cityStr = String(city || 'Meerut').trim();
  const overridePrice = priceOverride !== undefined ? Number(priceOverride) : undefined;

  // Retrieve realistic hotel offers from mock data
  let hotels: HotelOffer[] = getSupplierBHotels(cityStr, overridePrice);

  // If no hotels found in mock data, check if city is recognized
  if (hotels.length === 0) {
    if (isCityRecognized(cityStr)) {
      hotels = [
        { hotelId: `h-${cityStr.toLowerCase()}-b1`, name: `${cityStr} Grand Palace & Spa`, price: overridePrice || 2600, city: cityStr },
        { hotelId: `h-${cityStr.toLowerCase()}-b2`, name: `${cityStr} Premier Business Suites`, price: overridePrice || 2300, city: cityStr },
      ];
    } else {
      hotels = [];
    }
  }

  // Return realistic hotel offers with HTTP 200 OK
  res.status(200).json(hotels);
});
