/**
 * @fileoverview Main Express HTTP server for Hotel Finder backend.
 * Configures security middleware, Swagger UI docs, Temporal workflows, and REST endpoints.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Connection, Client } from '@temporalio/client';
import {
  PORT,
  FRONTEND_URL,
  TEMPORAL_ADDRESS,
  TEMPORAL_NAMESPACE,
  TEMPORAL_API_KEY,
  ALLOWED_ORIGINS,
} from './config/env';
import { logger } from './utils/logger';
import { swaggerRouter } from './docs/swaggerRouter';
import { supplierARouter, clearAllSupplierAFailCounters } from './mockSuppliers/supplierA';
import { supplierBRouter, clearAllSupplierBFailCounters } from './mockSuppliers/supplierB';
import {
  compareHotelRatesWorkflow,
  cancelSearchSignal,
  evaluateHotelRatesDecision,
  ActivityOutcome,
  SearchWorkflowResult,
} from './workflows/hotelSearchWorkflow';
import { fetchSupplierA, fetchSupplierB } from './activities/supplierActivities';
import { VALIDATION_MESSAGES } from './constants/validation';
import {
  SERVER_CONFIG,
  API_CATALOG_DATA,
  BACKEND_MESSAGES,
  VALIDATION_REGEX,
  getBackendHotelsForCity,
} from './constants/appConsts';
import {
  sanitizeInput,
  decodeHtmlEntities,
  generateWorkflowId,
  isTemporalConnectionError,
} from './utils/utilityManager';
import {
  getHotelsByCity,
  addCustomHotel,
  updateHotel,
  deleteHotel,
  resetMockHotels,
  getDestinationsList,
  validateDestination,
} from './mockData/hotels';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  resetBookings,
  clearAllBookings,
  BookingRecord,
} from './mockData/bookings';

// Export BookingRecord interface for existing consumers
export { BookingRecord };

// Initialize Express application instance
const app = express();

// ── Security Middleware ───────────────────────────────────────────────────
// Configure HTTP security headers using Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'http://localhost:3001',
          'http://localhost:3000',
          'http://localhost:5173',
          'https://*.onrender.com',
          'ws:',
        ],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Configure Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: SERVER_CONFIG.CORS_ALLOWED_METHODS,
    allowedHeaders: SERVER_CONFIG.CORS_ALLOWED_HEADERS,
  })
);

// Enable JSON body parsing middleware
app.use(express.json());

// ── Rate Limiting ─────────────────────────────────────────────────────────
// Map tracking request counts and reset timestamps per client IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

app.use((req: Request, res: Response, next) => {
  // Extract client IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + SERVER_CONFIG.RATE_LIMIT_WINDOW_MS };

  // Check if rate limiting window has expired
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + SERVER_CONFIG.RATE_LIMIT_WINDOW_MS;
  } else {
    entry.count += 1;
  }

  rateLimitMap.set(ip, entry);

  // Return 429 if rate limit exceeded
  if (entry.count > SERVER_CONFIG.MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: BACKEND_MESSAGES.rateLimitExceeded });
    return;
  }

  next();
});

// ── Mount Swagger UI Documentation ────────────────────────────────────────
// Mounts /api-docs, /docs, /swagger, /api-docs.json, and /api/v1/swagger.json
app.use(swaggerRouter);

// ── Mock Supplier Routers ─────────────────────────────────────────────────
app.use('/supplierA', supplierARouter);
app.use('/supplierB', supplierBRouter);

// Reset mock state endpoint
app.post('/api/reset-mock-state', (_req: Request, res: Response) => {
  // Clear fail counters on both suppliers
  clearAllSupplierAFailCounters();
  clearAllSupplierBFailCounters();
  res.json({ message: BACKEND_MESSAGES.mockStateResetSuccess });
});

// ── Temporal Client Setup ─────────────────────────────────────────────────
let temporalClient: Client | null = null;

/**
 * Initialize or return existing Temporal client connection.
 *
 * @returns Connected Temporal client instance
 */
