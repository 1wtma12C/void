import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, X, User } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';

const overlayV = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.22 } },
};

const sheetV = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 34 } },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const { contacts } = useContacts();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id) => {
    onClose();
    navigate(`/contact/${id}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={overlayV}
        initial="initial" animate="animate" exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-[90]"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      />

      <motion.div
        key="sheet"
        variants={sheetV}
        initial="initial" animate="animate" exit="exit"
        className="fixed bottom-0 left-0 right-0 z-[95] flex flex-col mx-auto max-w-md w-full h-[85dvh]"
        style={{
          background:    'rgba(14,14,14,0.97)',
          backdropFilter: 'blur(40px)',
          border:        '1px solid rgba(255,255,255,0.08)',
          borderBottom:  'none',
          borderRadius:  '28px 28px 0 0',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
        }}
      >
        <div className="flex flex-col items-center pt-3 pb-1 w-full flex-shrink-0">
          <div className="w-8 h-0.5 rounded-full bg-white/20 mb-2" />
        </div>

        <div className="w-full flex flex-row items-center gap-3 px-6 pb-4 border-b border-white/[0.06] flex-shrink-0 pt-2">
          <div className="flex-1 relative flex items-center bg-white/[0.04] border border-white/[0.06] rounded-xl focus-within:border-white/20 transition-colors">
            <Search size={18} className="absolute left-3.5 text-[#8E8E93]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={(e) => {
                const target = e.target;
                if (window.visualViewport) {
                  const handleResize = () => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    window.visualViewport.removeEventListener('resize', handleResize);
                  };
                  window.visualViewport.addEventListener('resize', handleResize);
                } else {
                  setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                }
              }}
              placeholder="Search contacts..."
              className="w-full bg-transparent border-none outline-none text-[#F5F5F7] text-base font-medium placeholder-[#3A3A3C] py-3 pl-10 pr-10"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 text-[#8E8E93]">
                <X size={16} />
              </button>
            )}
          </div>
          <motion.button 
            onClick={onClose}
            whileTap={{ scale: 0.88 }} 
            className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
            aria-label="Close search"
          >
            <X size={18} className="text-[#8E8E93]" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {query.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <User size={32} className="text-[#3A3A3C] mb-3" />
              <p className="text-[#8E8E93] text-sm">Type a name to search</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <p className="text-[#8E8E93] text-sm">No contacts found for "{query}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredContacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] active:bg-white/[0.05] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] text-[#F5F5F7] font-semibold flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[#F5F5F7] font-medium truncate text-lg">{c.name}</p>
                    {c.phone && <p className="text-[#8E8E93] text-sm truncate">{c.phone}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
