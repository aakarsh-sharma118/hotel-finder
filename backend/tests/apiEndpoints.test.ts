import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { Server } from 'http';
import app from '../src/server';
import { clearAllSupplierAFailCounters } from '../src/mockSuppliers/supplierA';
import { clearAllSupplierBFailCounters } from '../src/mockSuppliers/supplierB';

describe('Standardized REST API Endpoints Tests', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    clearAllSupplierAFailCounters();
    clearAllSupplierBFailCounters();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        process.env.PORT = String(address.port);
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET / returns landing status and API metadata', async () => {
    const res = await axios.get(`${baseUrl}/`, {
      headers: { Accept: 'application/json' },
    });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ONLINE');
    expect(res.data.service).toBe('Hotel Finder API');
  });

  it('GET /api/v1 returns catalog of available REST endpoints', async () => {
    const res = await axios.get(`${baseUrl}/api/v1`);
    expect(res.status).toBe(200);
    expect(res.data.version).toBe('v1');
    expect(res.data.endpoints).toHaveProperty('searchHotelsQuery');
    expect(res.data.endpoints).toHaveProperty('createBooking');
  });

  it('GET /api/v1/hotels/catalog returns verified hotel inventory for destination', async () => {
    const res = await axios.get(`${baseUrl}/api/v1/hotels/catalog`, {
      params: { city: 'Goa' },
    });
    expect(res.status).toBe(200);
    expect(res.data.city).toBe('Goa');
    expect(res.data.hotels).toBeInstanceOf(Array);
    expect(res.data.hotels.length).toBeGreaterThanOrEqual(5);
    expect(res.data.hotels[0]).toHaveProperty('hotelId');
    expect(res.data.hotels[0]).toHaveProperty('rateA');
    expect(res.data.hotels[0]).toHaveProperty('rateB');
    expect(res.data.hotels[0]).toHaveProperty('price');
  });

  it('GET /api/v1/hotels/search executes query-string based rate comparison', async () => {
    const res = await axios.get(`${baseUrl}/api/v1/hotels/search`, {
      params: {
        city: 'Goa',
        checkIn: '2026-09-10',
        checkOut: '2026-09-12',
      },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.allOffers.length).toBeGreaterThan(0);
    expect(res.data.bestDeal).toBeDefined();
  });

  it('POST /api/v1/hotels/search executes body-based rate comparison', async () => {
    const res = await axios.post(`${baseUrl}/api/v1/hotels/search`, {
      city: 'Mumbai',
      checkIn: '2026-09-15',
      checkOut: '2026-09-18',
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.city).toBe('Mumbai');
  });

  it('POST /api/search-hotels maintains backwards compatibility', async () => {
    const res = await axios.post(`${baseUrl}/api/search-hotels`, {
      city: 'Jaipur',
      checkIn: '2026-10-01',
      checkOut: '2026-10-04',
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('Rejects searches with missing or invalid city parameter', async () => {
    await expect(
      axios.get(`${baseUrl}/api/v1/hotels/search`, {
        params: { city: '', checkIn: '2026-09-10', checkOut: '2026-09-12' },
      })
    ).rejects.toThrow(/400/);
  });

  it('GET /api/v1/hotels/search returns NO_HOTELS_FOUND when city has no available supplier inventory', async () => {
    const res = await axios.get(`${baseUrl}/api/v1/hotels/search`, {
      params: {
        city: 'EmptyCityXYZ',
        checkIn: '2026-09-10',
        checkOut: '2026-09-12',
      },
    });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('NO_HOTELS_FOUND');
    expect(res.data.hotels).toEqual([]);
    expect(res.data.allOffers).toEqual([]);
  });

  it('POST /api/v1/bookings creates a verified reservation and GET /api/v1/bookings lists it', async () => {
    const bookingPayload = {
      hotelId: 'h-goa-1',
      hotelName: 'Goa Grand Resort',
      city: 'Goa',
      supplier: 'SupplierA',
      price: 2450,
      guestName: 'Aarav Patel',
      guestEmail: 'aarav.patel@example.com',
      guestPhone: '9876543210',
      checkIn: '2026-09-10',
      checkOut: '2026-09-12',
      guests: '2 Adults',
    };

    const createRes = await axios.post(`${baseUrl}/api/v1/bookings`, bookingPayload);
    expect(createRes.status).toBe(201);
    expect(createRes.data.booking).toBeDefined();
    expect(createRes.data.booking.id).toMatch(/^CONF-/);
    expect(createRes.data.booking.guestName).toBe('Aarav Patel');

    // Query list of bookings
    const listRes = await axios.get(`${baseUrl}/api/v1/bookings`);
    expect(listRes.status).toBe(200);
    expect(listRes.data.count).toBeGreaterThanOrEqual(1);

    // Cancel the booking
    const deleteRes = await axios.delete(`${baseUrl}/api/v1/bookings/${createRes.data.booking.id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.data.booking.status).toBe('CANCELLED');
  });

  it('POST /api/v1/bookings rejects invalid guest details', async () => {
    const invalidPayload = {
      guestName: '1234',
      guestEmail: 'not-an-email',
      guestPhone: 'abc',
    };

    await expect(axios.post(`${baseUrl}/api/v1/bookings`, invalidPayload)).rejects.toThrow(/400/);
  });

  it('POST /api/v1/admin/reset-mock-state resets bookings and mock states', async () => {
    const res = await axios.post(`${baseUrl}/api/v1/admin/reset-mock-state`);
    expect(res.status).toBe(200);

    const listRes = await axios.get(`${baseUrl}/api/v1/bookings`);
    expect(listRes.data.count).toBe(0);
  });

  it('GET /api-docs serves Swagger UI documentation', async () => {
    const res = await axios.get(`${baseUrl}/api-docs/`);
    expect(res.status).toBe(200);
    expect(res.data).toContain('swagger-ui');
  });

  it('GET /api-docs.json serves valid OpenAPI 3.0 specification', async () => {
    const res = await axios.get(`${baseUrl}/api-docs.json`);
    expect(res.status).toBe(200);
    expect(res.data.openapi).toBe('3.0.0');
    expect(res.data.info.title).toBe('Hotel Finder API');
    expect(res.data.paths).toHaveProperty('/api/v1/hotels/catalog');
    expect(res.data.paths).toHaveProperty('/api/v1/bookings');
  });

  it('GET /api/v1/hotels/catalog supports price filtering and pagination for Meerut', async () => {
    const res = await axios.get(`${baseUrl}/api/v1/hotels/catalog`, {
      params: { city: 'Meerut', page: 1, limit: 5, minPrice: 2000, maxPrice: 3500 },
    });
    expect(res.status).toBe(200);
    expect(res.data.city).toBe('Meerut');
    expect(res.data.page).toBe(1);
    expect(res.data.limit).toBe(5);
    expect(res.data.hotels.length).toBeGreaterThan(0);
    expect(res.data.hotels[0].price).toBeGreaterThanOrEqual(2000);
    expect(res.data.hotels[0].price).toBeLessThanOrEqual(3500);
  });

  it('GET /api/v1/hotels/destinations returns dynamic destination cities including Meerut', async () => {
    const res = await axios.get(`${baseUrl}/api/v1/hotels/destinations`);
    expect(res.status).toBe(200);
    expect(res.data.destinations).toBeDefined();
    expect(res.data.destinations.length).toBeGreaterThanOrEqual(10);
    const meerut = res.data.destinations.find((d: any) => d.city === 'Meerut');
    expect(meerut).toBeDefined();
    expect(meerut.hotelCount).toBeGreaterThan(0);
    expect(meerut.minPrice).toBeGreaterThan(0);
  });

  it('GET /api/v1/destinations/validate accurately validates cities', async () => {
    const validRes = await axios.get(`${baseUrl}/api/v1/destinations/validate`, {
      params: { city: 'meerut' },
    });
    expect(validRes.status).toBe(200);
    expect(validRes.data.valid).toBe(true);
    expect(validRes.data.normalizedCity).toBe('Meerut');

    const invalidRes = await axios.get(`${baseUrl}/api/v1/destinations/validate`, {
      params: { city: 'NonExistentCityXYZ' },
    });
    expect(invalidRes.status).toBe(200);
    expect(invalidRes.data.valid).toBe(false);
  });
});

