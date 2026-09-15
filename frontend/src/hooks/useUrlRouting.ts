import { useEffect, useCallback } from 'react';
import { useHotelStore, AppTab } from '../store/useHotelStore';
import { SearchHotelsParams } from '../types';
import { sanitizeInput, VALIDATION_REGEX } from '../constants/validation';
// Centralised base-path helper — reads VITE_REPO_BASE env var
import { getAppBasePath } from '../utils/basePath';

// Re-export so any legacy code that imported this from here still works
export { getAppBasePath };

interface UseUrlRoutingProps {
  onAutoSearch?: (params: SearchHotelsParams) => void;
}

export function useUrlRouting({ onAutoSearch }: UseUrlRoutingProps = {}) {
  const {
    activeTab,
    setActiveTab,
    city,
    checkIn,
    checkOut,
    guests,
    setCity,
    setCheckIn,
    setCheckOut,
    setGuests,
  } = useHotelStore();

  // Determine active tab from the current URL pathname
  const getTabFromPath = useCallback((pathname: string): AppTab => {
    // Strip the repo base prefix before checking the path segment
    const base = getAppBasePath();
    const cleanPath = (base ? pathname.replace(base, '') : pathname).toLowerCase();
    if (cleanPath.startsWith('/bookings')) return 'bookings';
    return 'search';
  }, []);

  // Navigate tab
  const navigateToTab = useCallback(
    (tab: AppTab) => {
      setActiveTab(tab);
      const basePath = getAppBasePath();
      let targetPath = basePath ? `${basePath}/` : '/';

      if (tab === 'bookings') {
        targetPath = basePath ? `${basePath}/bookings` : '/bookings';
      } else {
        const searchParams = new URLSearchParams();
        if (city) searchParams.set('city', city);
        if (checkIn) searchParams.set('checkIn', checkIn);
        if (checkOut) searchParams.set('checkOut', checkOut);
        if (guests) searchParams.set('guests', String(guests));

        const queryStr = searchParams.toString();
        targetPath = queryStr
          ? (basePath ? `${basePath}/?${queryStr}` : `/?${queryStr}`)
          : (basePath ? `${basePath}/` : '/');
      }

      if (window.location.pathname + window.location.search !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    },
    [setActiveTab, city, checkIn, checkOut, guests]
  );

  // Sync search to URL
  const syncSearchToUrl = useCallback(
    (params: { city: string; checkIn: string; checkOut: string; guests: number }) => {
      const basePath = getAppBasePath();
      const searchParams = new URLSearchParams();
      if (params.city) searchParams.set('city', params.city);
      if (params.checkIn) searchParams.set('checkIn', params.checkIn);
      if (params.checkOut) searchParams.set('checkOut', params.checkOut);
      if (params.guests) searchParams.set('guests', String(params.guests));

      const queryStr = searchParams.toString();
      const newUrl = queryStr
        ? (basePath ? `${basePath}/?${queryStr}` : `/?${queryStr}`)
        : (basePath ? `${basePath}/` : '/');
      window.history.pushState({ tab: 'search', ...params }, '', newUrl);
    },
    []
  );

  // Read URL on mount
  useEffect(() => {
    const initialTab = getTabFromPath(window.location.pathname);
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
    }

    // Parse search params
    const urlParams = new URLSearchParams(window.location.search);
    const rawCity = urlParams.get('city') || urlParams.get('destination');
    const rawCheckIn = urlParams.get('checkIn');
    const rawCheckOut = urlParams.get('checkOut');
    const rawGuests = urlParams.get('guests');

    if (rawCity) {
      const sanitizedCity = sanitizeInput(rawCity);
      setCity(sanitizedCity);
    }
    if (rawCheckIn) {
      setCheckIn(sanitizeInput(rawCheckIn));
    }
    if (rawCheckOut) {
      setCheckOut(sanitizeInput(rawCheckOut));
    }
    if (rawGuests && !isNaN(Number(rawGuests))) {
      setGuests(String(Math.max(1, Math.min(8, Number(rawGuests)))));
    }

    // Auto search if query params exist
    if (
      initialTab === 'search' &&
      rawCity &&
      rawCheckIn &&
      rawCheckOut &&
      VALIDATION_REGEX.city.test(rawCity.trim()) &&
      onAutoSearch
    ) {
      onAutoSearch({
        city: rawCity.trim(),
        checkIn: rawCheckIn.trim(),
        checkOut: rawCheckOut.trim(),
      });
    }

    // Handle browser back/forward navigation
    const handlePopState = () => {
      const currentTab = getTabFromPath(window.location.pathname);
      setActiveTab(currentTab);

      if (currentTab === 'search') {
        const p = new URLSearchParams(window.location.search);
        const popCity = p.get('city') || p.get('destination');
        const popCheckIn = p.get('checkIn');
        const popCheckOut = p.get('checkOut');
        const popGuests = p.get('guests');

        if (popCity) setCity(sanitizeInput(popCity));
        if (popCheckIn) setCheckIn(sanitizeInput(popCheckIn));
        if (popCheckOut) setCheckOut(sanitizeInput(popCheckOut));
        if (popGuests) setGuests(sanitizeInput(popGuests));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return {
    navigateToTab,
    syncSearchToUrl,
  };
}
