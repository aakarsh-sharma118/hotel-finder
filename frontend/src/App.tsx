/**
 * @fileoverview Main React application component for Hotel Rate Comparator.
 * Configures QueryClientProvider, layout containers, and view routing.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module App
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { Sparkles, ShieldCheck, Clock, Percent } from 'lucide-react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import SearchResultsList from './components/SearchResultsList';
import BookingModal from './components/BookingModal';
import InformationModal from './components/InformationModal';
import MyBookingsView from './components/MyBookingsView';
import Footer from './components/Footer';
import { useHotelStore } from './store/useHotelStore';
import { useHotelSearch } from './hooks/useHotelSearch';
import { useUrlRouting } from './hooks/useUrlRouting';
import { SearchHotelsParams } from './types';
import { PAGE_STRINGS } from './constants/pageStrings';
import { queryClient } from './api/queryClient';

function HotelComparatorApp() {
  const { city, activeTab } = useHotelStore();
  const { search, isLoading, result, error } = useHotelSearch();

  const handleSearch = async (params: SearchHotelsParams) => {
    try {
      await search(params);
    } catch {
      // Handled in useHotelSearch
    }
  };

  useUrlRouting({ onAutoSearch: handleSearch });

  return (
    <div className="site-wrapper">
      {/* Header */}
      <Header />

      {/* Main Content */}
      {activeTab === 'search' && (
        <>
          {/* Hero */}
          <section className="hero-section" data-testid="hero-comparator-section">
            <div className="hero-backdrop">
              <div className="hero-glow-orb hero-glow-1"></div>
              <div className="hero-glow-orb hero-glow-2"></div>
              <div className="hero-glow-orb hero-glow-3"></div>
              <div className="hero-grid-pattern"></div>
            </div>

            <div className="hero-content">
              {/* Badge */}
              <div className="hero-kicker-pill">
                <Sparkles size={14} className="hero-kicker-sparkle" />
                <span className="hero-kicker-text">{PAGE_STRINGS.hero.kicker}</span>
                <span className="hero-kicker-dot">•</span>
                <span className="hero-kicker-rupee">{PAGE_STRINGS.hero.rupeePill}</span>
              </div>

              <h1 className="hero-title">
                {PAGE_STRINGS.hero.titlePrefix}{' '}
                <span className="hero-highlight">{PAGE_STRINGS.hero.titleHighlight}</span>
                <br />
                {PAGE_STRINGS.hero.titleSuffix}
              </h1>

              <p className="hero-subtitle">{PAGE_STRINGS.hero.subtitle}</p>

              {/* Trust Badges */}
              <div className="hero-trust-row">
                <div className="hero-trust-item">
                  <ShieldCheck size={14} color="#16a34a" />
                  <span>{PAGE_STRINGS.hero.trustBadges.parity}</span>
                </div>
                <div className="hero-trust-item">
                  <Percent size={14} color="#0284c7" />
                  <span>{PAGE_STRINGS.hero.trustBadges.markup}</span>
                </div>
                <div className="hero-trust-item">
                  <Clock size={14} color="#f59e0b" />
                  <span>{PAGE_STRINGS.hero.trustBadges.sla}</span>
                </div>
              </div>

              {/* Search Form */}
              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>
          </section>

          {/* Results */}
          <main className="main-content-layout full-width-layout">
            <div className="results-column">
              <SearchResultsList
                isLoading={isLoading}
                result={result}
                error={error}
                city={city}
              />
            </div>
          </main>
        </>
      )}

      {activeTab === 'bookings' && <MyBookingsView />}

      {/* Booking Modal */}
      <BookingModal />

      {/* Policy Modal */}
      <InformationModal />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HotelComparatorApp />
    </QueryClientProvider>
  );
}

export default App;
