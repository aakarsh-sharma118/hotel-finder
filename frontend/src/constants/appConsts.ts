/**
 * Application constants and configuration.
 */

import { PAGE_STRINGS } from './pageStrings';
import { VALIDATION_REGEX, VALIDATION_MESSAGES } from './validation';
import { SelectOption } from '../components/common/CustomSelect';
import { loadJsonFromStorage, saveJsonToStorage } from '../utils/utilityManager';

export {
  PAGE_STRINGS,
  VALIDATION_REGEX,
  VALIDATION_MESSAGES,
  loadJsonFromStorage,
  saveJsonToStorage,
};

export const STORAGE_KEYS = {
  THEME: 'hotelfinder_theme',
  FAVORITES: 'hotelfinder_favorites',
  BOOKINGS: 'hotelfinder_bookings',
} as const;

export const GST_TAX_RATE = 0.12;

export const DEFAULT_DESTINATIONS = [
  'Meerut',
  'Goa',
  'Jaipur',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Agra',
  'Udaipur',
  'Manali',
  'Kochi',
  'Varanasi',
  'Amritsar',
  'Kolkata',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Paris',
  'London',
  'Tokyo',
  'New York',
  'Dubai',
] as const;

export const RECOGNIZED_DESTINATIONS = [
  'meerut',
  'goa',
  'mumbai',
  'delhi',
  'new delhi',
  'bangalore',
  'bengaluru',
  'jaipur',
  'agra',
  'udaipur',
  'manali',
  'kochi',
  'kerala',
  'varanasi',
  'amritsar',
  'kolkata',
  'chennai',
  'hyderabad',
  'pune',
  'paris',
  'london',
  'tokyo',
  'new york',
  'newyork',
  'dubai',
] as const;

export function isRecognizedDestination(city: string): boolean {
  if (!city) return false;
  const normalized = city.trim().toLowerCase();
  return RECOGNIZED_DESTINATIONS.some(
    (dest) => dest === normalized || normalized.includes(dest) || dest.includes(normalized)
  );
}


export const GUEST_OPTIONS: SelectOption[] = [
  { value: '1 Adult', label: '1 Adult' },
  { value: '2 Adults', label: '2 Adults' },
  { value: '2 Adults, 1 Child', label: '2 Adults, 1 Child' },
  { value: '3 Adults', label: '3 Adults' },
  { value: '4 Adults, 2 Rooms', label: '4 Adults, 2 Rooms' },
];

export const SORT_OPTIONS: SelectOption[] = [
  { value: 'cheapest', label: PAGE_STRINGS.results.sortOptions.cheapest },
  { value: 'stars', label: PAGE_STRINGS.results.sortOptions.stars },
  { value: 'name', label: PAGE_STRINGS.results.sortOptions.name },
  { value: 'favorites', label: PAGE_STRINGS.results.sortOptions.favorites },
];