async function getTemporalClient(): Promise<Client> {
  // Return cached client if already connected
  if (temporalClient) return temporalClient;

  // Connection options: TLS + API key for Temporal Cloud, standard TCP for local cluster
  const connectionOptions: Parameters<typeof Connection.connect>[0] = TEMPORAL_API_KEY
    ? { address: TEMPORAL_ADDRESS, tls: true, apiKey: TEMPORAL_API_KEY }
    : { address: TEMPORAL_ADDRESS, connectTimeout: SERVER_CONFIG.TEMPORAL_CONNECT_TIMEOUT };

  const connection = await Connection.connect(connectionOptions);
  temporalClient = new Client({ connection, namespace: TEMPORAL_NAMESPACE });
  return temporalClient;
}

// ── Fallback Direct Rate Comparison ───────────────────────────────────────
/**
 * Executes direct supplier comparison with SLA timeouts when Temporal server is offline.
 *
 * @param params - Comparison search parameters
 * @returns Completed SearchWorkflowResult
 */
async function runDirectFallbackComparison(params: {
  city: string;
  checkIn: string;
  checkOut: string;
  simulations?: any;
  workflowId: string;
  supplierAUrl?: string;
  supplierBUrl?: string;
}): Promise<SearchWorkflowResult> {
  const { city, checkIn, checkOut, simulations, workflowId, supplierAUrl, supplierBUrl } = params;
  const timeoutMs = SERVER_CONFIG.DEFAULT_ACTIVITY_TIMEOUT_MS;

  // Race activity call against a strict timeout promise
  const runWithTimeout = async (fn: () => Promise<any[]>): Promise<ActivityOutcome> => {
    try {
      const data = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Activity timed out (>5s)')), timeoutMs)
        ),
      ]);
      return { data };
    } catch (err: any) {
      const isTimeout = err.message?.includes('timed out');
      return {
        error: err.message,
        isTimeout,
      };
    }
  };

  // Run Supplier A and Supplier B concurrently
  const [outcomeA, outcomeB] = await Promise.all([
    runWithTimeout(() => fetchSupplierA({ city, checkIn, checkOut, simulations, supplierAUrl })),
    runWithTimeout(() => fetchSupplierB({ city, checkIn, checkOut, simulations, supplierBUrl })),
  ]);

  // Evaluate rates and pick best deal
  return evaluateHotelRatesDecision(outcomeA, outcomeB, city, checkIn, checkOut, workflowId);
}

// ── Root Landing Page ─────────────────────────────────────────────────────
app.get('/', (req: Request, res: Response): void => {
  // If browser accepts HTML, render clean visual dashboard
  if (req.accepts('html') && !req.accepts('json')) {
    const frontendBtn = FRONTEND_URL
      ? `<a href="${FRONTEND_URL}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Open Web App (Frontend) &rarr;</a>`
      : '';

    const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Finder API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b1120;
      --card-bg: rgba(15, 23, 42, 0.8);
      --border: rgba(255, 255, 255, 0.1);
      --primary: #38bdf8;
      --primary-hover: #0284c7;
      --swagger: #10b981;
      --swagger-hover: #059669;
      --success: #34d399;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    body {
      background: radial-gradient(circle at 50% 0%, #1e293b 0%, var(--bg) 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 40px;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(52, 211, 153, 0.15);
      color: var(--success);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
    }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.025em; }
    p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px; }
    .author-tag { font-size: 0.85rem; color: var(--primary); margin-bottom: 24px; font-weight: 600; }
    .btn-group { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      font-size: 0.92rem;
      transition: all 0.2s ease;
    }
    .btn-swagger { background: var(--swagger); color: #022c22; }
    .btn-swagger:hover { background: var(--swagger-hover); color: #ffffff; transform: translateY(-1px); }
    .btn-primary { background: var(--primary); color: #0f172a; }
    .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-secondary { background: rgba(255, 255, 255, 0.05); color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-1px); }
    .endpoints { background: rgba(0, 0, 0, 0.3); border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.05); }
    .endpoints h3 { font-size: 0.875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .endpoint-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 0.88rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .endpoint-item:last-child { border-bottom: none; }
    .endpoint-item a { color: var(--primary); text-decoration: none; font-family: monospace; font-size: 0.84rem; }
    .endpoint-item a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="badge-dot"></span> Backend Live & Operational</div>
    <h1>Hotel Finder API</h1>
    <div class="author-tag">&copy; 2026 Aakarsh Sharma. All rights reserved.</div>
    <p>Distributed hotel rate aggregation and comparison engine powered by Temporal workflows. Serving realistic hotel data across 16+ Indian cities including Meerut, Goa, Mumbai, Delhi, and Bengaluru.</p>
    <div class="btn-group">
      <a href="/api-docs" class="btn btn-swagger">&#128218; Interactive Swagger UI</a>
      ${frontendBtn}
      <a href="/api/v1" class="btn btn-secondary">API Catalog</a>
      <a href="/health" class="btn btn-secondary">Health Check</a>
    </div>
    <div class="endpoints">
      <h3>Quick API Links</h3>
      <div class="endpoint-item"><span>Swagger Documentation</span><a href="/api-docs">GET /api-docs</a></div>
      <div class="endpoint-item"><span>OpenAPI JSON Spec</span><a href="/api-docs.json">GET /api-docs.json</a></div>
      <div class="endpoint-item"><span>API Health</span><a href="/health">GET /health</a></div>
      <div class="endpoint-item"><span>Hotel Catalog (Meerut)</span><a href="/api/v1/hotels/catalog?city=Meerut">GET /api/v1/hotels/catalog?city=Meerut</a></div>
      <div class="endpoint-item"><span>Hotel Search</span><a href="/api/v1/hotels/search?city=Meerut&checkIn=2026-10-10&checkOut=2026-10-14">GET /api/v1/hotels/search</a></div>
      <div class="endpoint-item"><span>List Bookings</span><a href="/api/v1/bookings">GET /api/v1/bookings</a></div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(landingHtml);
    return;
  }

  // Otherwise return JSON status response
  res.status(200).json({
    status: 'ONLINE',
    service: 'Hotel Finder API',
    version: 'v1.0.0',
    documentation: '/api-docs',
    catalog: '/api/v1',
    health: '/health',
    author: 'Aakarsh Sharma',
    ...(FRONTEND_URL ? { frontend: FRONTEND_URL } : {}),
  });
});

