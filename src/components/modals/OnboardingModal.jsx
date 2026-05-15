/**
 * VOID — Onboarding Modal
 * ─────────────────────────────────────────────────────────────
 * Full-screen frosted glass trap shown on first launch.
 * User cannot dismiss this — they MUST set up their profile.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence }      from 'framer-motion';
import { User, AtSign, ArrowRight, Loader2, AlertCircle, Phone } from 'lucide-react';
import MagnifiedInput from '../ui/MagnifiedInput';

// ── Animation variants ──────────────────────────────────────────
const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit:    { opacity: 0, transition: { duration: 0.3 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.96 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 28, delay: 0.1 },
  },
  exit: {
    opacity: 0, y: -20, scale: 0.97,
    transition: { duration: 0.25 },
  },
};

const fieldVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28, delay: 0.35 + i * 0.12 },
  }),
};

// ── Main Modal ──────────────────────────────────────────────────
export default function OnboardingModal({ onSave }) {
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [upiId,   setUpiId]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isValid = name.trim().length >= 2 && phone.trim().length >= 5;

  async function handleSave() {
    if (!isValid || loading) return;
    setError('');
    setLoading(true);
    try {
      await onSave({ name: name.trim(), phone: phone.trim(), upiId: upiId.trim(), baseCurrency: 'INR' });
    } catch (err) {
      setError('Could not connect to the database. Check your internet connection.');
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter' && name.trim().length >= 2) {
      document.getElementById('void-phone-input')?.focus();
    }
  }

  function handlePhoneKeyDown(e) {
    if (e.key === 'Enter' && phone.trim().length >= 5) {
      document.getElementById('void-upi-input')?.focus();
    }
  }

  return (
    <motion.div
      variants={backdropVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-center mx-auto"
      style={{
        background:    'rgba(0,0,0,0.97)',
        backdropFilter: 'blur(20px)',
        paddingLeft:   'env(safe-area-inset-left)',
        paddingRight:  'env(safe-area-inset-right)',
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-sm mx-6 flex flex-col items-center justify-center gap-0"
      >
        {/* ── Wordmark ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="mb-8 flex flex-col items-center justify-center"
        >
          <p
            className="text-5xl font-bold tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
          >
            VOID
          </p>
          <p className="text-[#8E8E93] text-sm mt-2 tracking-tight">
            Your personal finance ledger
          </p>
        </motion.div>

        {/* ── Glass card with inputs ────────────────────────────── */}
        <div
          className="rounded-glass p-6 w-full flex flex-col items-center justify-center gap-5"
          style={{
            background:    'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border:        '1px solid rgba(255,255,255,0.09)',
            boxShadow:     '0 24px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Heading */}
          <div className="mb-1 flex flex-col items-center">
            <p className="text-lg font-semibold text-[#F5F5F7] tracking-tight">
              Set up your profile
            </p>
            <p className="text-[#8E8E93] text-xs mt-1 leading-relaxed max-w-[80%]">
              This is stored privately in your Firebase project.
            </p>
          </div>

          {/* Name field */}
          <motion.div custom={0} variants={fieldVariants} initial="initial" animate="animate" className="w-full">
            <MagnifiedInput
              id="void-name-input"
              icon={User}
              label="Your Name"
              required={true}
              value={name}
              onChange={setName}
              placeholder="e.g. Arjun Mehta"
              autoFocus
              onKeyDown={handleNameKeyDown}
            />
          </motion.div>

          {/* Phone field */}
          <motion.div custom={1} variants={fieldVariants} initial="initial" animate="animate" className="w-full">
            <MagnifiedInput
              id="void-phone-input"
              icon={Phone}
              label="Phone Number"
              required={true}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+91 98765 43210"
              onKeyDown={handlePhoneKeyDown}
            />
          </motion.div>

          {/* UPI ID field */}
          <motion.div custom={2} variants={fieldVariants} initial="initial" animate="animate" className="w-full">
            <MagnifiedInput
              id="void-upi-input"
              icon={AtSign}
              label="Your UPI ID"
              value={upiId}
              onChange={setUpiId}
              placeholder="Optional"
              type="text"
              onKeyDown={handleKeyDown}
            />
            <p className="text-[10px] text-[#3A3A3C] mt-1.5 text-center">
              Used for WhatsApp payment links
            </p>
          </motion.div>

          {/* Error state */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{   opacity: 0, y: -4 }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-glass-sm"
                style={{ background: 'rgba(255,69,58,0.12)', border: '1px solid rgba(255,69,58,0.2)' }}
              >
                <AlertCircle size={14} className="text-[#FF453A] mt-0.5 flex-shrink-0" strokeWidth={2} />
                <p className="text-[#FF453A] text-xs leading-relaxed text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.div custom={3} variants={fieldVariants} initial="initial" animate="animate" className="w-full">
            <motion.button
              onClick={handleSave}
              disabled={!isValid || loading}
              whileTap={isValid && !loading ? { scale: 0.97 } : undefined}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={[
                'w-full flex items-center justify-center gap-2.5',
                'rounded-glass-sm py-3.5 font-semibold text-sm',
                'transition-all duration-200',
                isValid && !loading
                  ? 'bg-[#F5F5F7] text-black cursor-pointer'
                  : 'bg-white/10 text-[#8E8E93] cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <span>Enter VOID</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-[10px] text-[#3A3A3C] mt-5 tracking-wide"
        >
          Your data never leaves your Firebase project.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
