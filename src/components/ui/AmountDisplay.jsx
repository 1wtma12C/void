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

import { useState } from 'react';
import { useGhost } from '../../contexts/GhostContext';

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/** 
 * Format money with support for Short Form and Full Form 
 * Uses Indian Number System (Lakh/Crore)
 */
const formatMoney = (amount, isExpanded, currency = 'INR') => {
  const absVal = Math.abs(amount);
  const symbol = CURRENCY_SYMBOLS[currency] ?? '₹';

  if (isExpanded) {
    // Full format with Indian commas and 2 decimals
    const num = new Intl.NumberFormat('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(absVal);
    return `${symbol}${num}`;
  } else {
    // Short format (K, L, Cr)
    if (absVal >= 10000000) return symbol + (absVal / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
    if (absVal >= 100000)   return symbol + (absVal / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    if (absVal >= 1000)     return symbol + (absVal / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return symbol + absVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
};

/** Legacy export for parts of the app that still use it directly */
export function formatCurrency(value, currency = 'INR') {
  return formatMoney(value, false, currency);
}

export default function AmountDisplay({
  value = 0,
  currency = 'INR',
  className = '',
  colored = false,
  showSign = false,
  prefix = '',
  ghostIndex = 0,
}) {
  const { isGhostMode, shuffledWords } = useGhost();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Pick a unique word from the shuffled array based on the index
  const ghostWord = shuffledWords[ghostIndex % shuffledWords.length] || 'VOID';

  const formatted = formatMoney(value, isExpanded, currency);
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
      onClick={(e) => {
        if (!isGhostMode) {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }
      }}
      className={[
        'amount-display inline-block tabular-nums transition-all duration-300',
        !isGhostMode ? 'cursor-pointer active:scale-95' : '',
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
