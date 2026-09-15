/**
 * @fileoverview Centralized environment configuration.
 * Single source of truth for all backend environment variables.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module config/env
 */

import dotenv from 'dotenv';

// Load variables from .env file into process.env
dotenv.config();

// Port number on which the HTTP server listens
export const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Address of the Temporal cluster frontend service
export const TEMPORAL_ADDRESS: string = process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233';

// Namespace within Temporal for running workflows
export const TEMPORAL_NAMESPACE: string = process.env.TEMPORAL_NAMESPACE || 'default';

// Optional API key used when authenticating with Temporal Cloud
export const TEMPORAL_API_KEY: string | undefined = process.env.TEMPORAL_API_KEY;

// URL of the web frontend application for CORS and redirect links
export const FRONTEND_URL: string = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

// Base URL for mock supplier A service calls
export const SUPPLIER_A_URL: string | undefined = process.env.SUPPLIER_A_URL;

// Base URL for mock supplier B service calls
export const SUPPLIER_B_URL: string | undefined = process.env.SUPPLIER_B_URL;

// Current execution environment name
export const NODE_ENV: string = process.env.NODE_ENV || 'development';

// Flag indicating if the application runs in production mode
export const IS_PRODUCTION: boolean = NODE_ENV === 'production';

// List of origins permitted by CORS middleware
export const ALLOWED_ORIGINS: string[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://hotelfinder-api.onrender.com',
  FRONTEND_URL,
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : []),
].filter(Boolean);
