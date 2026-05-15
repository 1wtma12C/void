/**
 * VOID — Unified Input Modal (Cmd+K / Dock trigger)
 * ─────────────────────────────────────────────────────────────
 * Single-page form to create/update contact and log transaction.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence }          from 'framer-motion';
import { X, Minus, Plus, Check, Loader2, User, Phone, Mail, AtSign, AlignLeft, IndianRupee } from 'lucide-react';

import { useInputModal }   from '../../contexts/InputModalContext';
import { useContacts }     from '../../hooks/useContacts';
import { useTransactions, TX_TYPE } from '../../hooks/useTransactions';
import MagnifiedInput      from '../ui/MagnifiedInput';

// ── Variants ────────────────────────────────────────────────────
const overlayV = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.22 } },
};
const sheetV = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0,      opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 34 } },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

// ── Type toggle ─────────────────────────────────────────────────
function TypeToggle({ value, onChange }) {
  return (
    <div className="flex gap-2 mb-6 w-full max-w-sm mx-auto justify-center">
      {[TX_TYPE.LENT, TX_TYPE.RECEIVED].map((t) => {
        const isLent = t === TX_TYPE.LENT;
        const active = value === t;
        return (
          <motion.button
            key={t}
            onClick={() => onChange(t)}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={[
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-pill text-sm font-semibold border',
              'transition-all duration-150 cursor-pointer select-none',
              active && isLent  ? 'bg-[#FF453A]/20 border-[#FF453A]/35 text-[#FF453A]' : '',
              active && !isLent ? 'bg-[#32D74B]/20 border-[#32D74B]/35 text-[#32D74B]' : '',
              !active ? 'bg-white/[0.04] border-white/[0.08] text-[#8E8E93]' : '',
            ].join(' ')}
          >
            {isLent ? <Minus size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
            {isLent ? 'Lend' : 'Receive'}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── MAIN MODAL ───────────────────────────────────────────────────
export default function InputModal() {
  const { isOpen, prefillType, prefillContact, closeModal } = useInputModal();
  const { upsertContact, contacts } = useContacts();
  const { addTransaction } = useTransactions();

  // Form State
  const [txType,  setTxType]  = useState(TX_TYPE.LENT);
  const [amount,  setAmount]  = useState('');
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [email,   setEmail]   = useState('');
  const [upi,     setUpi]     = useState('');
  const [note,    setNote]    = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Apply pre-fills when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setName(prefillContact?.name ?? '');
      setPhone(prefillContact?.phone ?? '');
      setEmail(prefillContact?.email ?? '');
      setUpi(prefillContact?.upiId ?? '');
      setNote('');
      setLoading(false);
      setError('');
      setTxType(prefillType ?? TX_TYPE.LENT);
    }
  }, [isOpen, prefillType, prefillContact]);

  const isValid = Number(amount) > 0 && name.trim().length >= 2;

  // Contact suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update name and suggestions
  const handleNameChange = (val) => {
    setName(val);
    if (val.trim().length >= 1) {
      const matches = contacts.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (c) => {
    setName(c.name);
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setUpi(c.upiId || '');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    
    try {
      // 1. Deduplication Logic: Check for exact case-insensitive match
      const existingContact = contacts.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
      let contactId;

      if (existingContact) {
        // Use existing contact ID, but maybe update their details if they were empty? 
        // For simplicity, we just use the ID.
        contactId = existingContact.id;
      } else {
        // 2. Upsert Contact (returns ID)
        contactId = await upsertContact({
          name: name.trim(),
          phone,
          email,
          upiId: upi,
        });
      }

      // 3. Add Transaction
      await addTransaction({
        contactId,
        amount: Number(amount),
        type: txType,
        note: note.trim()
      });

      closeModal();
    } catch (err) {
      console.error('[VOID] Submit Error:', err);
      setError('Could not record transaction. Check your connection.');
      setLoading(false);
    }
  }, [amount, name, phone, email, upi, note, txType, loading, isValid, upsertContact, addTransaction, closeModal, contacts]);

  const isQuickEntry = !!prefillContact;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={overlayV}
            initial="initial" animate="animate" exit="exit"
            onClick={closeModal}
            className="fixed inset-0 z-[90]"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            variants={sheetV}
            initial="initial" animate="animate" exit="exit"
            className="fixed bottom-0 left-0 right-0 z-[95] flex flex-col items-center mx-auto max-w-md w-full"
            style={{
              background:    'rgba(14,14,14,0.97)',
              backdropFilter: 'blur(40px)',
              border:        '1px solid rgba(255,255,255,0.08)',
              borderBottom:  'none',
              borderRadius:  '28px 28px 0 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              maxHeight:     '92dvh',
              overflow:      'hidden'
            }}
          >
            {/* Handle + header */}
            <div className="flex flex-col items-center justify-center pt-4 pb-2 w-full flex-shrink-0 relative">
              <div className="w-8 h-0.5 rounded-full bg-white/20 mb-3" />
              <p className="text-[#F5F5F7] text-base font-semibold tracking-tight">
                {isQuickEntry ? `Entry for ${prefillContact.name}` : 'New Entry'}
              </p>
              <motion.button
                onClick={closeModal}
                whileTap={{ scale: 0.88 }}
                className="absolute right-5 top-4 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.07)' }}
                aria-label="Close"
              >
                <X size={14} strokeWidth={2} className="text-[#8E8E93]" />
              </motion.button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 w-full flex flex-col items-center">
              
              <TypeToggle value={txType} onChange={setTxType} />
              
              {!isQuickEntry && (
                <div className="w-full flex flex-col gap-5 max-w-sm mx-auto mb-6 relative">
                  <MagnifiedInput
                    id="unified-name"
                    icon={User}
                    label="Contact Name"
                    required={true}
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Rahul Sharma"
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />

                  {/* Custom Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 z-[100] mt-1 glass-modal rounded-xl overflow-hidden shadow-2xl"
                      >
                        {suggestions.slice(0, 5).map(c => (
                          <button
                            key={c.id}
                            onClick={() => selectSuggestion(c)}
                            className="w-full text-left px-4 py-3 border-b border-white/5 last:border-0 active:bg-white/10 flex items-center justify-between"
                          >
                            <span className="text-[#F5F5F7] text-sm font-medium">{c.name}</span>
                            <span className="text-[#8E8E93] text-[10px]">Existing</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="w-full flex flex-col gap-5 max-w-sm mx-auto">
                <MagnifiedInput
                  id="unified-amount"
                  icon={IndianRupee}
                  label="Amount (₹)"
                  type="number"
                  inputMode="decimal"
                  required={true}
                  value={amount}
                  onChange={setAmount}
                  placeholder="0"
                  autoFocus={isQuickEntry}
                />

                <MagnifiedInput
                  id="unified-note"
                  icon={AlignLeft}
                  label="Notes / Description"
                  value={note}
                  onChange={setNote}
                  placeholder="Dinner, rent, trip..."
                />

                {!isQuickEntry && (
                  <>
                    <MagnifiedInput
                      id="unified-phone"
                      icon={Phone}
                      label="Mobile Number"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={setPhone}
                      placeholder="+91 98765 43210"
                    />

                    <MagnifiedInput
                      id="unified-upi"
                      icon={AtSign}
                      label="Contact UPI ID"
                      value={upi}
                      onChange={setUpi}
                      placeholder="rahul@okicici"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />

                    <MagnifiedInput
                      id="unified-email"
                      icon={Mail}
                      label="Email Address"
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="rahul@example.com"
                    />
                  </>
                )}
                
                {error && <p className="text-[#FF453A] text-xs text-center">{error}</p>}
              </div>
            </div>

            {/* Persistent Bottom Action */}
            <div className="flex-shrink-0 px-6 pt-4 w-full border-t border-white/[0.04]">
              <motion.button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                whileTap={isValid && !loading ? { scale: 0.97 } : undefined}
                className="w-full max-w-sm mx-auto py-4 rounded-glass-sm font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                style={{
                  background: isValid && !loading ? (txType === TX_TYPE.LENT ? '#FF453A' : '#32D74B') : 'rgba(255,255,255,0.1)',
                  color: isValid && !loading ? '#000' : '#8E8E93'
                }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                  : <><Check size={16} strokeWidth={2.5} /> Save Log</>
                }
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
