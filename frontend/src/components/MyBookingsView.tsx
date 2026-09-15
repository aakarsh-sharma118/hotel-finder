/**
 * @fileoverview My Bookings management view.
 * Lists confirmed reservations with options to view details and cancel reservations.
 * Uses TanStack Query for server state synchronization and cache invalidation.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module components/MyBookingsView
 */

import React from 'react';
import { Calendar, Users, Building2, Ban, ShieldCheck, Search, ArrowRight } from 'lucide-react';
import { useHotelStore } from '../store/useHotelStore';
import { useUrlRouting } from '../hooks/useUrlRouting';
import { PAGE_STRINGS } from '../constants/pageStrings';
import { formatPriceINR, decodeHtmlEntities } from '../utils/utilityManager';

export const MyBookingsView: React.FC = () => {
  const { bookings: localBookings, cancelBooking: cancelLocalBooking } = useHotelStore();
  const { navigateToTab } = useUrlRouting();

  // Each user exclusively sees their own bookings persisted locally in browser storage
  const effectiveBookings = localBookings;

  const handleCancelBooking = (bookingId: string) => {
    // Cancel in user's browser local storage
    cancelLocalBooking(bookingId);
  };

  return (
    <div className="bookings-page-container">
      {/* Section Header */}
      <div className="section-header-block">
        <span className="section-kicker">{PAGE_STRINGS.bookingsPage.kicker}</span>
        <h1 className="section-main-title">{PAGE_STRINGS.bookingsPage.title}</h1>
        <p className="section-main-desc">{PAGE_STRINGS.bookingsPage.subtitle}</p>
      </div>

      {effectiveBookings.length > 0 && (
        <div className="savings-banner">
          <ShieldCheck size={18} color="#16a34a" />
          <span>{PAGE_STRINGS.bookingsPage.savingsBanner}</span>
        </div>
      )}

      {effectiveBookings.length === 0 ? (
        <div className="empty-bookings-card">
          <Building2 size={48} className="empty-icon" />
          <h2>{PAGE_STRINGS.bookingsPage.emptyTitle}</h2>
          <p>{PAGE_STRINGS.bookingsPage.emptyDesc}</p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => navigateToTab('search')}
          >
            <Search size={16} /> {PAGE_STRINGS.bookingsPage.searchNow}
          </button>
        </div>
      ) : (
        <div className="bookings-grid">
          {effectiveBookings.map((booking) => {
            const isCancelled = booking.status === 'CANCELLED';

            return (
              <article key={booking.id} className={`booking-manage-card ${isCancelled ? 'is-cancelled' : ''}`}>
                <div className="booking-card-top">
                  <div className="booking-hotel-meta">
                    <span className="booking-ref-badge">
                      {PAGE_STRINGS.bookingsPage.refCode}: <strong>{booking.referenceCode}</strong>
                    </span>
                    <span className={`booking-status-tag ${isCancelled ? 'tag-cancelled' : 'tag-confirmed'}`}>
                      {isCancelled ? PAGE_STRINGS.bookingsPage.cancelledBadge : PAGE_STRINGS.bookingsPage.confirmedBadge}
                    </span>
                  </div>

                  <h3 className="booking-hotel-name">{decodeHtmlEntities(booking.hotelName)}</h3>
                  <p className="booking-hotel-loc">{decodeHtmlEntities(booking.location)}</p>
                </div>

                <div className="booking-card-details">
                  <div className="detail-item">
                    <Calendar size={14} className="detail-icon" />
                    <div>
                      <span className="detail-label">{PAGE_STRINGS.bookingsPage.dates}</span>
                      <strong className="detail-val">{booking.checkIn} → {booking.checkOut}</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Users size={14} className="detail-icon" />
                    <div>
                      <span className="detail-label">{PAGE_STRINGS.bookingsPage.guests}</span>
                      <strong className="detail-val">{booking.guests}</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <ShieldCheck size={14} className="detail-icon" />
                    <div>
                      <span className="detail-label">{PAGE_STRINGS.bookingsPage.supplier}</span>
                      <strong className="detail-val">{booking.supplier}</strong>
                    </div>
                  </div>
                </div>

                <div className="booking-card-footer">
                  <div className="booking-total-box">
                    <span className="total-label">{PAGE_STRINGS.bookingsPage.total}</span>
                    <span className="total-val">₹{formatPriceINR(booking.totalPrice)}</span>
                  </div>

                  {!isCancelled ? (
                    <button
                      type="button"
                      className="btn-cancel-reservation"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      <Ban size={14} /> {PAGE_STRINGS.bookingsPage.cancelBookingBtn}
                    </button>
                  ) : (
                    <span className="cancelled-note">{PAGE_STRINGS.bookingsPage.voidedNote}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Explore More Search Link */}
      <div className="bookings-footer-action">
        <button
          type="button"
          className="btn-secondary-link"
          onClick={() => navigateToTab('search')}
        >
          {PAGE_STRINGS.bookingsPage.exploreMore} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default MyBookingsView;
