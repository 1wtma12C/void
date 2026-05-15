/**
 * VOID — AmountDisplay (V1.3)
 * ─────────────────────────────────────────────────────────────
 * The universal source of truth for all monetary values.
 * Replaces numbers with poetic words in Ghost Mode while
 * strictly maintaining semantic colors.
 */

import { useGhost } from '../../contexts/GhostContext';

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const WORDS = [
  "Butterfly", "Nebula", "Quantum", "Echo", "Zenith", 
  "Orbit", "Velvet", "Atlas", "Solace", "Flux", 
  "Aether", "Loom", "Vortex", "Pulse", "Eon", 
  "Haze", "Prism", "Lumina", "Nova", "Stellar"
];

export function formatCurrency(value, currency = 'INR') {
  const absVal = Math.abs(value);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  if (absVal >= 1_00_000) {
    return `${symbol}${(absVal / 1_00_000).toFixed(2)}L`;
  }
  if (absVal >= 1_000) {
    return `${symbol}${absVal.toLocaleString('en-IN')}`;
  }
  return `${symbol}${absVal.toFixed(2)}`;
}

export default function AmountDisplay({
  amount = 0,
  type = null, // 'LENT' | 'RECEIVED' | null
  currency = 'INR',
  className = '',
  colored = false,
  showSign = false,
  prefix = '',
  isGhostMode: manualGhost,
  style = {},
}) {
  const { isGhostMode: contextGhost } = useGhost();
  const activeGhost = manualGhost ?? contextGhost;
  
  const wordIndex = Math.abs(Math.round(amount)) % WORDS.length;
  const ghostWord = WORDS[wordIndex];

  const formatted = formatCurrency(amount, currency);
  const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
  const display = activeGhost ? ghostWord : `${prefix}${sign}${formatted}`;

  // Determine color based on type (if provided) or amount sign
  let colorClass = '';
  if (colored) {
    if (type === 'LENT' || (type === null && amount < 0)) {
      colorClass = 'text-[#FF453A]'; // Crimson
    } else if (type === 'RECEIVED' || (type === null && amount > 0)) {
      colorClass = 'text-[#32D74B]'; // Aurora Green
    } else {
      colorClass = 'text-[#8E8E93]'; // Gray
    }
  }

  return (
    <span
      className={[
        'amount-display inline-block tabular-nums transition-all duration-300',
        activeGhost ? 'ghost' : '',
        colorClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-label={activeGhost ? 'Amount hidden' : display}
    >
      {display}
    </span>
  );
}
