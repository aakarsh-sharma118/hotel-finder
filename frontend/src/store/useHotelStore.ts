/**
 * @fileoverview Global Zustand state store for client-only UI state and preferences.
 * Manages theme, search input values, sorting, filtering, and modal dialogs.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module store/useHotelStore
 */

import { create } from 'zustand';
import { HotelOffer, SearchWorkflowResult, HotelCardData } from '../types';
import { hotelApi } from '../api/hotelApi';
import {
  STORAGE_KEYS,
  GST_TAX_RATE,
  loadJsonFromStorage,
  saveJsonToStorage,
} from '../constants/appConsts';
import {
  generateBookingReference,
  generateBookingId,
  calculateTaxAndTotal,
  decodeHtmlEntities,
} from '../utils/utilityManager';
import { PAGE_STRINGS } from '../constants/pageStrings';
import { getAppBasePath } from '../utils/basePath';

export type SortOption = 'cheapest' | 'stars' | 'name' | 'favorites';
export type AppTab = 'search' | 'bookings';
export type SupplierFilter = 'ALL' | 'Supplier A' | 'Supplier B';
export type PolicyModalType = 'privacy' | 'terms' | null;

export interface ConfirmedBooking {
  id: string;
  referenceCode: string;
  hotelId: string;
  hotelName: string;
  location: string;
  city: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  nightlyRate: number;
  totalPrice: number;
  supplier: string;
  guestName: string;
  guestEmail: string;
  bookedAt: string;
  status: 'CONFIRMED' | 'CANCELLED';
  image?: string;
}

interface HotelStoreState {
  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Navigation
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // Search form state
  city: string;
  checkIn: string;
  checkOut: string;
  guests: string;

  // Execution state
  activeWorkflowId: string | null;
  cancelStatus: string | null;
  lastSearchResult: SearchWorkflowResult | null;

  // Inventory
  backendHotels: HotelCardData[];
  isLoadingCatalog: boolean;

  // Filters and preferences
  viewMode: 'grid' | 'list';
  sortBy: SortOption;
  supplierFilter: SupplierFilter;
  amenityFilter: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  currentPage: number;
  favorites: Record<string, boolean>;
  bookingHotel: HotelOffer | null;
  isBookingSuccess: boolean;
  lastConfirmedBooking: ConfirmedBooking | null;

  // Modal state
  policyModal: PolicyModalType;
  setPolicyModal: (modal: PolicyModalType) => void;

  // Bookings
  bookings: ConfirmedBooking[];

  // Actions
  setCity: (city: string) => void;
  setCheckIn: (checkIn: string) => void;
  setCheckOut: (checkOut: string) => void;
  setGuests: (guests: string) => void;
  setActiveWorkflowId: (id: string | null) => void;
  setCancelStatus: (status: string | null) => void;
  setLastSearchResult: (result: SearchWorkflowResult | null) => void;
  setBackendHotels: (hotels: HotelCardData[]) => void;
  fetchCatalogForCity: (city: string) => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sort: SortOption) => void;
  setSupplierFilter: (filter: SupplierFilter) => void;
  setAmenityFilter: (amenity: string | null) => void;
  setMinPrice: (minPrice: number | null) => void;
  setMaxPrice: (maxPrice: number | null) => void;
  setCurrentPage: (page: number) => void;
  toggleFavorite: (hotelId: string) => void;
  openBookingModal: (hotel: HotelOffer) => void;
  closeBookingModal: () => void;
  confirmBookingWithDetails: (details: { guestName: string; guestEmail: string }) => ConfirmedBooking | null;
  cancelBooking: (bookingId: string) => void;
  selectDestination: (city: string) => void;
  resetForm: () => void;
}

// Hydrate stored data
const savedTheme = loadJsonFromStorage<'light' | 'dark'>(
  STORAGE_KEYS.THEME,
  'light'
);

const savedFavorites = loadJsonFromStorage<Record<string, boolean>>(
  STORAGE_KEYS.FAVORITES,
  {}
);

const rawBookings = loadJsonFromStorage<ConfirmedBooking[]>(
  STORAGE_KEYS.BOOKINGS,
  []
);
const savedBookings = rawBookings.map((b) => ({
  ...b,
  hotelName: decodeHtmlEntities(b.hotelName),
  location: decodeHtmlEntities(b.location),
}));

function applyThemeToDom(theme: 'light' | 'dark') {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }
}

// Sync initial theme
applyThemeToDom(savedTheme || 'light');

