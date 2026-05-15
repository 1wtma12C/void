/**
 * VOID — GlassCard
 * ─────────────────────────────────────────────────────────────
 * Reusable frosted glass container. Uses Framer Motion for
 * spring-physics enter animation and optional whileTap scale.
 *
 * Props:
 *   children    — ReactNode
 *   className   — string (additional Tailwind classes)
 *   onClick     — function (makes card interactive)
 *   tap         — boolean: enable whileTap scale (default true if onClick)
 *   animate     — boolean: run mount animation (default true)
 *   as          — element type (default 'div')
 *   padding     — 'none' | 'sm' | 'md' | 'lg' (default 'md')
 */

import { motion } from 'framer-motion';

const paddingMap = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

export default function GlassCard({
  children,
  className = '',
  onClick,
  tap = true,
  animate = true,
  padding = 'md',
  style,
  ...rest
}) {
  const isInteractive = Boolean(onClick);

  return (
    <motion.div
      className={[
        'glass rounded-glass',
        paddingMap[padding],
        isInteractive ? 'cursor-pointer select-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      // Mount animation
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={animate ? { opacity: 1, y: 0 }  : false}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      // Tap feedback
      whileTap={isInteractive && tap ? { scale: 0.97 } : undefined}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
