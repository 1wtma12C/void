/**
 * VOID — PillButton
 * ─────────────────────────────────────────────────────────────
 * Glass frosted pill button with spring press animation.
 *
 * Props:
 *   children   — ReactNode (label + icon)
 *   onClick    — function
 *   variant    — 'default' | 'lent' | 'received' | 'ghost'
 *   size       — 'sm' | 'md' | 'lg'
 *   disabled   — boolean
 *   className  — string
 *   icon       — ReactNode (placed before children)
 *   iconRight  — ReactNode (placed after children)
 *   fullWidth  — boolean
 *   type       — button type (default 'button')
 */

import { motion } from 'framer-motion';

const variantMap = {
  default:  'text-[#F5F5F7] border-white/10',
  lent:     'text-[#FF453A] border-[#FF453A]/20 bg-[#FF453A]/10',
  received: 'text-[#32D74B] border-[#32D74B]/20 bg-[#32D74B]/10',
  ghost:    'text-[#8E8E93] border-white/08',
};

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2   text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export default function PillButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  icon,
  iconRight,
  fullWidth = false,
  type = 'button',
  ...rest
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={[
        // Base pill styles
        'inline-flex items-center justify-center rounded-pill',
        'font-medium tracking-tight select-none',
        'border backdrop-blur-glass',
        'transition-opacity duration-150',
        // Variant
        variantMap[variant] ?? variantMap.default,
        // Size
        sizeMap[size] ?? sizeMap.md,
        // Disabled
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        // Full width
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  );
}
