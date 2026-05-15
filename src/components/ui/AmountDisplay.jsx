/**
 * VOID — AmountDisplay
 * ─────────────────────────────────────────────────────────────
 * Wraps any monetary amount. When Ghost Mode is active, applies
 * blur-md + opacity-50 so numbers are unreadable but layout holds.
 *
 * Props:
 *   value      — number (the raw amount in base currency)
 *   currency   — string (default 'INR')
 *   className  — additional Tailwind classes
 *   colored    — boolean: if true, colors positive as green, negative as red
 *   size       — 'hero' | 'title' | 'head' | 'body' | 'caption'
 *   showSign   — boolean: prefix with + or - (default false)
 *   prefix     — string: manual prefix (e.g. '₹', '+', '-')
 */

import { useGhost } from '../../contexts/GhostContext';

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/** Format a number as a locale-aware currency string */
export function formatCurrency(value, currency = 'INR') {
  const absVal = Math.abs(value);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  // Compact notation for very large numbers
  if (absVal >= 1_00_000) {
    return `${symbol}${(absVal / 1_00_000).toFixed(2)}L`;
  }
  if (absVal >= 1_000) {
    return `${symbol}${absVal.toLocaleString('en-IN')}`;
  }
  return `${symbol}${absVal.toFixed(2)}`;
}

export default function AmountDisplay({
  value = 0,
  currency = 'INR',
  className = '',
  colored = false,
  showSign = false,
  prefix = '',
}) {
  const { isGhostMode } = useGhost();
  
  const GHOST_WORDS = [
    "Butterfly", "Nebula", "Quantum", "Echo", "Zenith", 
    "Orbit", "Velvet", "Atlas", "Solace", "Flux", 
    "Aether", "Loom", "Vortex", "Pulse", "Eon", 
    "Haze", "Prism", "Lumina", "Nova", "Stellar"
  ];

  // Pick a stable word based on the value to avoid flickering on every re-render
  const wordIndex = Math.abs(Math.round(value)) % GHOST_WORDS.length;
  const ghostWord = GHOST_WORDS[wordIndex];

  const formatted = formatCurrency(value, currency);
  const sign = showSign && value !== 0 ? (value > 0 ? '+' : '-') : '';
  const display = isGhostMode ? ghostWord : `${prefix}${sign}${formatted}`;

  // Color classes when colored=true
  const colorClass = colored
    ? value > 0
      ? 'text-[#32D74B]'
      : value < 0
      ? 'text-[#FF453A]'
      : 'text-[#8E8E93]'
    : '';

  return (
    <span
      className={[
        'amount-display inline-block tabular-nums',
        isGhostMode ? 'ghost' : '',
        colorClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isGhostMode ? 'Amount hidden' : display}
    >
      {display}
    </span>
  );
}
