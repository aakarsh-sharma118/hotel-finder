/**
 * @fileoverview Search orchestration service for Hotel Finder backend.
 * Manages Temporal client connection and provides direct rate comparison fallback when Temporal is offline.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module services/searchService
 */

import { Connection, Client } from '@temporalio/client';
import {
  TEMPORAL_ADDRESS,
  TEMPORAL_NAMESPACE,
  TEMPORAL_API_KEY,
} from '../config/env';
import { SERVER_CONFIG } from '../constants/appConsts';
import {
  evaluateHotelRatesDecision,
  ActivityOutcome,
  SearchWorkflowResult,
} from '../workflows/hotelSearchWorkflow';
import { fetchSupplierA, fetchSupplierB } from '../activities/supplierActivities';

// ── Temporal Client Setup ─────────────────────────────────────────────────
let temporalClient: Client | null = null;

/**
 * Initialize or return existing Temporal client connection.
 *
 * @returns Connected Temporal client instance
 */
export async function getTemporalClient(): Promise<Client> {
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
export async function runDirectFallbackComparison(params: {
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
