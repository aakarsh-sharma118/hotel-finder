/**
 * Utility functions.
 */

const XSS_BLACKLIST_REGEX = /<script\b[\s\S]*?<\/script>|javascript:|onerror=|onload=|eval\(|<iframe|<object|<embed/gi;

/**
 * Sanitizes input string.
 */
export function sanitizeInput(input: any): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(XSS_BLACKLIST_REGEX, '')
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case "'":
          return '&#39;';
        case '"':
          return '&quot;';
        case '&':
          return '&amp;';
        default:
          return char;
      }
    })
    .trim();
}

/**
 * Validates check-in and check-out dates.
 */
export function validateDateRange(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  return !isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate > inDate;
}

/**
 * Formats price in INR.
 */
export function formatPriceINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return Math.round(amount).toLocaleString('en-IN');
}

/**
 * Formats currency.
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${formatPriceINR(amount)}`;
}

/**
 * Calculates tax and total.
 */
export function calculateTaxAndTotal(basePrice: number, taxRate: number = 0.12): {
  tax: number;
  total: number;
} {
  const tax = Math.round(basePrice * taxRate);
  const total = basePrice + tax;
  return { tax, total };
}

/**
 * Decodes HTML entities such as &amp;, &lt;, &gt;, &quot;, &#39;.
 * Runs multiple passes to cleanly resolve multi-encoded entities (e.g. &amp;amp;).
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  let result = String(str);
  for (let i = 0; i < 3; i++) {
    const prev = result;
    result = result
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    if (result === prev) break;
  }
  return result;
}

/**
 * Generates official booking confirmation reference code.
 */
export function generateBookingReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${ts}-${rand}`;
}

/**
 * Generates booking ID.
 */
export function generateBookingId(): string {
  return `bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Loads JSON data from localStorage.
 */
export function loadJsonFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[StorageManager] Failed to read ${key} from localStorage:`, err);
    return fallback;
  }
}

/**
 * Saves JSON data to localStorage.
 */
export function saveJsonToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[StorageManager] Failed to save ${key} to localStorage:`, err);
  }
}
