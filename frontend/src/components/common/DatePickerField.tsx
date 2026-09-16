/**
 * Hotel Finder Frontend - Date Picker Field
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 * This code is licensed under standard commercial terms for Aakarsh Sharma.
 *
 * Accessible date picker component powered by react-day-picker.
 * Provides a calendar popover, keyboard accessibility, and theme styling.
 *
 * @module DatePickerField
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { PAGE_STRINGS } from '../../constants/pageStrings';
import 'react-day-picker/style.css';

export interface DatePickerFieldProps {
  // Label text displayed above the input
  label?: string;
  // Unique HTML element identifier
  id: string;
  // Selected date value in YYYY-MM-DD format
  value: string;
  // Callback when user selects a new date
  onChange: (value: string) => void;
  // Optional minimum selectable date string in YYYY-MM-DD format
  minDate?: string;
  // Optional maximum selectable date string in YYYY-MM-DD format
  maxDate?: string;
  // Leading icon element
  icon?: React.ReactNode;
  // Whether the field is disabled
  disabled?: boolean;
  // Placeholder text when no date is selected
  placeholder?: string;
  // Validation error message
  error?: string;
  // Supporting helper text
  helperText?: string;
}

/**
 * Safely converts a YYYY-MM-DD string into a local Date object.
 * Avoids UTC timezone conversion shifts.
 *
 * @param dateStr - Date string formatted as YYYY-MM-DD
 * @returns Valid local Date object or undefined
 */
const parseLocalDate = (dateStr?: string): Date | undefined => {
  // Check if string is empty or invalid
  if (!dateStr || typeof dateStr !== 'string') return undefined;
  // Split into components
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return undefined;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  // Verify validity
  return isValid(date) ? date : undefined;
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  id,
  value,
  onChange,
  minDate,
  maxDate,
  icon,
  disabled = false,
  placeholder = PAGE_STRINGS.common.selectDatePlaceholder,
  error,
  helperText,
}) => {
  // Popover open state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // Reference to wrapper container for outside click detection
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date object
  const selectedDate = useMemo(() => parseLocalDate(value), [value]);

  // Parse min and max dates for disabled day matching
  const minDateObj = useMemo(() => parseLocalDate(minDate), [minDate]);
  const maxDateObj = useMemo(() => parseLocalDate(maxDate), [maxDate]);

  // Format display text for input trigger
  const displayText = useMemo(() => {
    if (!selectedDate) return '';
    try {
      return format(selectedDate, 'dd MMM yyyy');
    } catch {
      return value;
    }
  }, [selectedDate, value]);

  // Setup outside click listener to close calendar popover
  useEffect(() => {
    // Handler to detect clicks outside the component container
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close calendar popover on Escape key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  // Handle day selection in the calendar
  const handleDaySelect = (day?: Date) => {
    if (!day) return;
    // Format to standard YYYY-MM-DD string
    const formatted = format(day, 'yyyy-MM-dd');
    onChange(formatted);
    // Close popover after selection
    setIsOpen(false);
  };

  // Clear selected date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Check whether a specific calendar day should be disabled
  const isDateDisabled = (day: Date): boolean => {
    const target = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    if (minDateObj) {
      const min = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), minDateObj.getDate()).getTime();
      if (target < min) return true;
    }
    if (maxDateObj) {
      const max = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate()).getTime();
      if (target > max) return true;
    }
    return false;
  };

  return (
    <div className="input-field-group date-picker-group" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="input-field-label">
          {label}
        </label>
      )}

      <div className="date-picker-wrapper">
        <button
          type="button"
          id={id}
          className={`date-picker-trigger ${icon ? 'has-icon' : ''} ${error ? 'is-invalid' : ''} ${
            isOpen ? 'is-open' : ''
          }`}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={label || placeholder}
        >
          {icon && <span className="input-field-icon">{icon}</span>}

          <span className={`date-picker-value ${!displayText ? 'is-placeholder' : ''}`}>
            {displayText || placeholder}
          </span>

          <span className="date-picker-actions">
            {displayText && !disabled && (
              <span
                role="button"
                tabIndex={0}
                className="date-picker-clear"
                onClick={handleClear}
                aria-label={PAGE_STRINGS.common.clearDate}
              >
                <X size={14} />
              </span>
            )}
            {!icon && (
              <span className="date-picker-calendar-icon">
                <CalendarIcon size={16} />
              </span>
            )}
          </span>
        </button>

        {isOpen && (
          <div
            className="date-picker-popover animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={PAGE_STRINGS.common.calendarView}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              disabled={isDateDisabled}
              defaultMonth={selectedDate || minDateObj || new Date()}
            />
          </div>
        )}
      </div>

      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

DatePickerField.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
  icon: PropTypes.any,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
};

export default React.memo(DatePickerField);
