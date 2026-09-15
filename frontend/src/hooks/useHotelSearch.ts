/**
 * @fileoverview Custom React hook managing hotel rate comparison search requests.
 * Uses TanStack Query mutations to trigger workflow executions and cancellations.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module hooks/useHotelSearch
 */

import { useMutation } from '@tanstack/react-query';
import { hotelApi } from '../api/hotelApi';
import { SearchHotelsParams, SearchWorkflowResult } from '../types';
import { useHotelStore } from '../store/useHotelStore';
import { PAGE_STRINGS } from '../constants/pageStrings';

export function useHotelSearch() {
  const {
    setActiveWorkflowId,
    setLastSearchResult,
    setCancelStatus,
  } = useHotelStore();

  // Mutation for executing rate comparison search
  const searchMutation = useMutation<SearchWorkflowResult, Error, SearchHotelsParams>({
    mutationFn: async (params: SearchHotelsParams) => {
      return await hotelApi.searchHotels(params);
    },
    onSuccess: (data) => {
      // Store result in global state
      setLastSearchResult(data);
    },
    onError: () => {
      setCancelStatus(null);
    },
  });

  // Mutation for cancelling an active workflow
  const cancelMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      return await hotelApi.cancelSearch(workflowId);
    },
    onSuccess: () => {
      setCancelStatus(PAGE_STRINGS.searchHook.cancelledByUser);
      searchMutation.reset();
    },
    onError: (error: any) => {
      setCancelStatus(PAGE_STRINGS.searchHook.cancelFailed(error.message || PAGE_STRINGS.searchHook.unknownError));
    },
  });

  // Function to initiate search with deterministic workflow ID
  const triggerSearch = async (params: SearchHotelsParams) => {
    const generatedWorkflowId = `hr-${params.city.toLowerCase()}-${Date.now().toString(36)}`;
    setActiveWorkflowId(generatedWorkflowId);
    setCancelStatus(null);

    return searchMutation.mutateAsync({
      ...params,
      workflowId: generatedWorkflowId,
    });
  };

  // Function to trigger workflow cancellation
  const triggerCancel = async (workflowId: string) => {
    return cancelMutation.mutateAsync(workflowId);
  };

  return {
    search: triggerSearch,
    cancel: triggerCancel,
    isLoading: searchMutation.isPending,
    isCancelling: cancelMutation.isPending,
    result: searchMutation.data || null,
    error: searchMutation.error ? (searchMutation.error as any)?.response?.data?.error || searchMutation.error.message : null,
    reset: searchMutation.reset,
  };
}
