/**
 * @fileoverview System and administration request handlers.
 * Provides root landing dashboard, health checks, API discovery, and mock state reset endpoints.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module handlers/systemHandler
 */

import { Request, Response } from 'express';
import { FRONTEND_URL } from '../config/env';
import { API_CATALOG_DATA, BACKEND_MESSAGES } from '../constants/appConsts';
import { clearAllSupplierAFailCounters } from '../mockSuppliers/supplierA';
import { clearAllSupplierBFailCounters } from '../mockSuppliers/supplierB';
import { clearAllBookings } from '../mockData/bookings';
import { resetMockHotels } from '../mockData/hotels';

/**
 * Handles GET /
 * Returns rich visual HTML dashboard if requested by a web browser, otherwise returns JSON service status.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const rootLandingHandler = (req: Request, res: Response): void => {
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
};

/**
 * Handles GET /health
 * Returns service health status and current ISO timestamp.
 *
 * @param _req - Express request
 * @param res - Express response
 */
export const healthHandler = (_req: Request, res: Response): void => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};

/**
 * Handles GET /api/v1
 * Returns discovery metadata and all available REST endpoints.
 *
 * @param _req - Express request
 * @param res - Express response
 */
export const apiCatalogHandler = (_req: Request, res: Response): void => {
  res.json(API_CATALOG_DATA);
};

/**
 * Handles POST /api/reset-mock-state
 * Clears fail counters on both mock suppliers.
 *
 * @param _req - Express request
 * @param res - Express response
 */
export const resetMockStateHandler = (_req: Request, res: Response): void => {
  clearAllSupplierAFailCounters();
  clearAllSupplierBFailCounters();
  res.json({ message: BACKEND_MESSAGES.mockStateResetSuccess });
};

/**
 * Handles POST /api/v1/admin/reset-mock-state
 * Admin endpoint that resets supplier fail counters, purges bookings, and restores default catalog hotels.
 *
 * @param _req - Express request
 * @param res - Express response
 */
export const adminResetMockStateHandler = (_req: Request, res: Response): void => {
  clearAllSupplierAFailCounters();
  clearAllSupplierBFailCounters();
  clearAllBookings();
  resetMockHotels();
  res.json({ message: BACKEND_MESSAGES.supplierResetSuccess });
};