// ── Health Check Endpoint ─────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Search Handler ────────────────────────────────────────────────────────
async function handleHotelSearch(
  params: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    simulations?: any;
    waitForResult?: boolean | string;
    workflowId?: string;
  },
  res: Response
): Promise<void> {
  const { city, checkIn, checkOut, simulations } = params;
  const waitForResult = params.waitForResult === 'false' || params.waitForResult === false ? false : true;

  // Sanitize input values
  const rawCity = sanitizeInput(String(city || ''));
  const sanitizedCity = rawCity.substring(0, 80);
  const sanitizedCheckIn = sanitizeInput(String(checkIn || ''));
  const sanitizedCheckOut = sanitizeInput(String(checkOut || ''));

  // Validate required inputs
  if (
    !sanitizedCity ||
    !sanitizedCheckIn ||
    !sanitizedCheckOut ||
    !VALIDATION_REGEX.city.test(sanitizedCity)
  ) {
    res.status(400).json({
      error: BACKEND_MESSAGES.missingParameters,
    });
    return;
  }

  const workflowId = params.workflowId || generateWorkflowId(sanitizedCity);

  try {
    const client = await getTemporalClient();

    // Start Temporal workflow execution
    const handle = await client.workflow.start(compareHotelRatesWorkflow, {
      taskQueue: SERVER_CONFIG.TASK_QUEUE_NAME,
      workflowId,
      args: [
        {
          city: sanitizedCity,
          checkIn: sanitizedCheckIn,
          checkOut: sanitizedCheckOut,
          simulations,
        },
      ],
    });

    logger.info(`Started Temporal workflow: ${workflowId}`);

    // If client requested async start, return workflow ID immediately
    if (waitForResult === false) {
      res.status(202).json({
        workflowId,
        message: BACKEND_MESSAGES.searchStarted,
      });
      return;
    }

    // Wait for the workflow result (with 2.5s worker timeout fallback)
    const result = await Promise.race([
      handle.result(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Temporal worker queue wait timeout')), 2500)
      ),
    ]);

    if (result.status === 'ERROR') {
      res.status(500).json(result);
      return;
    }

    // Append realistic hotel list from catalog
    const hotels =
      result.status === 'SUCCESS' && result.bestDeal
        ? getBackendHotelsForCity(sanitizedCity, {
            bestPrice: result.bestDeal.price,
            isSupplierACheaper: result.bestDeal.supplier === 'Supplier A',
            winningHotelName: result.bestDeal.name,
          })
        : [];

    res.status(200).json({ ...result, hotels });
  } catch (error: any) {
    // If workflow was cancelled
    if (error.name === 'WorkflowFailedError' && error.cause?.name === 'CancelledError') {
      res.status(499).json({
        status: 'CANCELLED',
        workflowId,
        message: BACKEND_MESSAGES.searchCancelled,
      });
      return;
    }

    // Temporal offline fallback
    if (isTemporalConnectionError(error)) {
      logger.warn(
        `Temporal server offline (${error.message}). Executing direct rate comparison fallback for ${workflowId}...`
      );
      try {
        const localPort = (res.req?.socket as any)?.localPort || PORT;
        const fallbackResult = await runDirectFallbackComparison({
          city: sanitizedCity,
          checkIn: sanitizedCheckIn,
          checkOut: sanitizedCheckOut,
          simulations,
          workflowId,
          supplierAUrl: process.env.SUPPLIER_A_URL || `http://localhost:${localPort}/supplierA/hotels`,
          supplierBUrl: process.env.SUPPLIER_B_URL || `http://localhost:${localPort}/supplierB/hotels`,
        });

        const fallbackHotels =
          fallbackResult.status === 'SUCCESS' && fallbackResult.bestDeal
            ? getBackendHotelsForCity(sanitizedCity, {
                bestPrice: fallbackResult.bestDeal.price,
                isSupplierACheaper: fallbackResult.bestDeal.supplier === 'Supplier A',
                winningHotelName: fallbackResult.bestDeal.name,
              })
            : [];

        res.status(200).json({ ...fallbackResult, hotels: fallbackHotels });
        return;
      } catch (fallbackError: any) {
        logger.error(`Fallback comparison error:`, fallbackError);
      }
    }

    logger.error(`Error executing workflow ${workflowId}:`, error);
    res.status(500).json({
      error: error?.message || BACKEND_MESSAGES.searchFailed,
      workflowId,
    });
  }
}