export const useHotelStore = create<HotelStoreState>((set, get) => ({
  theme: savedTheme || 'light',
  setTheme: (theme) => {
    applyThemeToDom(theme);
    set({ theme });
    saveJsonToStorage(STORAGE_KEYS.THEME, theme);
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  activeTab: 'search',
  setActiveTab: (activeTab) => set({ activeTab }),

  city: '',
  checkIn: '',
  checkOut: '',
  guests: '',

  activeWorkflowId: null,
  cancelStatus: null,
  lastSearchResult: null,

  backendHotels: [],
  isLoadingCatalog: false,

  viewMode: 'grid',
  sortBy: 'cheapest',
  supplierFilter: 'ALL',
  amenityFilter: null,
  minPrice: null,
  maxPrice: null,
  currentPage: 1,
  favorites: savedFavorites,
  bookingHotel: null,
  isBookingSuccess: false,
  lastConfirmedBooking: null,

  policyModal: null,
  setPolicyModal: (policyModal) => set({ policyModal }),

  bookings: savedBookings,

  setCity: (city) => set({ city }),
  setCheckIn: (checkIn) => set({ checkIn }),
  setCheckOut: (checkOut) => set({ checkOut }),
  setGuests: (guests) => set({ guests }),
  setActiveWorkflowId: (activeWorkflowId) => set({ activeWorkflowId }),
  setCancelStatus: (cancelStatus) => set({ cancelStatus }),
  setLastSearchResult: (lastSearchResult) => {
    set({ lastSearchResult });
    if (lastSearchResult?.hotels && lastSearchResult.hotels.length > 0) {
      set({ backendHotels: lastSearchResult.hotels });
    }
  },
  setBackendHotels: (backendHotels) => set({ backendHotels }),

  fetchCatalogForCity: async (city) => {
    // Allow empty destination string to load all verified hotels across India
    const targetCity = city.trim();
    set({ isLoadingCatalog: true });
    try {
      const res = await hotelApi.getHotelCatalog(targetCity, { limit: 200 });
      set({ backendHotels: res.hotels || [], isLoadingCatalog: false });
    } catch {
      set({ isLoadingCatalog: false });
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSupplierFilter: (supplierFilter) => set({ supplierFilter }),
  setAmenityFilter: (amenityFilter) => set({ amenityFilter }),
  setMinPrice: (minPrice) => set({ minPrice, currentPage: 1 }),
  setMaxPrice: (maxPrice) => set({ maxPrice, currentPage: 1 }),
  setCurrentPage: (currentPage) => set({ currentPage }),

  toggleFavorite: (hotelId) => {
    const updatedFavorites = {
      ...get().favorites,
      [hotelId]: !get().favorites[hotelId],
    };
    set({ favorites: updatedFavorites });
    saveJsonToStorage(STORAGE_KEYS.FAVORITES, updatedFavorites);
  },

  openBookingModal: (hotel) =>
    set({ bookingHotel: hotel, isBookingSuccess: false, lastConfirmedBooking: null }),
  closeBookingModal: () =>
    set({ bookingHotel: null, isBookingSuccess: false, lastConfirmedBooking: null }),

  confirmBookingWithDetails: ({ guestName, guestEmail }) => {
    const state = get();
    if (!state.bookingHotel) return null;

    const { total: totalPrice } = calculateTaxAndTotal(state.bookingHotel.price, GST_TAX_RATE);
    const refCode = generateBookingReference();

    const newBooking: ConfirmedBooking = {
      id: generateBookingId(),
      referenceCode: refCode,
      hotelId: state.bookingHotel.hotelId,
      hotelName: decodeHtmlEntities(state.bookingHotel.name),
      location: decodeHtmlEntities(state.bookingHotel.location || `${state.city || 'Meerut'} - ${PAGE_STRINGS.common.defaultLocationSuffix}`),
      city: state.city || 'Meerut',
      checkIn: state.checkIn || '2026-10-10',
      checkOut: state.checkOut || '2026-10-14',
      guests: state.guests || '2 Adults',
      nightlyRate: state.bookingHotel.price,
      totalPrice,
      supplier: state.bookingHotel.supplier || 'Supplier B',
      guestName,
      guestEmail,
      bookedAt: new Date().toISOString(),
      status: 'CONFIRMED',
      image: state.bookingHotel.image,
    };

    const updatedBookings = [newBooking, ...state.bookings];
    set({
      isBookingSuccess: true,
      lastConfirmedBooking: newBooking,
      bookings: updatedBookings,
    });
    saveJsonToStorage(STORAGE_KEYS.BOOKINGS, updatedBookings);
    return newBooking;
  },

  cancelBooking: (bookingId) => {
    const updatedBookings = get().bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b
    );
    set({ bookings: updatedBookings });
    saveJsonToStorage(STORAGE_KEYS.BOOKINGS, updatedBookings);
  },

  selectDestination: (city) => {
    const targetCity = city.trim();
    set({
      city: targetCity,
      activeTab: 'search',
      lastSearchResult: null,
      currentPage: 1,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  resetForm: () => {
    set({
      city: '',
      checkIn: '',
      checkOut: '',
      guests: '',
      supplierFilter: 'ALL',
      amenityFilter: null,
      minPrice: null,
      maxPrice: null,
      currentPage: 1,
      cancelStatus: null,
      lastSearchResult: null,
    });
    if (typeof window !== 'undefined') {
      // Use the dynamic base path so renaming the repo only needs an env var change
      const basePath = getAppBasePath();
      window.history.pushState({}, '', basePath ? `${basePath}/` : '/');
    }
  },
}));
