import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Users, ShieldCheck, MapPin } from 'lucide-react';
import { useHotelStore, ConfirmedBooking } from '../store/useHotelStore';
import { PAGE_STRINGS, GST_TAX_RATE, VALIDATION_REGEX, VALIDATION_MESSAGES } from '../constants/appConsts';
import { sanitizeInput, calculateTaxAndTotal, formatPriceINR, decodeHtmlEntities } from '../utils/utilityManager';
import { useUrlRouting } from '../hooks/useUrlRouting';

export const BookingModal: React.FC = () => {
  const {
    bookingHotel,
    closeBookingModal,
    isBookingSuccess,
    confirmBookingWithDetails,
    lastConfirmedBooking,
    checkIn,
    checkOut,
    guests,
  } = useHotelStore();

  const { navigateToTab } = useUrlRouting();

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ guestName?: string; guestEmail?: string; phone?: string }>({});
  const [confirmedBookingRecord, setConfirmedBookingRecord] = useState<ConfirmedBooking | null>(null);

  if (!bookingHotel) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { guestName?: string; guestEmail?: string; phone?: string } = {};

    const cleanName = sanitizeInput(guestName);
    const cleanEmail = sanitizeInput(guestEmail);
    const cleanPhone = sanitizeInput(phone);

    if (!cleanName) {
      newErrors.guestName = VALIDATION_MESSAGES.nameRequired;
    } else if (!VALIDATION_REGEX.name.test(cleanName)) {
      newErrors.guestName = VALIDATION_MESSAGES.nameInvalid;
    }

    if (!cleanEmail) {
      newErrors.guestEmail = VALIDATION_MESSAGES.emailRequired;
    } else if (!VALIDATION_REGEX.email.test(cleanEmail)) {
      newErrors.guestEmail = VALIDATION_MESSAGES.emailInvalid;
    }

    if (!cleanPhone) {
      newErrors.phone = VALIDATION_MESSAGES.phoneRequired;
    } else if (!VALIDATION_REGEX.phone.test(cleanPhone)) {
      newErrors.phone = VALIDATION_MESSAGES.phoneInvalid;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const confirmed = confirmBookingWithDetails({ guestName: cleanName, guestEmail: cleanEmail });
    if (confirmed) {
      setConfirmedBookingRecord(confirmed);
    }
  };

  const { tax, total } = calculateTaxAndTotal(bookingHotel.price, GST_TAX_RATE);

  const handleViewBookings = () => {
    closeBookingModal();
    navigateToTab('bookings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="modal-backdrop" onClick={closeBookingModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={closeBookingModal}
          aria-label={PAGE_STRINGS.common.closeModal}
        >
          <X size={18} />
        </button>

        {!isBookingSuccess ? (
          <div>
            <div className="modal-header">
              <span className="modal-subtitle">{PAGE_STRINGS.bookingModal.subtitle}</span>
              <h2 className="modal-title">{decodeHtmlEntities(bookingHotel.name)}</h2>
              <div className="modal-location">
                <MapPin size={13} />
                <span>{decodeHtmlEntities(bookingHotel.location || PAGE_STRINGS.common.defaultLocation)}</span>
              </div>
            </div>

            <div className="modal-booking-info">
              <div className="info-chip">
                <Calendar size={14} />
                <span>{checkIn} → {checkOut}</span>
              </div>
              <div className="info-chip">
                <Users size={14} />
                <span>{guests}</span>
              </div>
              <div className="info-chip supplier-chip">
                <ShieldCheck size={14} />
                <span>{bookingHotel.supplier || 'Supplier B'} {PAGE_STRINGS.bookingModal.bestRateBadge}</span>
              </div>
            </div>

            <form onSubmit={handleConfirm} className="modal-form" noValidate>
              <div className="form-row">
                <label htmlFor="booking-guest-name" className="modal-label">{PAGE_STRINGS.bookingModal.guestNameLabel}</label>
                <input
                  id="booking-guest-name"
                  type="text"
                  className={`modal-input ${errors.guestName ? 'is-invalid' : ''}`}
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (errors.guestName) setErrors((prev) => ({ ...prev, guestName: undefined }));
                  }}
                  placeholder={PAGE_STRINGS.bookingModal.guestNamePlaceholder}
                />
                {errors.guestName && (
                  <span className="modal-error-text" role="alert">{errors.guestName}</span>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="booking-guest-email" className="modal-label">{PAGE_STRINGS.bookingModal.emailLabel}</label>
                <input
                  id="booking-guest-email"
                  type="email"
                  className={`modal-input ${errors.guestEmail ? 'is-invalid' : ''}`}
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    if (errors.guestEmail) setErrors((prev) => ({ ...prev, guestEmail: undefined }));
                  }}
                  placeholder={PAGE_STRINGS.bookingModal.emailPlaceholder}
                />
                {errors.guestEmail && (
                  <span className="modal-error-text" role="alert">{errors.guestEmail}</span>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="booking-guest-phone" className="modal-label">{PAGE_STRINGS.bookingModal.phoneLabel}</label>
                <input
                  id="booking-guest-phone"
                  type="tel"
                  className={`modal-input ${errors.phone ? 'is-invalid' : ''}`}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder={PAGE_STRINGS.bookingModal.phonePlaceholder}
                />
                {errors.phone && (
                  <span className="modal-error-text" role="alert">{errors.phone}</span>
                )}
              </div>

              <div className="price-breakdown">
                <div className="price-line">
                  <span>{PAGE_STRINGS.bookingModal.nightlyRate} ({bookingHotel.supplier})</span>
                  <strong>₹{formatPriceINR(bookingHotel.price)}</strong>
                </div>
                <div className="price-line">
                  <span>{PAGE_STRINGS.bookingModal.taxes}</span>
                  <span>₹{formatPriceINR(tax)}</span>
                </div>
                <div className="price-line total-line">
                  <span>{PAGE_STRINGS.bookingModal.total}</span>
                  <span className="total-amount">₹{formatPriceINR(total)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={closeBookingModal}
                >
                  {PAGE_STRINGS.bookingModal.cancelButton}
                </button>
                <button type="submit" className="btn-modal-primary">
                  {PAGE_STRINGS.bookingModal.confirmButton} (₹{formatPriceINR(total)})
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="booking-success-view">
            <div className="success-icon-wrap">
              <CheckCircle2 size={48} color="#16a34a" />
            </div>
            <h3>{PAGE_STRINGS.bookingModal.successTitle}</h3>
            <p className="success-desc">
              {PAGE_STRINGS.bookingModal.securedNotice(
                decodeHtmlEntities(bookingHotel.name),
                bookingHotel.supplier || 'Supplier B'
              )}
            </p>
            <div className="booking-code-box">
              <span>{PAGE_STRINGS.bookingsPage.refCode}:</span>
              <code>{confirmedBookingRecord?.referenceCode || lastConfirmedBooking?.referenceCode || 'REF-CONFIRMED'}</code>
            </div>
            <p className="email-note">{PAGE_STRINGS.bookingModal.voucherSentNotice(guestEmail)}</p>
            
            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={handleViewBookings}
              >
                {PAGE_STRINGS.bookingModal.viewBookingsButton}
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={closeBookingModal}
              >
                {PAGE_STRINGS.bookingModal.doneButton}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
