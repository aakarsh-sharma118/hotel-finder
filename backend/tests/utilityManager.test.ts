import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  generateBookingReference,
  generateBookingId,
  generateWorkflowId,
  validateDateRange,
  isTemporalConnectionError,
  calculateTaxAndTotal,
} from '../src/utils/utilityManager';

describe('Backend Utility Manager Tests', () => {
  describe('sanitizeInput', () => {
    it('strips script tags and malicious attributes', () => {
      const malicious = '<script>alert("xss")</script>Destination City';
      const clean = sanitizeInput(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Destination City');
    });

    it('escapes dangerous HTML chars', () => {
      const clean = sanitizeInput('<test>');
      expect(clean).toBe('&lt;test&gt;');
    });

    it('handles null and undefined', () => {
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

  describe('ID and Reference Generators', () => {
    it('generates booking reference with valid prefix', () => {
      const ref = generateBookingReference();
      expect(ref).toMatch(/^(REF|HTL)-[A-Z0-9-]+$/);
    });

    it('generates CONF- booking ID', () => {
      const id = generateBookingId();
      expect(id).toMatch(/^CONF-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('generates workflowId with city name embedded', () => {
      const wfId = generateWorkflowId('Mumbai');
      expect(wfId).toContain('hotel-search-mumbai-');
    });
  });

  describe('validateDateRange', () => {
    it('validates ISO date format and order', () => {
      expect(validateDateRange('2026-10-01', '2026-10-05')).toBe(true);
      expect(validateDateRange('2026-10-05', '2026-10-01')).toBe(false);
      expect(validateDateRange('invalid-date', '2026-10-05')).toBe(false);
    });
  });

  describe('isTemporalConnectionError', () => {
    it('identifies connection and deadline errors', () => {
      expect(isTemporalConnectionError(new Error('Failed to connect before the deadline'))).toBe(true);
      expect(isTemporalConnectionError({ code: 14, message: 'UNAVAILABLE' })).toBe(true);
      expect(isTemporalConnectionError(new Error('Validation error: invalid city'))).toBe(false);
      expect(isTemporalConnectionError(null)).toBe(false);
    });
  });

  describe('calculateTaxAndTotal', () => {
    it('calculates tax and total accurately', () => {
      const { tax, total } = calculateTaxAndTotal(2500, 0.12);
      expect(tax).toBe(300);
      expect(total).toBe(2800);
    });
  });
});
