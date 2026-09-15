/**
 * @fileoverview Search results listing component for Hotel Rate Comparator.
 * Displays comparison outcomes, supplier winner badges, price filtering, and pagination.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module components/SearchResultsList
 */

import React, { useEffect } from 'react';
import {
  Heart,
  Star,
  MapPin,
  Grid,
  List,
  AlertCircle,
  ArrowUpDown,
  Check,
  ShieldCheck,
  Sparkles,
  Filter,
  SearchX,
  RotateCcw,
  Compass,
  IndianRupee,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { HotelListSkeleton } from './skeletons/HotelListSkeleton';
import { SearchWorkflowResult, HotelCardData } from '../types';
import { useHotelStore, SortOption } from '../store/useHotelStore';
import { useHotelCatalogQuery } from '../hooks/useHotelQueries';
import { PAGE_STRINGS, SORT_OPTIONS, DEFAULT_DESTINATIONS } from '../constants/appConsts';
import { formatPriceINR, decodeHtmlEntities } from '../utils/utilityManager';
import { CustomSelect } from './common/CustomSelect';

interface SearchResultsListProps {
  isLoading: boolean;
  result: SearchWorkflowResult | null;
  error: string | null;
  city: string;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  isLoading,
  result,
  error,
  city,
}) => {
  const {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    supplierFilter,
    setSupplierFilter,
    amenityFilter,
    setAmenityFilter,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    currentPage,
    setCurrentPage,
    favorites,
    toggleFavorite,
    openBookingModal,
    selectDestination,
    resetForm,
    backendHotels,
    isLoadingCatalog,
    fetchCatalogForCity,
  } = useHotelStore();

  // Determine current display city (empty string indicates all destinations across India)
  const displayCity = city.trim() || result?.city || '';

  // Fetch hotel catalog via TanStack Query when no search workflow result is active (fetch all available stays)
  const { data: catalogData, isLoading: isCatalogQueryLoading } = useHotelCatalogQuery(displayCity, {
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    page: 1,
    limit: 200,
  });

  // Fetch initial catalog on load if empty
  useEffect(() => {
    if (backendHotels.length === 0 && !result && !isLoading) {
      fetchCatalogForCity(displayCity);
    }
  }, [displayCity, backendHotels.length, result, isLoading, fetchCatalogForCity]);

  // Check if search returned zero results
  const isNoResultsFound = Boolean(
    result &&
      (result.status === 'NO_HOTELS_FOUND' ||
        (result.status === 'SUCCESS' && (!result.allOffers || result.allOffers.length === 0)))
  );

  // Pick source hotel list (workflow results take precedence, followed by query data, then store)
  const rawHotelCards: HotelCardData[] =
    result && result.hotels && result.hotels.length > 0
      ? result.hotels
      : catalogData?.hotels && catalogData.hotels.length > 0
        ? catalogData.hotels
        : backendHotels;

  // Apply supplier filter
  let filteredHotels = rawHotelCards;
  if (supplierFilter !== 'ALL') {
    filteredHotels = filteredHotels.filter((h) => h.cheaperSupplier === supplierFilter);
  }

  // Apply amenity filter
  if (amenityFilter) {
    filteredHotels = filteredHotels.filter((h) =>
      h.amenities.some((a) => a.toLowerCase().includes(amenityFilter.toLowerCase()))
    );
  }

  // Apply price range filters
  if (minPrice !== null && minPrice > 0) {
    filteredHotels = filteredHotels.filter((h) => h.price >= minPrice);
  }
  if (maxPrice !== null && maxPrice > 0) {
    filteredHotels = filteredHotels.filter((h) => h.price <= maxPrice);
  }

  // Apply favorites filter
  if (sortBy === 'favorites') {
    filteredHotels = filteredHotels.filter((h) => favorites[h.hotelId] === true);
  }

  const getHotelRating = (h: HotelCardData): number => {
    if (h.rating !== undefined && h.rating !== null && !isNaN(Number(h.rating))) {
      return Number(h.rating);
    }
    return Number(h.stars || 0);
  };

  // Apply sorting
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    if (sortBy === 'cheapest' || sortBy === 'favorites') return a.price - b.price;
    if (sortBy === 'stars') {
      const ratingA = getHotelRating(a);
      const ratingB = getHotelRating(b);
      if (Math.abs(ratingB - ratingA) > 0.001) {
        return ratingB - ratingA;
      }
      if (b.stars !== a.stars) {
        return b.stars - a.stars;
      }
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    }
    if (sortBy === 'name') return decodeHtmlEntities(a.name).localeCompare(decodeHtmlEntities(b.name));
    return 0;
  });

  // Calculate pagination slice (6 hotels per page)
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(sortedHotels.length / ITEMS_PER_PAGE));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedHotels = sortedHotels.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  // Compute responsive windowed pagination numbers to cleanly support large catalogs
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (activePage > 3) {
      pages.push('...');
    }
    const start = Math.max(2, activePage - 1);
    const end = Math.min(totalPages - 1, activePage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (activePage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  // Show skeleton during loading
  const showLoadingSkeleton = isLoading || (isLoadingCatalog && rawHotelCards.length === 0 && isCatalogQueryLoading);

  return (
    <section id="search-results" className="search-results-section" data-testid="search-results-list">
      {/* Section Header */}
      <div className="results-header-container">
        <div className="results-header-left">
          <div className="results-title-badge-row">
            <h2 className="results-title">
              {displayCity
                ? `${PAGE_STRINGS.results.heading} (${displayCity} • ${sortedHotels.length} ${sortedHotels.length === 1 ? 'Hotel' : 'Hotels'})`
                : `${PAGE_STRINGS.results.heading} (All Destinations • ${sortedHotels.length} ${sortedHotels.length === 1 ? 'Hotel' : 'Hotels'})`}
            </h2>
            <span className="results-currency-badge">
              Prices in {PAGE_STRINGS.currency.symbol} ({PAGE_STRINGS.currency.code})
            </span>
          </div>
          <p className="results-subheading">{PAGE_STRINGS.results.subheading}</p>
        </div>
      </div>

      {/* Filters, Price Range, and Sorting Bar */}
      {!showLoadingSkeleton && !error && !isNoResultsFound && (
        <div className="results-filters-bar">
          {/* Main Filter Section: Two-Column Layout */}
          <div className="filters-main-layout">
            {/* Left Column: Quick Filter Groups */}
            <div className="filters-categories-column">
              {/* Supplier Filter Category */}
              <div className="filter-category-block">
                <span className="filter-category-title">
                  <Filter size={13} /> {PAGE_STRINGS.results.filters.providerLabel}
                </span>
                <div className="filter-pills-row">
                  <button
                    type="button"
                    className={`filter-pill-btn ${supplierFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSupplierFilter('ALL')}
                  >
                    {PAGE_STRINGS.results.filters.allProviders}
                  </button>
                  <button
                    type="button"
                    className={`filter-pill-btn ${supplierFilter === 'Supplier A' ? 'active' : ''}`}
                    onClick={() => setSupplierFilter('Supplier A')}
                  >
                    {PAGE_STRINGS.results.filters.supplierAOnly}
                  </button>
                  <button
                    type="button"
                    className={`filter-pill-btn ${supplierFilter === 'Supplier B' ? 'active' : ''}`}
                    onClick={() => setSupplierFilter('Supplier B')}
                  >
                    {PAGE_STRINGS.results.filters.supplierBOnly}
                  </button>
                </div>
              </div>

              {/* Amenity Filter Category */}
              <div className="filter-category-block">
                <span className="filter-category-title">
                  <Sparkles size={13} /> Perks & Inclusions
                </span>
                <div className="filter-pills-row">
                  <button
                    type="button"
                    className={`amenity-filter-btn ${amenityFilter === 'Cancellation' ? 'active' : ''}`}
                    onClick={() => setAmenityFilter(amenityFilter === 'Cancellation' ? null : 'Cancellation')}
                  >
                    {PAGE_STRINGS.results.filters.freeCancellation}
                  </button>
                  <button
                    type="button"
                    className={`amenity-filter-btn ${amenityFilter === 'Breakfast' ? 'active' : ''}`}
                    onClick={() => setAmenityFilter(amenityFilter === 'Breakfast' ? null : 'Breakfast')}
                  >
                    {PAGE_STRINGS.results.filters.breakfastIncluded}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Dedicated Interactive Budget Card */}
            <div className="filter-price-card" data-testid="price-filter-group">
              <div className="price-card-header">
                <span className="filter-category-title">
                  <IndianRupee size={13} /> Nightly Budget
                </span>
                <div className="price-header-actions">
                  <span className="price-range-badge" data-testid="price-range-badge">
                    ₹{formatPriceINR(minPrice || 1000)} – ₹{formatPriceINR(maxPrice || 15000)}
                  </span>
                  {(minPrice !== null || (maxPrice !== null && maxPrice < 15000)) && (
                    <button
                      type="button"
                      className="price-reset-pill-btn"
                      onClick={() => {
                        setMinPrice(null);
                        setMaxPrice(null);
                      }}
                      title="Reset budget filter"
                      aria-label="Reset price filter"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Range Slider */}
              <div className="price-slider-row">
                <span className="slider-bound">₹1,000</span>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={maxPrice ?? 15000}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxPrice(val >= 15000 ? null : val);
                  }}
                  className="price-range-slider"
                  aria-label="Filter maximum nightly rate"
                />
                <span className="slider-bound">₹15,000+</span>
              </div>

              {/* Quick Range Presets */}
              <div className="price-presets-wrap">
                <button
                  type="button"
                  className={`filter-pill-btn ${minPrice === null && (maxPrice === null || maxPrice >= 15000) ? 'active' : ''}`}
                  onClick={() => {
                    setMinPrice(null);
                    setMaxPrice(null);
                  }}
                >
                  All Prices
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${minPrice === null && maxPrice === 3000 ? 'active' : ''}`}
                  onClick={() => {
                    setMinPrice(null);
                    setMaxPrice(3000);
                  }}
                >
                  &lt; ₹3,000
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${minPrice === 3000 && maxPrice === 6000 ? 'active' : ''}`}
                  onClick={() => {
                    setMinPrice(3000);
                    setMaxPrice(6000);
                  }}
                >
                  ₹3,000–₹6,000
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${minPrice === 6000 && (maxPrice === null || maxPrice >= 15000) ? 'active' : ''}`}
                  onClick={() => {
                    setMinPrice(6000);
                    setMaxPrice(null);
                  }}
                >
                  &gt; ₹6,000
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Results Count Indicator + Sorting & Layout Controls */}
          <div className="filters-row-controls">
            <div className="results-count-chip">
              <Compass size={14} className="count-icon" />
              <span>
                Showing <strong>{sortedHotels.length}</strong> {sortedHotels.length === 1 ? 'verified stay' : 'verified stays'}
                {displayCity ? ` in ${displayCity}` : ' across India'}
              </span>
            </div>

            <div className="controls-right-cluster">
              <div className="sort-dropdown-wrap">
                <CustomSelect
                  id="sort-hotels-select"
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(val) => setSortBy(val as SortOption)}
                  icon={<ArrowUpDown size={14} color="#64748b" />}
                />
              </div>

              {/* Icon-only view-mode toggle — Grid or List */}
              <div className="view-toggle-group" role="group" aria-label={PAGE_STRINGS.results.viewModeAriaLabel}>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title={PAGE_STRINGS.results.gridViewLabel}
                  aria-label={PAGE_STRINGS.results.gridViewLabel}
                >
                  {/* Grid icon */}
                  <Grid size={16} />
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title={PAGE_STRINGS.results.listViewLabel}
                  aria-label={PAGE_STRINGS.results.listViewLabel}
                >
                  {/* List icon */}
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {showLoadingSkeleton && <HotelListSkeleton count={6} />}

      {/* Error Banner */}
      {!isLoading && error && (
        <div className="results-alert alert-error" data-testid="results-error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>{PAGE_STRINGS.results.searchInterrupted}</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* No Results Found */}
      {!isLoading && !error && isNoResultsFound && (
        <div className="empty-results-card" data-testid="no-results-found">
          <div className="empty-icon-wrap">
            <SearchX size={32} />
          </div>
          <h3 className="empty-title">{PAGE_STRINGS.results.emptyState.title}</h3>
          <p className="empty-desc">{PAGE_STRINGS.results.emptyState.description}</p>

          <div className="suggested-destinations-box">
            <span className="suggested-label">
              <Compass size={14} /> {PAGE_STRINGS.results.emptyState.popularCitiesTitle}
            </span>
            <div className="destination-chips-wrap">
              {DEFAULT_DESTINATIONS.slice(0, 6).map((cityName) => (
                <button
                  key={cityName}
                  type="button"
                  className="destination-chip-btn"
                  onClick={() => selectDestination(cityName)}
                >
                  <MapPin size={12} /> {cityName}
                </button>
              ))}
            </div>
          </div>

          <div className="empty-actions">
            <button
              type="button"
              className="btn-empty-reset"
              onClick={resetForm}
            >
              <RotateCcw size={15} /> {PAGE_STRINGS.results.emptyState.resetButton}
            </button>
          </div>
        </div>
      )}

      {/* Empty Filter State */}
      {!showLoadingSkeleton && !error && !isNoResultsFound && sortedHotels.length === 0 && (
        sortBy === 'favorites' ? (
          <div className="results-alert alert-empty" data-testid="empty-favorites-banner">
            <Heart size={24} color="#ef4444" />
            <div>
              <strong>{PAGE_STRINGS.results.favoritesEmptyTitle}</strong>
              <p>{PAGE_STRINGS.results.favoritesEmptyDesc}</p>
            </div>
          </div>
        ) : (
          <div className="empty-results-card" data-testid="empty-filters-banner" style={{ padding: '2.5rem 1.5rem' }}>
            <div className="empty-icon-wrap" style={{ width: '56px', height: '56px', marginBottom: '1rem' }}>
              <Filter size={26} />
            </div>
            <h3 className="empty-title" style={{ fontSize: '1.25rem' }}>
              {PAGE_STRINGS.results.emptyState.filterEmptyTitle}
            </h3>
            <p className="empty-desc" style={{ maxWidth: '480px', marginBottom: '1.25rem' }}>
              {PAGE_STRINGS.results.emptyState.filterEmptyDesc}
            </p>
            <div className="empty-actions">
              <button
                type="button"
                className="btn-empty-reset"
                onClick={() => {
                  setSupplierFilter('ALL');
                  setAmenityFilter(null);
                  setMinPrice(null);
                  setMaxPrice(null);
                }}
              >
                <RotateCcw size={15} /> {PAGE_STRINGS.results.emptyState.clearFiltersButton}
              </button>
            </div>
          </div>
        )
      )}

      {/* Paginated Hotel Cards */}
      {!showLoadingSkeleton && !error && !isNoResultsFound && paginatedHotels.length > 0 && (
        <>
          <div className={viewMode === 'list' ? 'hotel-cards-list-view' : 'hotel-cards-grid'}>
            {paginatedHotels.map((hotel, index) => {
              const isFav = Boolean(favorites[hotel.hotelId]);
              const isWinnerA = hotel.cheaperSupplier === 'Supplier A';
              const higherRate = Math.max(hotel.rateA, hotel.rateB);
              const savingsPercent =
                higherRate > 0 ? Math.round((hotel.savings / higherRate) * 100) : 0;
              // Synchronize stars and guest satisfaction score
              const effectiveStars = Math.min(5, Math.max(1, Math.round(hotel.stars || 3)));
              const ratingScore = (() => {
                if (hotel.rating !== undefined && hotel.rating !== null) {
                  const diff = Math.abs(hotel.rating - effectiveStars);
                  if (diff <= 0.6) {
                    return hotel.rating.toFixed(1);
                  }
                }
                switch (effectiveStars) {
                  case 5:
                    return '4.9';
                  case 4:
                    return '4.3';
                  case 3:
                    return '3.8';
                  case 2:
                    return '2.9';
                  case 1:
                    return '1.9';
                  default:
                    return '3.8';
                }
              })();
              const numScore = parseFloat(ratingScore);
              const displayStars = Math.min(5, Math.max(1, Math.round(numScore)));
              const ratingLabel =
                numScore >= 4.5 ? 'Exceptional' : numScore >= 4.0 ? 'Very Good' : numScore >= 3.0 ? 'Good' : 'Fair';
              const reviewsCount = hotel.reviewsCount || (displayStars * 85 + 60);
              // Check if current hotel offers free cancellation
              const hasFreeCancellation = hotel.amenities.some((a) => a.toLowerCase().includes('cancellation'));

              if (viewMode === 'list') {
                // Horizontal list layout
                return (
                  <article
                    key={hotel.hotelId}
                    className="hotel-card horizontal-card enhanced-card"
                    data-testid={`hotel-card-${index}`}
                  >
                    {/* Image Column */}
                    <div className="horizontal-img-wrap">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="hotel-img"
                        loading="lazy"
                      />
                      <span className="verified-deal-badge">
                        <ShieldCheck size={12} /> {PAGE_STRINGS.results.bestRateBadge}
                      </span>
                      {hotel.roomType && (
                        <span className="card-room-type-tag">
                          <Tag size={10} /> {hotel.roomType}
                        </span>
                      )}
                      <button
                        type="button"
                        className={`hotel-fav-btn ${isFav ? 'active' : ''}`}
                        onClick={() => toggleFavorite(hotel.hotelId)}
                        aria-label={PAGE_STRINGS.results.saveFavoritesLabel}
                      >
                        <Heart
                          size={17}
                          fill={isFav ? '#ef4444' : 'none'}
                          color={isFav ? '#ef4444' : '#ffffff'}
                        />
                      </button>
                    </div>

                    {/* Content Column */}
                    <div className="horizontal-info-col">
                      <div className="card-top-row">
                        <div className="stars-row">
                          {Array.from({ length: displayStars }).map((_, i) => (
                            <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                          ))}
                          <span className="star-rating-text">{displayStars}-Star Hotel</span>
                        </div>
                        <div className="card-guest-rating">
                          <span className="rating-score-box">{ratingScore}</span>
                          <div className="rating-text-group">
                            <span className="rating-adjective">{ratingLabel}</span>
                            <span className="rating-count">({reviewsCount} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <h3 className="hotel-title">{decodeHtmlEntities(hotel.name)}</h3>

                      <div className="hotel-loc-row">
                        <MapPin size={13} color="#64748b" />
                        <span>{decodeHtmlEntities(hotel.location)}</span>
                      </div>

                      {/* Amenities Row */}
                      <div className="amenities-tag-row">
                        {hotel.amenities.map((amenity, i) => {
                          const isCancellation = amenity.toLowerCase().includes('cancellation');
                          return (
                            <span
                              key={i}
                              className={`amenity-chip ${isCancellation ? 'is-cancellation' : ''}`}
                            >
                              {isCancellation ? (
                                <ShieldCheck size={11} className="cancellation-icon" />
                              ) : (
                                <Check size={11} color="#16a34a" />
                              )}{' '}
                              {amenity}
                            </span>
                          );
                        })}
                      </div>

                      {/* Live Supplier Rate Comparison Table */}
                      <div className="rates-comparison-table">
                        <div className="compare-item">
                          <span className="compare-supplier-name">{PAGE_STRINGS.results.supplierA}</span>
                          <span className={`compare-price ${isWinnerA ? 'cheapest' : ''}`}>
                            ₹{formatPriceINR(hotel.rateA)}
                          </span>
                        </div>
                        <span className="compare-divider">vs</span>
                        <div className="compare-item">
                          <span className="compare-supplier-name">{PAGE_STRINGS.results.supplierB}</span>
                          <span className={`compare-price ${!isWinnerA ? 'cheapest' : ''}`}>
                            ₹{formatPriceINR(hotel.rateB)}
                          </span>
                        </div>
                        <div className="compare-callout">
                          <Sparkles size={13} />
                          <strong>
                            {hotel.cheaperSupplier} {PAGE_STRINGS.results.savePrefix.toLowerCase()}s ₹{formatPriceINR(hotel.savings)} ({savingsPercent}% cheaper)!
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & CTA Column */}
                    <div className="horizontal-action-col">
                      {hasFreeCancellation && (
                        <div className="cancellation-guarantee-pill free">
                          <ShieldCheck size={12} />
                          <span>{PAGE_STRINGS.results.freeCancellationBadge}</span>
                        </div>
                      )}
                      <span className="price-lead-label">
                        Wholesale Rate ({hotel.cheaperSupplier})
                      </span>
                      <div className="price-display-box">
                        <span className="price-currency">₹</span>
                        <span className="price-figure">{formatPriceINR(hotel.price)}</span>
                        <span className="price-period">{PAGE_STRINGS.results.nightUnit}</span>
                      </div>
                      <span className="tax-notice">{PAGE_STRINGS.results.taxNotice}</span>
                      <button
                        type="button"
                        className="btn-book-hotel"
                        onClick={() =>
                          openBookingModal({
                            hotelId: hotel.hotelId,
                            name: hotel.name,
                            price: hotel.price,
                            supplier: hotel.cheaperSupplier,
                            location: hotel.location,
                            stars: hotel.stars,
                            image: hotel.image,
                          })
                        }
                      >
                        {PAGE_STRINGS.results.bookNow} <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              }

              // Vertical grid card layout
              return (
                <article
                  key={hotel.hotelId}
                  className="hotel-card enhanced-card"
                  data-testid={`hotel-card-${index}`}
                >
                  <div className="hotel-img-wrap">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="hotel-img"
                      loading="lazy"
                    />
                    <span className="verified-deal-badge">
                      <ShieldCheck size={12} /> {PAGE_STRINGS.results.bestRateBadge}
                    </span>
                    {hotel.roomType && (
                      <span className="card-room-type-tag">
                        <Tag size={10} /> {hotel.roomType}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`hotel-fav-btn ${isFav ? 'active' : ''}`}
                      onClick={() => toggleFavorite(hotel.hotelId)}
                      aria-label={PAGE_STRINGS.results.saveFavoritesLabel}
                    >
                      <Heart
                        size={17}
                        fill={isFav ? '#ef4444' : 'none'}
                        color={isFav ? '#ef4444' : '#828282'}
                      />
                    </button>
                  </div>

                  <div className="hotel-card-body">
                    <div className="card-meta-row">
                      <div className="stars-row">
                        {Array.from({ length: displayStars }).map((_, i) => (
                          <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                        ))}
                      </div>
                      <div className="card-guest-rating-compact">
                        <span className="rating-score-box">{ratingScore}</span>
                        <span className="rating-adjective">{ratingLabel}</span>
                      </div>
                    </div>

                    <h3 className="hotel-title">{decodeHtmlEntities(hotel.name)}</h3>

                    <div className="hotel-loc-row">
                      <MapPin size={13} color="#64748b" />
                      <span>{decodeHtmlEntities(hotel.location)}</span>
                    </div>

                    <div className="amenities-tag-row">
                      {hotel.amenities.slice(0, 3).map((amenity, i) => {
                        const isCancellation = amenity.toLowerCase().includes('cancellation');
                        return (
                          <span
                            key={i}
                            className={`amenity-chip ${isCancellation ? 'is-cancellation' : ''}`}
                          >
                            {isCancellation ? (
                              <ShieldCheck size={11} className="cancellation-icon" />
                            ) : (
                              <Check size={11} color="#16a34a" />
                            )}{' '}
                            {amenity}
                          </span>
                        );
                      })}
                    </div>

                    <div className="grid-comparison-row">
                      <div className="grid-compare-supplier">
                        <span className="supplier-pill pill-a">A</span>
                        <div className="compare-val-block">
                          <span className="supplier-label-mini">Supplier A</span>
                          <span className={`grid-compare-val ${isWinnerA ? 'winner' : ''}`}>
                            ₹{formatPriceINR(hotel.rateA)}
                          </span>
                        </div>
                      </div>
                      <span className="grid-vs">vs</span>
                      <div className="grid-compare-supplier">
                        <span className="supplier-pill pill-b">B</span>
                        <div className="compare-val-block">
                          <span className="supplier-label-mini">Supplier B</span>
                          <span className={`grid-compare-val ${!isWinnerA ? 'winner' : ''}`}>
                            ₹{formatPriceINR(hotel.rateB)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="comparison-badge-row">
                      <span className="compare-text">
                        {PAGE_STRINGS.results.bestDealLabel}{' '}
                        <strong className="winner-highlight">
                          {hotel.cheaperSupplier} ({savingsPercent}% less)
                        </strong>
                      </span>
                      {hasFreeCancellation && (
                        <span className="grid-cancellation-badge">
                          <ShieldCheck size={11} /> {PAGE_STRINGS.results.freeCancellationBadge}
                        </span>
                      )}
                    </div>

                    <div className="grid-price-row">
                      <div>
                        <span className="grid-rate-figure">
                          ₹{formatPriceINR(hotel.price)}
                        </span>
                        <span className="grid-rate-period"> {PAGE_STRINGS.results.nightUnit}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-book-hotel"
                        onClick={() =>
                          openBookingModal({
                            hotelId: hotel.hotelId,
                            name: hotel.name,
                            price: hotel.price,
                            supplier: hotel.cheaperSupplier,
                            location: hotel.location,
                            stars: hotel.stars,
                            image: hotel.image,
                          })
                        }
                      >
                        {PAGE_STRINGS.results.bookNow} <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container" data-testid="catalog-pagination">
              <span className="pagination-info">
                Showing {(activePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(activePage * ITEMS_PER_PAGE, sortedHotels.length)} of {sortedHotels.length} verified stays
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={activePage <= 1}
                  onClick={() => {
                    setCurrentPage(activePage - 1);
                    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Previous
                </button>
                {getPageNumbers().map((pageItem, index) =>
                  pageItem === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={pageItem}
                      type="button"
                      className={`pagination-num-btn ${activePage === pageItem ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPage(Number(pageItem));
                        document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {pageItem}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={activePage >= totalPages}
                  onClick={() => {
                    setCurrentPage(activePage + 1);
                    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default SearchResultsList;
