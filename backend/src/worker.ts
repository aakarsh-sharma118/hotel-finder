import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities/supplierActivities';
import { SERVER_CONFIG } from './constants/appConsts';

export const TASK_QUEUE_NAME = SERVER_CONFIG.TASK_QUEUE_NAME;

/**
 * Builds a NativeConnection config that supports both:
 *  - Local Temporal server (plain TCP, no TLS)
 *  - Temporal Cloud (mTLS via TEMPORAL_API_KEY)
 */
function getConnectionOptions(): Parameters<typeof NativeConnection.connect>[0] {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233';
  const apiKey = process.env.TEMPORAL_API_KEY;

  if (apiKey) {
    // Temporal Cloud: authenticate via API key over TLS
    return {
      address: temporalAddress,
      tls: true,
      apiKey,
    };
  }

  // Local Temporal server: plain TCP, no auth required
  return { address: temporalAddress };
}

/**
 * Starts the Temporal background worker with an auto-reconnect loop.
 * If Temporal is unavailable, it retries every 10 seconds so the server
 * falls back gracefully to direct rate comparison mode.
 */
export async function runWorker() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233';
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE || 'default';
  let isShuttingDown = false;

  const handleShutdown = () => {
    isShuttingDown = true;
  };
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  console.log(`[Worker] Initializing Temporal background worker for task queue "${TASK_QUEUE_NAME}"...`);
  console.log(`[Worker] Target Temporal address: ${temporalAddress} | Namespace: ${temporalNamespace}`);

  const maxAttempts =
    parseInt(process.env.TEMPORAL_MAX_CONNECT_ATTEMPTS || '', 10) ||
    SERVER_CONFIG.MAX_TEMPORAL_CONNECT_ATTEMPTS ||
    5;
  let attemptCount = 0;

  while (!isShuttingDown && attemptCount < maxAttempts) {
    attemptCount += 1;
    try {
      console.log(
        `[Worker] Attempt ${attemptCount}/${maxAttempts}: Connecting to Temporal server at ${temporalAddress}...`
      );
      const connection = await NativeConnection.connect(getConnectionOptions());

      const worker = await Worker.create({
        connection,
        namespace: temporalNamespace,
        taskQueue: TASK_QUEUE_NAME,
        workflowsPath: require.resolve('./workflows/hotelSearchWorkflow'),
        activities,
      });

      console.log(`[Worker] Successfully connected! Temporal Worker listening on task queue "${TASK_QUEUE_NAME}".`);
      await worker.run();
      break;
    } catch (err: any) {
      if (isShuttingDown) break;

      const isConnectionRefused =
        err?.message?.includes('ConnectionRefused') ||
        err?.message?.includes('actively refused') ||
        err?.message?.includes('tcp connect error') ||
        err?.message?.includes('ConnectError') ||
        err?.message?.includes('UNAVAILABLE');

      if (attemptCount >= maxAttempts) {
        console.warn(
          `[Worker] Max connection attempts (${maxAttempts}/${maxAttempts}) reached. Temporal server is offline.`
        );
        console.log(
          `[Worker] Worker is standing down. The backend will continue operating in Resilient Direct-Comparison fallback mode.`
        );
        break;
      }

      if (isConnectionRefused) {
        console.warn(
          `[Worker] Temporal server is currently offline or unreachable at ${temporalAddress}.`
        );
        console.log(
          `[Worker] The backend is operating in Resilient Direct-Comparison fallback mode.`
        );
        console.log(
          `[Worker] Retrying in 10s (attempt ${attemptCount}/${maxAttempts})...`
        );
      } else {
        console.error(`[Worker] Temporal worker error: ${err?.message || err}. Retrying in 10s...`);
      }

      // Wait 10 seconds before next connection attempt
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  if (isShuttingDown) {
    console.log('[Worker] Gracefully shut down Temporal worker.');
  } else if (attemptCount >= maxAttempts) {
    console.log('[Worker] Worker entered standby mode. Backend continues in direct fallback mode.');
    // Keep process alive in standby so dev processes do not terminate
    while (!isShuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }
}

if (require.main === module || process.argv[1]?.includes('worker.ts')) {
  runWorker().catch((err) => {
    console.error('[Worker] Unexpected error in worker process:', err);
  });
}
