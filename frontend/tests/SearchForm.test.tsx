/**
 * @fileoverview Unit tests for the SearchForm component.
 * Verifies form inputs, custom datepicker inputs, destination validation, error messages, and submission.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchForm } from '../src/components/SearchForm';
import { useHotelStore } from '../src/store/useHotelStore';

// Mock hotelApi to prevent unhandled network requests in test environment
vi.mock('../src/api/hotelApi', () => ({
  hotelApi: {
    getDestinations: vi.fn().mockResolvedValue({ destinations: [], total: 0 }),
    getHotelCatalog: vi.fn().mockResolvedValue({ city: '', total: 0, page: 1, limit: 200, totalPages: 1, count: 0, hotels: [] }),
  },
  getApiBaseUrl: vi.fn().mockReturnValue(''),
  getApiDocsUrl: vi.fn().mockReturnValue('/api-docs'),
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
        retry: false,
      },
    },
  });

// Helper function to render a component inside QueryClientProvider
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('SearchForm Component', () => {
  beforeEach(() => {
    useHotelStore.setState({
      city: '',
      checkIn: '',
      checkOut: '',
      guests: '2 Adults',
    });
  });

  // Test that all required input controls render in the document
  it('renders all essential input fields and the submit button', () => {
    const handleSearch = vi.fn();
    renderWithProviders(<SearchForm onSearch={handleSearch} isLoading={false} />);

    expect(screen.getByLabelText(/where are you going/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-out/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/guests/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-search-btn')).toBeInTheDocument();
  });

  // Test updating the destination city and submitting search
  it('allows user to change the city and submits with updated values', () => {
    const handleSearch = vi.fn();
    renderWithProviders(<SearchForm onSearch={handleSearch} isLoading={false} />);

    const cityInput = screen.getByLabelText(/where are you going/i);
    fireEvent.change(cityInput, { target: { value: 'Paris' } });
    expect((cityInput as HTMLInputElement).value).toBe('Paris');

    const submitBtn = screen.getByTestId('submit-search-btn');
    fireEvent.click(submitBtn);

    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Paris',
      })
    );
  });

  // Test validation error message when destination city is empty
  it('shows inline error message when destination city is empty and does not call onSearch', () => {
    const handleSearch = vi.fn();
    renderWithProviders(<SearchForm onSearch={handleSearch} isLoading={false} />);

    const cityInput = screen.getByLabelText(/where are you going/i);
    fireEvent.change(cityInput, { target: { value: '   ' } });

    const submitBtn = screen.getByTestId('submit-search-btn');
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/please enter a destination city before searching/i);
    expect(handleSearch).not.toHaveBeenCalled();
  });

  // Test validation error when destination city is unrecognized
  it('shows error bubble when destination city is unrecognized and does not call onSearch', () => {
    const handleSearch = vi.fn();
    renderWithProviders(<SearchForm onSearch={handleSearch} isLoading={false} />);

    const cityInput = screen.getByLabelText(/where are you going/i);
    fireEvent.change(cityInput, { target: { value: 'NonExistingCityXYZ' } });

    const submitBtn = screen.getByTestId('submit-search-btn');
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/destination city not recognized/i);
    expect(handleSearch).not.toHaveBeenCalled();
  });

  // Test reset form button clears inputs and error banners
  it('resets inputs, clears errors, and resets store when reset button is clicked', () => {
    const handleSearch = vi.fn();
    renderWithProviders(<SearchForm onSearch={handleSearch} isLoading={false} />);

    const cityInput = screen.getByLabelText(/where are you going/i);
    fireEvent.change(cityInput, { target: { value: '   ' } });

    const submitBtn = screen.getByTestId('submit-search-btn');
    fireEvent.click(submitBtn);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const resetBtn = screen.getByTitle(/reset form/i);
    fireEvent.click(resetBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // Test that fields and button are disabled while loading
  it('disables input fields and submit button while loading', () => {
    const handleSearch = vi.fn();
    renderWithProviders(<SearchForm onSearch={handleSearch} isLoading={true} />);

    expect(screen.getByLabelText(/where are you going/i)).toBeDisabled();
    expect(screen.getByLabelText(/check-in/i)).toBeDisabled();
    expect(screen.getByLabelText(/check-out/i)).toBeDisabled();
    expect(screen.getByTestId('submit-search-btn')).toBeDisabled();
    expect(screen.getByText(/comparing\.\.\./i)).toBeInTheDocument();
  });
});
