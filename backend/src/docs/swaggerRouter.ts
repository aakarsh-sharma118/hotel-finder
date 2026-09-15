/**
 * @fileoverview Swagger documentation router.
 * Mounts interactive Swagger UI and serves raw OpenAPI JSON specifications.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module docs/swaggerRouter
 */

import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swaggerSpec';

export const swaggerRouter = Router();

// Custom CSS injected into Swagger UI to fix alignment and improve appearance.
// Each block is labelled so it is easy to find what it targets.
const customCss = `
  /* ── Top navigation bar ── */
  .swagger-ui .topbar {
    background-color: #0b1120;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 20px;
  }
  .swagger-ui .topbar .topbar-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .swagger-ui .topbar .topbar-wrapper a span {
    font-weight: 700;
    color: #38bdf8;
    font-size: 1.1rem;
  }
  /* Hide the default Swagger logo image so only the brand text shows */
  .swagger-ui .topbar .topbar-wrapper img { display: none; }

  /* ── Info section (title, description, contact) ── */
  .swagger-ui .info {
    margin: 30px 0 20px;
  }
  .swagger-ui .info .title {
    color: #0f172a;
    font-weight: 800;
    font-size: 2rem;
    line-height: 1.2;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .swagger-ui .info .title small {
    /* Version badge — keep it inline with the title */
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    background: #e2e8f0;
    color: #475569;
    vertical-align: middle;
    margin-left: 4px;
  }
  /* OAS badge next to version — keep aligned */
  .swagger-ui .info .title small.version-stamp {
    background: #16a34a;
    color: #ffffff;
  }
  .swagger-ui .info__contact { margin-top: 8px; }
  .swagger-ui .info__contact a { color: #0284c7; text-decoration: none; }
  .swagger-ui .info p {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #475569;
    max-width: 760px;
    /* Prevent description from being cut off on the right */
    white-space: normal;
    word-break: break-word;
  }

  /* ── Scheme container (server URL bar) ── */
  .swagger-ui .scheme-container {
    background: #f8fafc;
    padding: 14px 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  /* ── Authorization button ── */
  .swagger-ui .btn.authorize {
    background-color: #0284c7;
    color: white;
    border-color: #0284c7;
    border-radius: 8px;
    font-weight: 700;
  }

  /* ── Operation blocks (GET / POST / DELETE / PUT) ── */
  .swagger-ui .opblock { border-radius: 10px; margin-bottom: 10px; }
  .swagger-ui .opblock.opblock-get    { border-color: #0284c7; background: rgba(2, 132, 199, 0.04); }
  .swagger-ui .opblock.opblock-post   { border-color: #16a34a; background: rgba(22, 163, 74, 0.04); }
  .swagger-ui .opblock.opblock-delete { border-color: #dc2626; background: rgba(220, 38, 38, 0.04); }
  .swagger-ui .opblock.opblock-put    { border-color: #d97706; background: rgba(217, 119, 6, 0.04); }

  /* ── Tag headings ── */
  .swagger-ui .opblock-tag {
    font-size: 1.05rem;
    font-weight: 700;
    border-bottom: 2px solid #e2e8f0;
    margin: 28px 0 10px;
    padding-bottom: 8px;
  }

  /* ── Schema / Model tables ──────────────────────────────────────────────────
     This is the section that was misaligned in the screenshot.
     The property name and its type were on different horizontal levels because
     Swagger UI renders them in a table where the second column drifted right.
     Fix: use a consistent table layout with proper column widths.
  ── */
  .swagger-ui table.model tbody tr td {
    /* Make both columns vertically centred */
    vertical-align: top;
    padding: 6px 12px 6px 0;
  }
  /* First column: property name */
  .swagger-ui table.model tbody tr td:first-child {
    width: 180px;
    min-width: 120px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
  }
  /* Second column: type + description */
  .swagger-ui table.model tbody tr td:nth-child(2) {
    width: auto;
  }
  /* Type chevron inline with the type name — remove extra indent */
  .swagger-ui .model .property-row .star-character { display: none; }

  /* Model wrapper box */
  .swagger-ui .model-box {
    padding: 12px 16px;
    border-radius: 8px;
    background: #f1f5f9;
  }

  /* Schema property type label */
  .swagger-ui .model .prop-type {
    color: #0284c7;
    font-weight: 600;
    font-size: 0.85rem;
  }

  /* Example value text underneath type */
  .swagger-ui .model .prop-format,
  .swagger-ui .model example {
    font-size: 0.8rem;
    color: #64748b;
    font-style: italic;
  }

  /* ── Response section ── */
  .swagger-ui .responses-inner { padding: 12px; }
  .swagger-ui .response-col_status { font-weight: 700; min-width: 60px; }
  .swagger-ui .response-col_description { padding-left: 16px; }

  /* ── Parameters table ── */
  .swagger-ui table.parameters tbody tr td {
    vertical-align: middle;
    padding: 8px 12px;
  }
  .swagger-ui table.parameters tbody tr td:first-child {
    font-weight: 600;
    min-width: 140px;
    color: #1e293b;
  }

  /* ── General typography ── */
  .swagger-ui, .swagger-ui * { font-family: 'Inter', 'Segoe UI', sans-serif !important; }
  .swagger-ui .opblock-description-wrapper p { color: #475569; font-size: 0.9rem; }
`;

// Options for configuring Swagger UI presentation
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss,
  customSiteTitle: 'Hotel Finder API Docs - Aakarsh Sharma',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    // Show all endpoints collapsed by default for easy navigation
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
  },
};

// Raw OpenAPI 3.0 specification in JSON format
swaggerRouter.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Alias for API catalog consumers
swaggerRouter.get('/api/v1/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI interface on all common documentation paths
swaggerRouter.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
swaggerRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
swaggerRouter.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
