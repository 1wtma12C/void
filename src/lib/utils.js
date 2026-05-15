/**
 * VOID — Utility helpers
 */

/**
 * Merge Tailwind class names (simple version — no clsx/twMerge dependency).
 * Filters falsy values and joins with a space.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a Firestore Timestamp or JS Date to a human-readable string.
 * @param {import('firebase/firestore').Timestamp | Date | null} ts
 * @returns {string}
 */
export function formatDate(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

/**
 * Format a Firestore Timestamp or JS Date to a short relative time label.
 * e.g. "Today", "Yesterday", "12 May"
 * @param {import('firebase/firestore').Timestamp | Date | null} ts
 * @returns {string}
 */
export function formatRelativeDate(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();

  const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday - 864e5);
  const startOfDate      = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (startOfDate >= startOfToday)     return 'Today';
  if (startOfDate >= startOfYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Generate a WhatsApp deep-link URL.
 * @param {string} phone       — digits only, include country code if non-IN
 * @param {string} message     — plain text message
 * @returns {string}
 */
export function buildWhatsAppUrl(phone, message) {
  // Strip non-digits; assume India (+91) if 10 digits
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number}   delay — ms
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
