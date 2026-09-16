/**
 * @fileoverview Search form component for destination and travel dates.
 * Manages destination autocomplete, dynamic destination hubs from backend, and occupancy selection.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module components/SearchForm
 */

import React, { useState } from "react";
import PropTypes from "prop-types";
import { MapPin, Calendar, Users, RotateCcw, Sparkles } from "lucide-react";
import { SearchHotelsParams, DestinationSummary } from "../types";
import { useHotelStore } from "../store/useHotelStore";
import { useUrlRouting } from "../hooks/useUrlRouting";
import { useDestinationsQuery } from "../hooks/useHotelQueries";
import { InputField } from "./common/InputField";
import { DatePickerField } from "./common/DatePickerField";
import { CustomSelect } from "./common/CustomSelect";
import {
  PAGE_STRINGS,
  VALIDATION_REGEX,
  VALIDATION_MESSAGES,
  GUEST_OPTIONS,
  isRecognizedDestination,
} from "../constants/appConsts";
import { sanitizeInput } from "../utils/utilityManager";

export { GUEST_OPTIONS };

interface SearchFormProps {
  onSearch: (params: SearchHotelsParams) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading,
}) => {
  // Store values and setters from Zustand state
  const {
    city,
    setCity,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    setGuests,
    resetForm,
  } = useHotelStore();

  const { syncSearchToUrl } = useUrlRouting();
  const [cityError, setCityError] = useState<string | null>(null);

  // Fetch verified destinations dynamically from backend catalog
  const destinationsQuery = useDestinationsQuery();
  const availableDestinations: DestinationSummary[] =
    destinationsQuery.data?.destinations || [];

  // Minimum allowed date (today) in YYYY-MM-DD format
  const todayDateString = new Date().toISOString().split("T")[0];

  // Checks if entered city matches backend catalog or static destination fallback
  const isCityValid = (cityName: string): boolean => {
    const clean = cityName.trim().toLowerCase();
    if (availableDestinations.length > 0) {
      return availableDestinations.some((d) => {
        const destLower = d.city.toLowerCase();
        return (
          destLower === clean ||
          destLower.includes(clean) ||
          clean.includes(destLower)
        );
      });
    }
    return isRecognizedDestination(clean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize and validate destination city
    const cleanCity = sanitizeInput(city);
    if (!cleanCity) {
      setCityError(VALIDATION_MESSAGES.cityRequired);
      return;
    }
    if (!VALIDATION_REGEX.city.test(cleanCity)) {
      setCityError(VALIDATION_MESSAGES.cityInvalid);
      return;
    }
    if (!isCityValid(cleanCity)) {
      setCityError(VALIDATION_MESSAGES.cityNotFound);
      return;
    }

    setCityError(null);
    const effectiveCity = cleanCity;
    const effectiveCheckIn = sanitizeInput(checkIn) || todayDateString;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const effectiveCheckOut =
      sanitizeInput(checkOut) || tomorrow.toISOString().split("T")[0];
    const effectiveGuests = sanitizeInput(guests) || "2 Adults";

    // Synchronize query parameters to browser address bar
    syncSearchToUrl({
      city: effectiveCity,
      checkIn: effectiveCheckIn,
      checkOut: effectiveCheckOut,
      guests: parseInt(effectiveGuests, 10) || 2,
    });

    // Fire search callback to trigger rate comparison
    onSearch({
      city: effectiveCity,
      checkIn: effectiveCheckIn,
      checkOut: effectiveCheckOut,
      guests: effectiveGuests,
    });

    // Smooth scroll down to hotel results
    setTimeout(() => {
      const resultsEl =
        document.getElementById("search-results") ||
        document.querySelector(".search-results-section");
      if (resultsEl) {
        const targetTop =
          resultsEl.getBoundingClientRect().top + window.pageYOffset - 24;
        window.scrollTo({
          top: targetTop,
          behavior: "smooth",
        });
      }
    }, 150);
  };

  return (
    <div className="search-form-card" data-testid="search-panel">
      <form onSubmit={handleSubmit} data-testid="search-form">
        {/* Form Grid */}
        <div className="search-bar-grid">
          {/* Destination Column with Datalist */}
          <div className="search-col">
            <InputField
              id="city-input"
              label={PAGE_STRINGS.searchForm.destinationLabel}
              type="text"
              list="destination-options"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (cityError) setCityError(null);
              }}
              error={cityError || undefined}
              placeholder={PAGE_STRINGS.searchForm.destinationPlaceholder}
              icon={<MapPin size={16} />}
              disabled={isLoading}
            />
            {availableDestinations.length > 0 && (
              <datalist id="destination-options">
                {availableDestinations.map((d) => (
                  <option key={d.city} value={d.city}>
                    {PAGE_STRINGS.searchForm.verifiedHotelsOption(
                      d.hotelCount,
                      d.minPrice,
                    )}
                  </option>
                ))}
              </datalist>
            )}
          </div>

          {/* Check-In Column */}
          <div className="search-col">
            <DatePickerField
              id="checkin-input"
              label={PAGE_STRINGS.searchForm.checkInLabel}
              value={checkIn}
              minDate={todayDateString}
              onChange={(val) => {
                setCheckIn(val);
                // Ensure check-out is after check-in if already set
                if (checkOut && val && val >= checkOut) {
                  const [y, m, d] = val.split("-").map(Number);
                  const nextDay = new Date(y, m - 1, d + 1);
                  setCheckOut(nextDay.toISOString().split("T")[0]);
                }
              }}
              placeholder={PAGE_STRINGS.searchForm.checkInPlaceholder}
              icon={<Calendar size={16} />}
              disabled={isLoading}
            />
          </div>

          {/* Check-Out Column */}
          <div className="search-col">
            <DatePickerField
              id="checkout-input"
              label={PAGE_STRINGS.searchForm.checkOutLabel}
              value={checkOut}
              minDate={checkIn || todayDateString}
              onChange={(val) => setCheckOut(val)}
              placeholder={PAGE_STRINGS.searchForm.checkOutPlaceholder}
              icon={<Calendar size={16} />}
              disabled={isLoading}
            />
          </div>

          {/* Guests & Occupancy Selection */}
          <div className="search-col">
            <CustomSelect
              id="guests-select"
              label={PAGE_STRINGS.searchForm.guestsLabel}
              options={GUEST_OPTIONS}
              value={guests}
              placeholder={PAGE_STRINGS.searchForm.guestsPlaceholder}
              onChange={(val) => setGuests(val)}
              icon={<Users size={16} />}
              disabled={isLoading}
            />
          </div>

          {/* Search Button */}
          <div className="search-btn-col">
            <button
              type="submit"
              className="btn-search-hotels"
              disabled={isLoading}
              data-testid="submit-search-btn"
            >
              {isLoading
                ? PAGE_STRINGS.searchForm.submittingButtonShort
                : PAGE_STRINGS.searchForm.submitButtonShort}
            </button>
          </div>
        </div>

        {/* Destination Quick Hubs */}
        {availableDestinations.length > 0 && (
          <div className="search-destinations-quickrow">
            <span className="quickrow-label">
              <Sparkles size={12} /> {PAGE_STRINGS.searchForm.popularHubs}
            </span>
            <div className="quickrow-chips">
              {availableDestinations.slice(0, 6).map((dest) => (
                <button
                  key={dest.city}
                  type="button"
                  className={`quickrow-chip-btn ${
                    city.toLowerCase() === dest.city.toLowerCase()
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setCity(dest.city);
                    if (cityError) setCityError(null);
                  }}
                  disabled={isLoading}
                >
                  <span className="quickrow-chip-name">
                    <span>
                      <MapPin size={11} />
                    </span>{" "}
                    {dest.city}
                  </span>
                  <span className="quickrow-chip-price">
                    {PAGE_STRINGS.searchForm.fromPricePrefix} ₹
                    {dest.minPrice.toLocaleString("en-IN")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Footer with Reset Control */}
        <div className="search-form-footer">
          <button
            type="button"
            className="sim-reset-btn"
            onClick={() => {
              setCityError(null);
              resetForm();
            }}
            disabled={isLoading}
            title={PAGE_STRINGS.searchForm.resetButton}
            data-testid="reset-form-btn"
          >
            <RotateCcw size={13} /> {PAGE_STRINGS.searchForm.resetButton}
          </button>
        </div>
      </form>
    </div>
  );
};

SearchForm.propTypes = {
  onSearch: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default React.memo(SearchForm);
