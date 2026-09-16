/**
 * @fileoverview Search orchestration request handlers.
 * Dispatches rate comparison requests via Temporal workflows or direct fallback execution.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module handlers/searchHandler
 */

import { Request, Response } from 'express';
import { PORT } from '../config/env';
import { logger } from '../utils/logger';
import {
  SERVER_CONFIG,
  BACKEND_MESSAGES,
  VALIDATION_REGEX,
  getBackendHotelsForCity,
} from '../constants/appConsts';
import {
  sanitizeInput,
  generateWorkflowId,
  isTemporalConnectionError,
} from '../utils/utilityManager';
import {
  compareHotelRatesWorkflow,
  cancelSearchSignal,
} from '../workflows/hotelSearchWorkflow';
import { getTemporalClient, runDirectFallbackComparison } from '../services/searchService';

/**
 * Core search executor function.
 * Validates travel parameters, invokes Temporal workflow, and resolves hotel deals.
 *
 * @param params - Search parameters (city, dates, options)
 * @param res - Express response
 */
export async function handleHotelSearch(
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

/**
 * Handles GET /api/v1/hotels/search
 * Executes query-string based rate comparison.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const searchHotelsQueryHandler = async (req: Request, res: Response): Promise<void> => {
  await handleHotelSearch(req.query as any, res);
};

/**
 * Handles POST /api/v1/hotels/search and POST /api/search-hotels
 * Executes body-based rate comparison.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const searchHotelsBodyHandler = async (req: Request, res: Response): Promise<void> => {
  await handleHotelSearch(req.body, res);
};

/**
 * Handles POST /api/v1/hotels/search/:workflowId/cancel and POST /api/cancel-search/:workflowId
 * Sends cancellation signal to the active Temporal workflow.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const cancelSearchHandler = async (req: Request, res: Response): Promise<void> => {
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

/**
 * Handles GET /api/v1/hotels/search/:workflowId and GET /api/search-status/:workflowId
 * Queries status and results of an active or completed search workflow.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const searchStatusHandler = async (req: Request, res: Response): Promise<void> => {
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
