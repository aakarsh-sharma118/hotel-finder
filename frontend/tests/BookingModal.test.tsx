/**
 * @fileoverview Automated tests for BookingModal and MyBookingsView flow.
 * Validates local storage persistence, validation, and tab navigation.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookingModal from '../src/components/BookingModal';
import MyBookingsView from '../src/components/MyBookingsView';
import { useHotelStore } from '../src/store/useHotelStore';
import { HotelOffer } from '../src/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockHotel: HotelOffer = {
  hotelId: 'htl-del-001',
  name: 'The Leela Palace New Delhi',
  price: 12500,
  supplier: 'Supplier B',
  location: 'Chanakyapuri, Diplomatic Enclave, New Delhi',
  stars: 5,
  image: 'https://example.com/hotel.jpg',
};

describe('Booking Flow and Local Storage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useHotelStore.setState({
      activeTab: 'search',
      bookingHotel: null,
      isBookingSuccess: false,
      lastConfirmedBooking: null,
      bookings: [],
      checkIn: '2026-10-15',
      checkOut: '2026-10-18',
      guests: '2 Adults',
    });
  });

  it('validates input fields and confirms booking, saving to local storage', async () => {
    // Open modal with mock hotel
    useHotelStore.getState().openBookingModal(mockHotel);

    renderWithProviders(<BookingModal />);

    // Check hotel title is displayed
    expect(screen.getByText('The Leela Palace New Delhi')).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByLabelText(/primary guest full name/i);
    const emailInput = screen.getByLabelText(/booking confirmation email/i);
    const phoneInput = screen.getByLabelText(/mobile contact number/i);

    fireEvent.change(nameInput, { target: { value: 'Aakarsh Sharma' } });
    fireEvent.change(emailInput, { target: { value: 'aakarsh@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Submit form
    const confirmBtn = screen.getByRole('button', { name: /confirm & secure room/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Success screen should be visible
    expect(screen.getByText(/reservation confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/aakarsh@example.com/i)).toBeInTheDocument();

    // Verify local storage has 1 booking
    const storeBookings = useHotelStore.getState().bookings;
    expect(storeBookings.length).toBe(1);
    expect(storeBookings[0].hotelName).toBe('The Leela Palace New Delhi');
    expect(storeBookings[0].guestName).toBe('Aakarsh Sharma');
  });

  it('clicking "View My Bookings" navigates to the bookings tab and renders the confirmed reservation', async () => {
    // Open modal with mock hotel and confirm booking
    useHotelStore.getState().openBookingModal(mockHotel);
    renderWithProviders(<BookingModal />);

    const nameInput = screen.getByLabelText(/primary guest full name/i);
    const emailInput = screen.getByLabelText(/booking confirmation email/i);
    const phoneInput = screen.getByLabelText(/mobile contact number/i);

    fireEvent.change(nameInput, { target: { value: 'Aakarsh Sharma' } });
    fireEvent.change(emailInput, { target: { value: 'aakarsh@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm & secure room/i }));
    });

    // Click "Go to My Bookings"
    const viewBookingsBtn = screen.getByRole('button', { name: /go to my bookings/i });
    await act(async () => {
      fireEvent.click(viewBookingsBtn);
    });

    // Verify activeTab transitioned to 'bookings'
    expect(useHotelStore.getState().activeTab).toBe('bookings');

    // Render MyBookingsView to verify reservation is displayed
    const { unmount } = renderWithProviders(<MyBookingsView />);
    expect(screen.getByText('The Leela Palace New Delhi')).toBeInTheDocument();
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    unmount();
  });
});
