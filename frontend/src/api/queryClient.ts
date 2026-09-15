/**
 * @fileoverview Centralized TanStack Query client configuration.
 * Configures caching policies, retry behaviors, and query deduplication defaults.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module api/queryClient
 */

import { QueryClient } from '@tanstack/react-query';

// Centralized QueryClient instance for caching server state
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 5 minutes before background refetch
      staleTime: 5 * 60 * 1000,
      // Unused cached data is kept in memory for 15 minutes
      gcTime: 15 * 60 * 1000,
      // Retry failed network requests once before showing error
      retry: 1,
      // Disable automatic refetching on window focus to save bandwidth
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