// ── Hotel Catalog Endpoints with Pagination & Price Filtering ─────────────
app.get('/api/v1/hotels/catalog', (req: Request, res: Response): void => {
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
});

// ── Destination Discovery & Validation Endpoints ─────────────────────────
app.get(['/api/v1/hotels/destinations', '/api/v1/destinations'], (_req: Request, res: Response): void => {
  // Retrieve aggregated destination list from in-memory catalog
  const destinations = getDestinationsList();

  // Return list with total destination count
  res.status(200).json({
    destinations,
    total: destinations.length,
  });
});

app.get('/api/v1/destinations/validate', (req: Request, res: Response): void => {
  // Extract and sanitize query city parameter
  const rawCity = sanitizeInput(String(req.query.city || ''));

  // Validate destination against available catalog
  const result = validateDestination(rawCity);

  res.status(200).json({
    city: rawCity,
    valid: result.valid,
    normalizedCity: result.normalizedCity,
  });
});

// ── Hotel CRUD Operations ─────────────────────────────────────────────────
app.post('/api/v1/hotels', (req: Request, res: Response): void => {
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
});

app.put('/api/v1/hotels/:hotelId', (req: Request, res: Response): void => {
  const hotelId = String(req.params.hotelId);
  const updated = updateHotel(hotelId, req.body);
  if (!updated) {
    res.status(404).json({ error: `Hotel ${hotelId} not found` });
    return;
  }
  res.status(200).json({ message: 'Hotel updated successfully', hotel: updated });
});

app.delete('/api/v1/hotels/:hotelId', (req: Request, res: Response): void => {
  const hotelId = String(req.params.hotelId);
  const deleted = deleteHotel(hotelId);
  if (!deleted) {
    res.status(404).json({ error: `Hotel ${hotelId} not found` });
    return;
  }
  res.status(200).json({ message: `Hotel ${hotelId} removed successfully` });
});

// ── Search Endpoints ──────────────────────────────────────────────────────
app.get('/api/v1/hotels/search', async (req: Request, res: Response): Promise<void> => {
  await handleHotelSearch(req.query as any, res);
});

app.post('/api/v1/hotels/search', async (req: Request, res: Response): Promise<void> => {
  await handleHotelSearch(req.body, res);
});

app.post('/api/search-hotels', async (req: Request, res: Response): Promise<void> => {
  await handleHotelSearch(req.body, res);
});

