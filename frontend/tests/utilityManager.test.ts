import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeInput,
  formatPriceINR,
  formatCurrency,
  calculateTaxAndTotal,
  generateBookingReference,
  generateBookingId,
  loadJsonFromStorage,
  saveJsonToStorage,
  validateDateRange,
} from '../src/utils/utilityManager';

describe('Frontend Utility Manager Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('sanitizeInput', () => {
    it('strips script tags and malicious attributes', () => {
      const malicious = '<script>alert("xss")</script>Hello World';
      const clean = sanitizeInput(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Hello World');
    });

    it('escapes HTML special characters', () => {
      const input = '<div class="test">& \'quoted\'</div>';
      const clean = sanitizeInput(input);
      expect(clean).toContain('&lt;div');
      expect(clean).toContain('&amp;');
      expect(clean).toContain('&#39;quoted&#39;');
    });

    it('returns empty string on null or undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('is resilient to catastrophic ReDoS backtracking on crafted inputs', () => {
      const maliciousPayload = '<script>' + '<'.repeat(5000) + 'alert(1)';
      const start = Date.now();
      const clean = sanitizeInput(maliciousPayload);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
      expect(typeof clean).toBe('string');
    });
  });

  describe('formatPriceINR and formatCurrency', () => {
    it('formats numbers according to Indian numbering grouping', () => {
      expect(formatPriceINR(2500)).toBe('2,500');
      expect(formatPriceINR(125000)).toBe('1,25,000');
      expect(formatPriceINR(0)).toBe('0');
    });

    it('handles NaN or invalid inputs gracefully', () => {
      expect(formatPriceINR(NaN)).toBe('0');
    });

    it('formats with default rupee currency symbol', () => {
      expect(formatCurrency(2499)).toBe('₹2,499');
    });
  });

  describe('calculateTaxAndTotal', () => {
    it('calculates 12% GST tax correctly by default', () => {
      const result = calculateTaxAndTotal(1000);
      expect(result.tax).toBe(120);
      expect(result.total).toBe(1120);
    });

    it('allows custom tax rate overrides', () => {
      const result = calculateTaxAndTotal(1000, 0.18);
      expect(result.tax).toBe(180);
      expect(result.total).toBe(1180);
    });
  });

  describe('ID and Reference Generators', () => {
    it('generates uppercase alphanumeric booking references with valid prefix', () => {
      const ref = generateBookingReference();
      expect(ref).toMatch(/^(REF|HTL)-[A-Z0-9-]+$/);
    });

    it('generates unique booking IDs', () => {
      const id1 = generateBookingId();
      const id2 = generateBookingId();
      expect(id1).toMatch(/^bk-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Date Validation', () => {
    it('validates date range chronological sequence', () => {
      expect(validateDateRange('2026-10-12', '2026-10-15')).toBe(true);
      expect(validateDateRange('2026-10-15', '2026-10-12')).toBe(false);
      expect(validateDateRange('2026-10-12', '2026-10-12')).toBe(false);
      expect(validateDateRange('', '2026-10-12')).toBe(false);
    });
  });

  describe('LocalStorage JSON Helpers', () => {
    it('saves and loads JSON records from storage with fallback', () => {
      const key = 'test_key';
      const fallback = { name: 'default' };
      expect(loadJsonFromStorage(key, fallback)).toEqual(fallback);

      const payload = { name: 'test-user', active: true };
      saveJsonToStorage(key, payload);
      expect(loadJsonFromStorage(key, fallback)).toEqual(payload);
    });
  });
});
