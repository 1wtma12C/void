/**
 * VOID — Layout
 * ─────────────────────────────────────────────────────────────
 * The persistent shell that wraps every page. Provides:
 *
 *   • OLED true-black background edge-to-edge
 *   • Safe-area aware top/bottom padding (iOS notch + home indicator)
 *   • Top header bar: VOID wordmark + Ghost Mode eye toggle
 *   • Bottom Dock: [-] Lend (crimson) and [+] Receive (green) FABs
 *   • Global Cmd+K (desktop) keyboard shortcut → opens input modal
 *   • Page content scrolls between header and dock
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Minus, Plus, Search, Lock } from 'lucide-react';

import { useGhost }      from './contexts/GhostContext';
import { useInputModal } from './contexts/InputModalContext';
import { TX_TYPE }       from './hooks/useTransactions';
import { useContacts }   from './hooks/useContacts';

const SearchModal = lazy(() => import('./components/modals/SearchModal'));

// ── Page transition variants ────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

// ── Dock FAB component ──────────────────────────────────────────
function DockFAB({ type, onClick }) {
  const isLent = type === TX_TYPE.LENT;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      aria-label={isLent ? 'Record a loan (Lend)' : 'Record a receipt (Receive)'}
      className={[
        'flex-1 flex items-center justify-center gap-2 rounded-pill font-semibold text-sm',
        'px-5 py-3 select-none cursor-pointer border min-w-[120px]',
        'backdrop-blur-glass transition-all duration-150',
        isLent
          ? 'bg-[#FF453A]/15 border-[#FF453A]/25 text-[#FF453A]'
          : 'bg-[#32D74B]/15 border-[#32D74B]/25 text-[#32D74B]',
      ].join(' ')}
    >
      {isLent
        ? <Minus size={16} strokeWidth={2.5} />
        : <Plus  size={16} strokeWidth={2.5} />
      }
      <span>{isLent ? 'Lend' : 'Receive'}</span>
    </motion.button>
  );
}

// ── Main Layout ─────────────────────────────────────────────────
export default function Layout({ children }) {
  const { isGhostMode, toggleGhost } = useGhost();
  const { openModal }                = useInputModal();
  const { contacts }                 = useContacts();
  const location                     = useLocation();
  const navigate                     = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isContactPage    = location.pathname.startsWith('/contact/');
  const isVaultPage      = location.pathname === '/vault';
  const currentContactId = isContactPage ? location.pathname.split('/')[2] : null;
  const currentContact   = contacts.find(c => c.id === currentContactId);

  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsInputFocused(true);
      }
    };
    const handleFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsInputFocused(false);
      }
    };
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // ── Cmd+K global shortcut ─────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal]);

  return (
    <div className="flex flex-col min-h-dvh bg-black text-[#F5F5F7] overflow-y-auto overflow-x-hidden">

      {/* ── Top Header ─────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2 pointer-events-none bg-transparent"
      >
        <div className="w-full flex items-center justify-between px-5 pb-3">
          {/* Left: back arrow on sub-pages (not vault), Ghost mode on root */}
          <div className="flex-1 flex justify-start items-center pointer-events-auto">
            {isContactPage ? (
              <motion.button
                onClick={() => navigate(-1)}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex items-center gap-1.5 text-[#8E8E93] cursor-pointer select-none"
                aria-label="Go back"
              >
                <ArrowLeft size={18} strokeWidth={2} />
                <span className="text-sm font-medium">Ledger</span>
              </motion.button>
            ) : isVaultPage ? (
              /* Hide back button in Vault */
              <div className="w-9 h-9" />
            ) : (
              <motion.button
                onClick={toggleGhost}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                aria-label={isGhostMode ? 'Disable ghost mode' : 'Enable ghost mode (hide amounts)'}
                className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer select-none"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <AnimatePresence mode="wait">
                  {isGhostMode ? (
                    <motion.span
                      key="eye-off"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{    opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                    >
                      <EyeOff size={16} strokeWidth={1.75} className="text-[#FF453A]" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="eye"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{    opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Eye size={16} strokeWidth={1.75} className="text-[#8E8E93]" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>

          {/* Center: Floating Logo Pill (Dynamic Island Effect) */}
          <div className="absolute inset-x-0 top-0 pointer-events-none flex items-center justify-center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
            <div className="pointer-events-auto px-6 py-2 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-lg flex items-center justify-center">
              <motion.span
                onClick={() => navigate(isVaultPage ? '/' : '/vault')}
                whileTap={{ scale: 0.95 }}
                className="text-xl font-bold tracking-[-0.04em] text-[#F5F5F7] cursor-pointer select-none"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
              >
                VOID
              </motion.span>
            </div>
          </div>

          {/* Right: Search */}
          <div className="flex-1 flex justify-end items-center pointer-events-auto">
            <motion.button
              onClick={() => setIsSearchOpen(true)}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              aria-label="Search"
              className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer select-none"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Search size={16} strokeWidth={2} className="text-[#8E8E93]" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Scrollable Page Content ─────────────────────────────── */}
      <main
        className="flex-1 relative min-h-dvh mx-auto w-full px-2 md:px-6 flex flex-col items-center justify-center text-center pb-24 overflow-visible pt-24"
        style={{
          paddingTop:    'calc(env(safe-area-inset-top) + 80px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)',
          paddingLeft:   'env(safe-area-inset-left)',
          paddingRight:  'env(safe-area-inset-right)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex flex-col items-center justify-center"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom Floating Dock ────────────────────────────────── */}
      {!isVaultPage && (
        <div className={`fixed left-0 w-full z-50 flex justify-center pointer-events-none transition-all duration-300 ease-in-out bottom-[calc(env(safe-area-inset-bottom,10px)+5px)] ${isInputFocused ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <nav
            className="pointer-events-auto flex items-center gap-4 px-4 py-2 rounded-full backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl w-[90%] max-w-[340px]"
            aria-label="Transaction dock"
          >
            <DockFAB
              type={TX_TYPE.LENT}
              onClick={() => openModal(TX_TYPE.LENT, currentContact)}
            />

            <DockFAB
              type={TX_TYPE.RECEIVED}
              onClick={() => openModal(TX_TYPE.RECEIVED, currentContact)}
            />
          </nav>
        </div>
      )}

      {/* Global Search Modal */}
      <Suspense fallback={null}>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </Suspense>
    </div>
  );
}
