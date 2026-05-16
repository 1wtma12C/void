/**
 * VOID — Magnified Input
 * ─────────────────────────────────────────────────────────────
 * A reusable input component that physically grows/magnifies
 * using framer-motion when focused.
 */

import { useState } from 'react';
import { motion }   from 'framer-motion';

export default function MagnifiedInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus = false,
  onKeyDown,
  id,
  className = '',
  required = false,
  inputMode,
  list,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      className={`flex flex-col items-center justify-center w-full ${className}`}
      animate={{ scale: focused ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold tracking-widest uppercase text-[#8E8E93] mb-1.5 text-center"
        >
          {label} {required && <span className="text-[#FF453A]">*</span>}
        </label>
      )}
      <div
        className={[
          'flex items-center justify-center gap-3 px-2 py-2 w-full border-b',
          'transition-all duration-200',
          focused
            ? 'border-white/20'
            : 'border-transparent',
        ].join(' ')}
      >
        {Icon && (
          <Icon
            size={18}
            strokeWidth={focused ? 2.5 : 2}
            className={focused ? 'text-[#F5F5F7]' : 'text-[#3A3A3C]'}
            style={{ transition: 'all 0.2s' }}
          />
        )}
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            setFocused(true);
            setTimeout(() => {
              e.target.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }, 300);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize={type === 'text' ? 'words' : 'none'}
          spellCheck={false}
          list={list}
          className={[
            'flex-1 bg-transparent outline-none border-none text-center',
            'text-[#F5F5F7] text-2xl font-bold tracking-tight',
            'placeholder-[#2A2A2C]',
          ].join(' ')}
        />
      </div>
    </motion.div>
  );
}