// ── Cancel Search Workflow Endpoints ──────────────────────────────────────
const cancelSearchHandler = async (req: Request, res: Response): Promise<void> => {
  const workflowId = req.params.workflowId as string;

  try {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);

    // Send cancellation signal and cancel workflow
    await Promise.allSettled([handle.signal(cancelSearchSignal), handle.cancel()]);

    logger.info(`Cancel signal sent to workflow: ${workflowId}`);
    res.status(200).json({
      workflowId,
      status: 'CANCEL_REQUESTED',
      message: `Workflow ${workflowId} cancellation triggered successfully`,
    });
  } catch (error: any) {
    logger.error(`Failed to cancel workflow ${workflowId}:`, error);
    res.status(500).json({
      error: `Failed to cancel workflow ${workflowId}. The workflow may have already completed or does not exist.`,
    });
  }
};
app.post('/api/v1/hotels/search/:workflowId/cancel', cancelSearchHandler);
app.post('/api/cancel-search/:workflowId', cancelSearchHandler);

// ── Search Status Endpoints ───────────────────────────────────────────────
const searchStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const workflowId = req.params.workflowId as string;

  try {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);
    const description = await handle.describe();

    let result = null;
    if (description.status.name === 'COMPLETED') {
      result = await handle.result();
    }

    res.status(200).json({
      workflowId,
      status: description.status.name,
      result,
    });
  } catch (error: any) {
    logger.warn(`Workflow status query failed for ${workflowId}:`, error?.message || error);
    res.status(404).json({
      error: `Workflow ${workflowId} not found or status query failed.`,
    });
  }
};
app.get('/api/v1/hotels/search/:workflowId', searchStatusHandler);
app.get('/api/search-status/:workflowId', searchStatusHandler);

// ── Bookings Endpoints with Pagination & CRUD ──────────────────────────────
app.get('/api/v1/bookings', (req: Request, res: Response): void => {
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
});

app.get('/api/v1/bookings/:bookingId', (req: Request, res: Response): void => {
  const bookingId = String(req.params.bookingId);
  const booking = getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ error: BACKEND_MESSAGES.bookingNotFound(bookingId) });
    return;
  }
  res.status(200).json({ booking });
});

app.post('/api/v1/bookings', (req: Request, res: Response): void => {
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
});

app.put('/api/v1/bookings/:bookingId', (req: Request, res: Response): void => {
  const bookingId = String(req.params.bookingId);
  const updated = updateBooking(bookingId, req.body);
  if (!updated) {
    res.status(404).json({ error: BACKEND_MESSAGES.bookingNotFound(bookingId) });
    return;
  }
  res.status(200).json({ message: 'Reservation updated successfully', booking: updated });
});

app.delete('/api/v1/bookings/:bookingId', (req: Request, res: Response): void => {
  const bookingId = String(req.params.bookingId);
  const cancelled = cancelBooking(bookingId);
  if (!cancelled) {
    res.status(404).json({ error: BACKEND_MESSAGES.bookingNotFound(bookingId) });
    return;
  }
  logger.info(`Cancelled booking: ${bookingId}`);
  res.status(200).json({ message: BACKEND_MESSAGES.bookingCancelled(bookingId), booking: cancelled });
});

// ── Admin Reset Endpoint ──────────────────────────────────────────────────
app.post('/api/v1/admin/reset-mock-state', (_req: Request, res: Response): void => {
  clearAllSupplierAFailCounters();
  clearAllSupplierBFailCounters();
  clearAllBookings();
  resetMockHotels();
  res.json({ message: BACKEND_MESSAGES.supplierResetSuccess });
});

// ── API Catalog Discovery ─────────────────────────────────────────────────
app.get('/api/v1', (_req: Request, res: Response): void => {
  res.json(API_CATALOG_DATA);
});

// ── Server Startup ────────────────────────────────────────────────────────
if (require.main === module || process.argv[1]?.includes('server.ts')) {
  app.listen(PORT, () => {
    logger.info(`Hotel Finder API listening on http://localhost:${PORT}`);
    logger.info(`Swagger UI documentation available at http://localhost:${PORT}/api-docs`);
    logger.info(`Mock Supplier A available at http://localhost:${PORT}/supplierA/hotels`);
    logger.info(`Mock Supplier B available at http://localhost:${PORT}/supplierB/hotels`);
  });
}

export default app;
