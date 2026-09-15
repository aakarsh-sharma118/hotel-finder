/**
 * @fileoverview Unit tests for the SearchResultsList component.
 * Verifies loading states, empty search outcomes, destination chip clicks, card rendering, and favorites persistence.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchResultsList } from '../src/components/SearchResultsList';
import { useHotelStore } from '../src/store/useHotelStore';
import { PAGE_STRINGS, STORAGE_KEYS, loadJsonFromStorage } from '../src/constants/appConsts';

// Mock hotelApi to prevent real HTTP calls during unit testing
vi.mock('../src/api/hotelApi', () => ({
  hotelApi: {
    getHotelCatalog: vi.fn().mockResolvedValue({
      city: 'All Destinations',
      total: 1,
      page: 1,
      limit: 200,
      totalPages: 1,
      count: 1,
      hotels: [],
    }),
    getDestinations: vi.fn().mockResolvedValue({ destinations: [], total: 0 }),
    getBookings: vi.fn().mockResolvedValue({ total: 0, page: 1, limit: 20, totalPages: 1, count: 0, bookings: [] }),
  },
  hotelApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Creates a fresh QueryClient instance for isolated test execution
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in test environment for deterministic assertions
        retry: false,
      },
    },
  });

// Helper function to render a component inside QueryClientProvider
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('SearchResultsList Component', () => {
  // Reset localStorage and store before each test run
  beforeEach(() => {
    localStorage.clear();
    useHotelStore.setState({
      city: 'Goa',
      viewMode: 'grid',
      sortBy: 'cheapest',
      supplierFilter: 'ALL',
      amenityFilter: null,
      favorites: {},
      backendHotels: [
        {
          hotelId: 'h-1',
          name: 'The Orchid Grand Palace',
          stars: 5,
          location: 'Goa - Waterfront Promenade',
          rateA: 2499,
          rateB: 2199,
          cheaperSupplier: 'Supplier B',
          price: 2199,
          savings: 300,
          image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          amenities: ['Free High-Speed WiFi', 'Complimentary Breakfast'],
        },
      ],
    });
  });

  // Test that skeleton cards display while search is in flight
  it('renders loading skeletons when isLoading is true', () => {
    renderWithProviders(
      <SearchResultsList
        isLoading={true}
        result={null}
        error={null}
        city="Goa"
      />
    );

    // Skeleton cards should be present in the document
    const skeletonCards = document.querySelectorAll('.skeleton-card');
    expect(skeletonCards.length).toBeGreaterThanOrEqual(3);
  });

  // Test dedicated empty state banner when no inventory matches
  it('renders dedicated no-results-found message when search returns NO_HOTELS_FOUND', () => {
    const emptyResult = {
      success: false,
      status: 'NO_HOTELS_FOUND' as const,
      bestDeal: null,
      allOffers: [],
      supplierA: { status: 'EMPTY' as const, count: 0 },
      supplierB: { status: 'EMPTY' as const, count: 0 },
      workflowId: 'test-wf-empty',
      city: 'UnknownCity',
      checkIn: '2026-10-01',
      checkOut: '2026-10-05',
    };

    renderWithProviders(
      <SearchResultsList
        isLoading={false}
        result={emptyResult}
        error={null}
        city="UnknownCity"
      />
    );

    // Verify empty state container and messages
    expect(screen.getByTestId('no-results-found')).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(PAGE_STRINGS.results.emptyState.title, 'i'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(PAGE_STRINGS.results.emptyState.description)
    ).toBeInTheDocument();
    expect(
      screen.getByText(PAGE_STRINGS.results.emptyState.resetButton)
    ).toBeInTheDocument();
  });

  // Test clicking destination pill in empty state updates destination in store
  it('clicking a destination pill in empty state updates destination', async () => {
    const emptyResult = {
      success: false,
      status: 'NO_HOTELS_FOUND' as const,
      bestDeal: null,
      allOffers: [],
      supplierA: { status: 'EMPTY' as const, count: 0 },
      supplierB: { status: 'EMPTY' as const, count: 0 },
      workflowId: 'test-wf-empty',
      city: 'UnknownCity',
      checkIn: '2026-10-01',
      checkOut: '2026-10-05',
    };

    renderWithProviders(
      <SearchResultsList
        isLoading={false}
        result={emptyResult}
        error={null}
        city="UnknownCity"
      />
    );

    // Click on the suggested Goa destination button
    const goaButton = screen.getByRole('button', { name: /Goa/i });
    await act(async () => {
      fireEvent.click(goaButton);
    });
    expect(useHotelStore.getState().city).toBe('Goa');
  });

  // Test that hotel cards render when catalog data is present
  it('renders verified hotel cards when results are available', () => {
    renderWithProviders(
      <SearchResultsList
        isLoading={false}
        result={null}
        error={null}
        city="Goa"
      />
    );

    // Check hotel card container and hotel item details
    expect(screen.getByTestId('search-results-list')).toBeInTheDocument();
    expect(screen.getByTestId('hotel-card-0')).toBeInTheDocument();
    expect(screen.getByText(/The Orchid Grand Palace/i)).toBeInTheDocument();
  });

  // Test that toggling favorite status persists in localStorage
  it('persists user favorites in JSON format in localStorage', () => {
    renderWithProviders(
      <SearchResultsList
        isLoading={false}
        result={null}
        error={null}
        city="Goa"
      />
    );

    // Click the favorite toggle button
    const favButton = screen.getByRole('button', { name: /Save to favorites/i });
    fireEvent.click(favButton);

    // Validate in-memory state and localStorage contents
    expect(useHotelStore.getState().favorites['h-1']).toBe(true);
    const stored = loadJsonFromStorage<Record<string, boolean>>(STORAGE_KEYS.FAVORITES, {});
    expect(stored['h-1']).toBe(true);
  });

  // Test interactive price range controls and preset buttons render properly
  it('renders interactive price range slider, badge, and preset buttons', () => {
    renderWithProviders(
      <SearchResultsList
        isLoading={false}
        result={null}
        error={null}
        city="Goa"
      />
    );

    // Verify price filter group container
    expect(screen.getByTestId('price-filter-group')).toBeInTheDocument();

    // Verify live price range badge exists
    expect(screen.getByTestId('price-range-badge')).toBeInTheDocument();

    // Verify range slider input
    const slider = screen.getByLabelText(/Filter maximum nightly rate/i);
    expect(slider).toBeInTheDocument();

    // Verify quick preset buttons
    expect(screen.getByRole('button', { name: /All Prices/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /< ₹3,000/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /₹3,000–₹6,000/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /> ₹6,000/i })).toBeInTheDocument();
  });

  // Test displaying All Destinations when city filter is empty
  it('displays All Destinations heading when city filter is empty', () => {
    renderWithProviders(
      <SearchResultsList
        isLoading={false}
        result={null}
        error={null}
        city=""
      />
    );

    // Verify heading contains All Destinations
    expect(screen.getByText(/All Destinations/i)).toBeInTheDocument();
  });

  // Test that hotels with Free Cancellation render badge and can be filtered
  it('renders Free Cancellation indicator and filters hotels when Free Cancellation perk is selected', () => {
    // Populate store with two hotels: one with Free Cancellation and one without
    useHotelStore.setState({
      city: 'Goa',
      amenityFilter: null,
      backendHotels: [
        {
          hotelId: 'h-free-cancel',
          name: 'Seaside Resort with Free Cancellation',
          stars: 5,
          location: 'Goa - North Beach',
          rateA: 3500,
          rateB: 3200,
          cheaperSupplier: 'Supplier B',
          price: 3200,
          savings: 300,
          image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          amenities: ['Free Cancellation', 'Free High-Speed WiFi', 'Complimentary Breakfast'],
        },
        {
          hotelId: 'h-standard-cancel',
          name: 'City Hotel Standard Policy',
          stars: 4,
          location: 'Goa - Central',
          rateA: 2500,
          rateB: 2800,
          cheaperSupplier: 'Supplier A',
          price: 2500,
          savings: 300,
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          amenities: ['Free High-Speed WiFi', 'Fitness Center'],
        },
      ],
    });

    const { rerender } = renderWithProviders(
      <SearchResultsList
        isLoading={false}
        result={null}
        error={null}
        city="Goa"
      />
    );

    // Both hotels initially present
    expect(screen.getByText(/Seaside Resort with Free Cancellation/i)).toBeInTheDocument();
    expect(screen.getByText(/City Hotel Standard Policy/i)).toBeInTheDocument();

    // Click the Free Cancellation filter button
    const freeCancelBtn = screen.getByRole('button', { name: /Free Cancellation/i });
    act(() => {
      fireEvent.click(freeCancelBtn);
    });

    // Rerender to reflect updated filter in query/store
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <SearchResultsList
          isLoading={false}
          result={null}
          error={null}
          city="Goa"
        />
      </QueryClientProvider>
    );

    // Only the hotel with Free Cancellation should now be visible
    expect(screen.getByText(/Seaside Resort with Free Cancellation/i)).toBeInTheDocument();
    expect(screen.queryByText(/City Hotel Standard Policy/i)).not.toBeInTheDocument();
  });
});

